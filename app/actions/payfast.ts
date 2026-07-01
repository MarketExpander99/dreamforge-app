'use server'

import { createClient, createServiceClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { CREDIT_PACKS, buildPayFastData, generateSignature, PAYFAST_URLS, PAYFAST_SANDBOX, PAYFAST_RETURN_URL, PAYFAST_CANCEL_URL, PAYFAST_NOTIFY_URL, getPackById } from '@/lib/payfast'

export interface InitiatePurchaseResult {
  success: boolean
  error?: string
  payfastUrl?: string
  formFields?: Record<string, string>
  mPaymentId?: string
}

/**
 * Creates a pending purchase record and returns everything needed to POST a form to PayFast.
 * Must be called from an authenticated server action.
 */
export async function initiatePayFastPurchase(packId: string): Promise<InitiatePurchaseResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be signed in to purchase credits' }
    }

    const pack = getPackById(packId)
    if (!pack) {
      return { success: false, error: 'Invalid pack selected' }
    }

    const now = Date.now()
    const mPaymentId = `${user.id.slice(0, 8)}-${pack.id}-${now}`

    // 1. Create pending transaction (RLS allows insert by owner)
    const { error: insertErr } = await supabase
      .from('credit_purchases')
      .insert({
        user_id: user.id,
        pack_id: pack.id,
        credits: pack.credits,
        amount: pack.price,
        currency: 'ZAR',
        status: 'pending',
        m_payment_id: mPaymentId,
        item_name: `Skill Gain ${pack.name} Pack - ${pack.credits} credits`,
      })

    if (insertErr) {
      console.error('Failed to create pending purchase:', insertErr)
      return { success: false, error: 'Could not start purchase. Please try again.' }
    }

    // 2. Build PayFast fields (server side — signature stays secret)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const pfData = buildPayFastData({
      merchantId: PAYFAST_SANDBOX.merchantId,
      mPaymentId,
      amount: pack.price,
      itemName: `Skill Gain ${pack.name} - ${pack.credits} Credits`,
      itemDescription: `${pack.credits} credits for AI lesson generation on Skill Gain`,
      nameFirst: (user.user_metadata?.full_name || user.email?.split('@')[0]) as string | undefined,
      emailAddress: user.email || undefined,
      returnUrl: `${baseUrl}${PAYFAST_RETURN_URL}`,
      cancelUrl: `${baseUrl}${PAYFAST_CANCEL_URL}`,
      notifyUrl: `${baseUrl}${PAYFAST_NOTIFY_URL}`,
    })

    // Generate signature with sandbox passphrase (usually empty)
    const signature = generateSignature(pfData, PAYFAST_SANDBOX.passphrase)
    const formFields = { ...pfData, signature }

    return {
      success: true,
      payfastUrl: PAYFAST_URLS.process,
      formFields,
      mPaymentId,
    }
  } catch (err) {
    console.error('initiatePayFastPurchase error:', err)
    return { success: false, error: 'Unexpected error preparing payment' }
  }
}

/**
 * Internal: Add credits after successful verified payment.
 * Called only from the secure ITN webhook using service role.
 * Idempotent: will not double-add if already completed.
 */
export async function addCreditsAfterPayment(
  mPaymentId: string,
  payfastPaymentId: string,
  creditsToAdd: number,
  amountPaid: number
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  try {
    const service = createServiceClient()

    // Find the purchase
    const { data: purchase, error: findErr } = await service
      .from('credit_purchases')
      .select('*')
      .eq('m_payment_id', mPaymentId)
      .maybeSingle()

    if (findErr || !purchase) {
      console.error('Purchase lookup failed for ITN', findErr)
      return { success: false, error: 'Purchase not found' }
    }

    if (purchase.status === 'completed') {
      // Already credited — safe to acknowledge
      return { success: true }
    }

    if (purchase.credits !== creditsToAdd) {
      console.warn('Credit amount mismatch on ITN', { expected: purchase.credits, got: creditsToAdd })
    }

    // Update purchase status first
    await service
      .from('credit_purchases')
      .update({
        status: 'completed',
        payfast_payment_id: payfastPaymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.id)

    // Add credits to profile
    const { data: profile } = await service
      .from('profiles')
      .select('credits_balance')
      .eq('id', purchase.user_id)
      .maybeSingle()

    const current = typeof (profile as any)?.credits_balance === 'number' ? (profile as any).credits_balance : 25
    const newBalance = current + creditsToAdd

    const { error: creditErr } = await service
      .from('profiles')
      .update({
        credits_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', purchase.user_id)

    if (creditErr) {
      console.error('Failed to add credits during ITN:', creditErr)
      // Roll back status? For now we leave as completed and log.
      return { success: false, error: 'Failed to credit account' }
    }

    // Revalidate pages that show balance
    revalidatePath('/paths')
    revalidatePath('/discover')
    revalidatePath('/buy-credits')
    revalidatePath('/profile')

    return { success: true, newBalance }
  } catch (err) {
    console.error('addCreditsAfterPayment exception:', err)
    return { success: false, error: 'Server error applying credits' }
  }
}

/**
 * Get recent purchases for the current user (used on success page if desired)
 */
export async function getUserPurchases(limit = 5) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { purchases: [], error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('credit_purchases')
    .select('id, pack_id, credits, amount, status, created_at, payfast_payment_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { purchases: [], error: error.message }

  return { purchases: data || [] }
}
