'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Sparkles } from 'lucide-react';

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: string; // ZAR placeholder for teaser
  priceNote?: string;
  benefits: string[];
  popular?: boolean;
  valueNote: string;
}

const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 50,
    price: 'R 29',
    benefits: [
      '50 lesson card generations',
      'Perfect for trying Study features',
      'Credits never expire',
    ],
    valueNote: 'Great for first-time users exploring lesson cards.',
  },
  {
    id: 'standard',
    name: 'Standard',
    credits: 150,
    price: 'R 79',
    popular: true,
    benefits: [
      '150 lesson card generations',
      'Best everyday value',
      'Unlock full Study paths + progress',
    ],
    valueNote: 'Most popular. Enough for consistent weekly studying.',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 500,
    price: 'R 199',
    priceNote: 'Best value',
    benefits: [
      '500 lesson card generations',
      'Maximum savings per credit',
      'Ideal for families or heavy use',
    ],
    valueNote: 'Best per-credit price. Power through many paths.',
  },
];

interface CreditPurchaseModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentCredits?: number;
}

export default function CreditPurchaseModal({ open, setOpen, currentCredits = 25 }: CreditPurchaseModalProps) {
  const router = useRouter();
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPack = (pack: CreditPack) => {
    setSelectedPack(pack);
  };

  const handlePurchase = () => {
    // Phase 5: Real PayFast flow lives on the dedicated page for proper redirects + ITN.
    // Close modal and take user to the full checkout experience.
    setOpen(false);
    setSelectedPack(null);

    // Preserve selected pack in query for convenience (optional enhancement)
    const target = selectedPack ? `/buy-credits` : '/buy-credits';
    router.push(target);
  };

  const handleClose = () => {
    setSelectedPack(null);
    setIsProcessing(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl tracking-tight">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            Buy Credits
          </DialogTitle>
          <DialogDescription>
            Credits power AI lesson card generation inside your Study paths. 1 credit = 1 lesson card.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2">
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="text-muted-foreground">Current balance</div>
            <div className="font-semibold tabular-nums flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-600" /> {currentCredits} credits
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {CREDIT_PACKS.map((pack) => {
              const isSelected = selectedPack?.id === pack.id;
              return (
                <Card
                  key={pack.id}
                  className={`cursor-pointer border transition-all active:scale-[0.985] ${isSelected ? 'ring-2 ring-[#0078D4] border-[#0078D4]' : 'hover:border-zinc-400 dark:hover:border-zinc-600'} ${pack.popular ? 'relative' : ''}`}
                  onClick={() => handleSelectPack(pack)}
                >
                  {pack.popular && (
                    <div className="absolute -top-2 right-3">
                      <Badge className="bg-emerald-600 text-white text-[10px] px-2">Most popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-baseline justify-between">
                      <CardTitle className="text-lg">{pack.name}</CardTitle>
                      <div className="text-right">
                        <div className="text-xl font-semibold tabular-nums">{pack.price}</div>
                        {pack.priceNote && <div className="text-[10px] text-emerald-600">{pack.priceNote}</div>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {pack.credits} credits
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm space-y-2">
                    <div className="font-medium text-emerald-700 dark:text-emerald-400">{pack.valueNote}</div>
                    <ul className="space-y-1 text-muted-foreground text-[13px]">
                      {pack.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-1 text-[11px] text-zinc-500">
                      ≈ {pack.credits} lesson cards
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 px-3 py-2.5 text-xs text-muted-foreground">
            <Sparkles className="inline h-3.5 w-3.5 mr-1 text-amber-500" />
            Credits are used only when you successfully generate a lesson card in a saved path. No subscription.
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-zinc-50/60 dark:bg-zinc-950/40 flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="sm:mr-auto">
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!selectedPack}
            className="min-w-[160px]"
          >
            {selectedPack ? `Buy ${selectedPack.name} — ${selectedPack.price}` : 'Select a pack above'}
          </Button>
        </DialogFooter>

        <div className="px-6 pb-5 text-[10px] text-center text-zinc-400">
          Full PayFast checkout available on the dedicated Buy Credits page.
        </div>
      </DialogContent>
    </Dialog>
  );
}
