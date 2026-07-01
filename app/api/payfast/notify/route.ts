// app/api/payfast/notify/route.ts
// PayFast Instant Transaction Notification (ITN) handler
// This is the most critical piece — it securely adds credits after payment.

import { NextRequest } from 'next/server'
import { addCreditsAfterPayment } from '@/app/actions/payfast'
import { validatePayFastSignature, PAYFAST_SANDBOX } from '@/lib/payfast'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // PayFast sends application/x-www-form-urlencoded
    const formData = await request.formData()
    const data: Record<string, string> = {}

    formData.forEach((value, key) => {
      data[key] = String(value)
    })

    console.log('[PayFast ITN] Received notification:', {
      m_payment_id: data.m_payment_id,
      payment_status: data.payment_status,
      amount_gross: data.amount_gross,
      pf_payment_id: data.pf_payment_id,
    })

    // 1. Basic required fields check
    if (!data.m_payment_id || !data.payment_status || !data.signature) {
      console.warn('[PayFast ITN] Missing required fields')
      return new Response('FAIL', { status: 200 })
    }

    // 2. Signature validation (critical security step)
    const isValid = validatePayFastSignature(data, data.signature, PAYFAST_SANDBOX.passphrase)

    if (!isValid) {
      console.error('[PayFast ITN] Signature validation FAILED for', data.m_payment_id)
      return new Response('FAIL', { status: 200 })
    }

    // 3. Only process successful payments
    if (data.payment_status !== 'COMPLETE') {
      console.log('[PayFast ITN] Payment not complete. Status:', data.payment_status)
      // Still acknowledge so PayFast doesn't keep retrying
      return new Response('OK', { status: 200 })
    }

    const amountGross = parseFloat(data.amount_gross || '0')
    const credits = parseInt(data.custom_str1 || data.item_name?.match(/\d+/)?.[0] || '0', 10) || 0

    // We rely on our stored purchase for the exact credit count.
    // But we can pass the reported amount as extra validation later.

    // 4. Credit the user (idempotent inside the action)
    const result = await addCreditsAfterPayment(
      data.m_payment_id,
      data.pf_payment_id || '',
      credits || 0, // will be corrected by stored purchase amount in action
      amountGross
    )

    if (!result.success) {
      console.error('[PayFast ITN] Failed to apply credits:', result.error)
      // Still return OK to PayFast (they may retry). We logged the issue.
    } else {
      console.log('[PayFast ITN] Successfully credited purchase', data.m_payment_id)
    }

    // Always respond with OK once we have validated the ITN.
    // PayFast treats non-OK responses as failure and may retry.
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[PayFast ITN] Unhandled error:', err)
    // Return OK anyway to stop PayFast retries. Error is logged for manual review.
    return new Response('OK', { status: 200 })
  }
}

// PayFast also sometimes sends GET — acknowledge politely
export async function GET() {
  return new Response('OK', { status: 200 })
}
