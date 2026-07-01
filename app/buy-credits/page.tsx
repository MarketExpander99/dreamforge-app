'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/user-context'
import { initiatePayFastPurchase } from '@/app/actions/payfast'
import { CREDIT_PACKS, CreditPack } from '@/lib/payfast'
import { getUserCredits } from '@/app/actions/paths'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function BuyCreditsPage() {
  const router = useRouter()
  const { user, authLoading } = useAuth()

  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentCredits, setCurrentCredits] = useState<number>(25)
  const [creditsLoading, setCreditsLoading] = useState(true)

  // Redirect unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  // Load current balance
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setCreditsLoading(true)
      const res = await getUserCredits()
      if (typeof res.credits === 'number') setCurrentCredits(res.credits)
      setCreditsLoading(false)
    }
    load()
  }, [user])

  const handleSelect = (pack: CreditPack) => {
    setSelectedPack(pack)
  }

  const handleBuyNow = async () => {
    if (!selectedPack || !user) return

    setIsLoading(true)

    try {
      const result = await initiatePayFastPurchase(selectedPack.id)

      if (!result.success || !result.formFields || !result.payfastUrl) {
        toast.error(result.error || 'Failed to start payment')
        setIsLoading(false)
        return
      }

      // Create and submit hidden form to PayFast (standard redirect flow)
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = result.payfastUrl
      form.style.display = 'none'

      Object.entries(result.formFields).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
      // Form submission will navigate away to PayFast sandbox
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong preparing the payment.')
      setIsLoading(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/paths"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Study</Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-emerald-600" />
                Buy Credits
              </h1>
              <p className="text-muted-foreground mt-1">Instantly add credits to power more lesson cards</p>
            </div>
          </div>

          {/* Live balance */}
          <div className="hidden md:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-xl text-sm shrink-0">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold tabular-nums">{creditsLoading ? '...' : currentCredits}</span>
            <span className="text-xs text-muted-foreground">credits available</span>
          </div>
        </div>

        {/* Value proposition */}
        <div className="mb-8 rounded-2xl border bg-zinc-50 dark:bg-zinc-900/50 p-6 text-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium mb-1">How credits work</div>
              <p className="text-muted-foreground">Each credit unlocks one high-quality AI-generated lesson card inside any of your saved Study paths. Credits never expire and are only consumed on successful generation.</p>
            </div>
          </div>
        </div>

        {/* Packs */}
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {CREDIT_PACKS.map((pack) => {
            const isSelected = selectedPack?.id === pack.id
            return (
              <Card
                key={pack.id}
                onClick={() => handleSelect(pack)}
                className={`cursor-pointer border transition-all active:scale-[0.985] ${isSelected ? 'ring-2 ring-[#0078D4] border-[#0078D4] shadow-md' : 'hover:border-zinc-400 dark:hover:border-zinc-600'}`}
              >
                {pack.id === 'standard' && (
                  <div className="absolute -top-2 right-4">
                    <Badge className="bg-emerald-600 text-white text-[10px]">Most popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-baseline justify-between">
                    <CardTitle className="text-2xl">{pack.name}</CardTitle>
                    <div className="text-right">
                      <div className="text-3xl font-semibold tabular-nums">{pack.displayPrice}</div>
                    </div>
                  </div>
                  <div className="text-lg font-medium text-emerald-700 dark:text-emerald-400 mt-1">
                    {pack.credits} credits
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-3">{pack.description}</div>

                  <div className="mb-3 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                    {pack.valueNote}
                  </div>

                  <ul className="space-y-1.5 text-sm">
                    <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" /> 1 credit = 1 lesson card</li>
                    <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" /> Never expires</li>
                    <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" /> Instant delivery on success</li>
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Action */}
        <div className="max-w-md mx-auto text-center">
          <Button
            size="lg"
            className="w-full md:w-auto px-12"
            onClick={handleBuyNow}
            disabled={!selectedPack || isLoading}
          >
            {isLoading ? (
              <> <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to PayFast... </>
            ) : selectedPack ? (
              `Buy ${selectedPack.name} — ${selectedPack.displayPrice}`
            ) : (
              'Select a pack above'
            )}
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            You will be redirected to PayFast (sandbox for now) to complete payment securely.<br />
            After success you will return here and credits will be added automatically.
          </p>

          <div className="mt-6">
            <Link href="/paths" className="text-sm text-muted-foreground hover:underline">Or return to Study without buying</Link>
          </div>
        </div>

        {/* Small legal note */}
        <div className="mt-16 text-center text-[11px] text-zinc-500">
          Payments processed securely by PayFast. See our <Link href="/refund" className="underline">Refund Policy</Link> and <Link href="/delivery" className="underline">Delivery Policy</Link>.
        </div>
      </main>
    </div>
  )
}
