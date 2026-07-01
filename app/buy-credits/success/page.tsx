'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/user-context'
import { getUserCredits } from '@/app/actions/paths'
import { getUserPurchases } from '@/app/actions/payfast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, CreditCard, ArrowRight } from 'lucide-react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, authLoading } = useAuth()

  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentPurchase, setRecentPurchase] = useState<any>(null)

  const pfPaymentId = searchParams.get('pf_payment_id') || searchParams.get('payment_id')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    const load = async () => {
      setLoading(true)
      const bal = await getUserCredits()
      if (typeof bal.credits === 'number') setCredits(bal.credits)

      // Try to fetch the most recent completed purchase (good enough for confirmation)
      const { purchases } = await getUserPurchases(1)
      if (purchases.length > 0) {
        setRecentPurchase(purchases[0])
      }
      setLoading(false)
    }

    if (user) load()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
          <p className="mt-4 text-muted-foreground">Confirming your purchase...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center">
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-3">Payment successful!</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Thank you. Your credits have been added to your account.
        </p>

        <Card className="border-0 shadow-sm mb-8 text-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" /> Your account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline border-b pb-4">
              <div className="text-muted-foreground">New credit balance</div>
              <div className="text-4xl font-semibold tabular-nums">{credits ?? '—'} <span className="text-base font-normal text-muted-foreground">credits</span></div>
            </div>

            {recentPurchase && (
              <div className="text-sm space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pack</span>
                  <span className="font-medium">{recentPurchase.pack_id} — {recentPurchase.credits} credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>R{recentPurchase.amount}</span>
                </div>
                {pfPaymentId && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>PayFast reference</span>
                    <span className="font-mono">{pfPaymentId}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 text-xs text-muted-foreground">
              Credits are available immediately for generating lesson cards in your Study paths.
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/paths">
              Go to Study <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/discover">Continue exploring in Discover</Link>
          </Button>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          If your balance does not reflect the purchase within a few minutes, please contact support with your reference.
        </p>
      </main>
    </div>
  )
}

export default function BuyCreditsSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
