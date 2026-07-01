// lib/payfast.ts
// PayFast integration helpers (sandbox-first)
// Follows official PayFast docs for signature generation + ITN validation.

import { createHash } from 'crypto'

export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number // ZAR as number for calculations (e.g. 49)
  displayPrice: string // 'R49'
  description: string
  valueNote: string
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 49,
    displayPrice: 'R49',
    description: 'Great way to try lesson cards and Study features.',
    valueNote: '≈ 100 lesson card generations',
  },
  {
    id: 'standard',
    name: 'Standard',
    credits: 500,
    price: 199,
    displayPrice: 'R199',
    description: 'Best value for regular studying. Most popular choice.',
    valueNote: '≈ 500 lesson card generations',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 1000,
    price: 349,
    displayPrice: 'R349',
    description: 'Maximum value. Ideal for power users and families.',
    valueNote: '≈ 1000 lesson card generations',
  },
]

export function getPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find(p => p.id === id)
}

// PayFast sandbox endpoints
export const PAYFAST_URLS = {
  process: 'https://sandbox.payfast.co.za/eng/process',
  // For production (after testing): 'https://www.payfast.co.za/eng/process'
}

// Sandbox merchant details (PUBLIC sandbox credentials — do not use in production)
export const PAYFAST_SANDBOX = {
  merchantId: '10000100',
  merchantKey: '46f0cd694581a',
  // Passphrase is often empty in sandbox. Set via env for live if merchant uses one.
  passphrase: process.env.PAYFAST_PASSPHRASE || '',
}

/**
 * Generate PayFast signature (MD5).
 * Rules:
 * - Only include non-empty values
 * - Sort keys alphabetically
 * - Build string: key1=val1&key2=val2...[&passphrase=xxx]
 * - md5 hex digest, lowercase
 */
export function generateSignature(fields: Record<string, string | number>, passphrase: string = ''): string {
  // Filter empty values and convert to strings
  const filtered: Record<string, string> = {}
  Object.keys(fields).forEach((key) => {
    const val = fields[key]
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      filtered[key] = String(val).trim()
    }
  })

  // Sort keys
  const sortedKeys = Object.keys(filtered).sort()

  // Build parameter string
  let pfString = sortedKeys
    .map((key) => `${key}=${encodeForPayfast(filtered[key])}`)
    .join('&')

  if (passphrase) {
    pfString += `&passphrase=${encodeForPayfast(passphrase)}`
  }

  return createHash('md5').update(pfString).digest('hex')
}

/**
 * PayFast encoding: they expect raw values but specific handling.
 * Most implementations use simple toString. We match common practice.
 */
function encodeForPayfast(value: string): string {
  // PayFast expects the value as-is for hashing (no extra url encode in the string before md5 in most guides)
  // Some strict impls encode, but the standard accepted is direct value.
  return value
}

/**
 * Validate ITN data from PayFast.
 * Rebuilds signature from received data (excluding 'signature' itself) and compares.
 * Returns true if signatures match.
 */
export function validatePayFastSignature(
  received: Record<string, string | string[]>,
  expectedSignature: string,
  passphrase: string = ''
): boolean {
  // Convert to simple record, drop signature
  const fields: Record<string, string | number> = {}
  for (const [key, val] of Object.entries(received)) {
    if (key === 'signature') continue
    const v = Array.isArray(val) ? val[0] : val
    if (v != null) fields[key] = String(v)
  }

  const computed = generateSignature(fields, passphrase)
  return computed.toLowerCase() === String(expectedSignature).toLowerCase()
}

export const PAYFAST_RETURN_URL = '/buy-credits/success'
export const PAYFAST_CANCEL_URL = '/buy-credits' // or a cancel page
export const PAYFAST_NOTIFY_URL = '/api/payfast/notify'

/**
 * Helper to build the data object sent to PayFast (excluding signature).
 * Amount must be string with two decimals.
 */
export function buildPayFastData(params: {
  merchantId: string
  merchantKey?: string // not sent, only used for sig
  mPaymentId: string
  amount: number
  itemName: string
  itemDescription?: string
  nameFirst?: string
  emailAddress?: string
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
}): Record<string, string> {
  const data: Record<string, string> = {
    merchant_id: params.merchantId,
    m_payment_id: params.mPaymentId,
    amount: params.amount.toFixed(2),
    item_name: params.itemName,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    notify_url: params.notifyUrl,
  }

  if (params.itemDescription) data.item_description = params.itemDescription
  if (params.nameFirst) data.name_first = params.nameFirst
  if (params.emailAddress) data.email_address = params.emailAddress

  return data
}
