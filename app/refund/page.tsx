import type { Metadata } from 'next';

import PublicLegalHeader from '@/components/PublicLegalHeader';

export const metadata: Metadata = {
  title: 'Refund &amp; Cancellation Policy | Skill Gain',
  description: 'Refund and cancellation policy for credit purchases on the Skill Gain Dreamforge platform.',
};

export default function RefundPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <PublicLegalHeader />

      <div className="rounded-2xl border bg-white/95 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Refund &amp; Cancellation Policy</h1>
        <p className="text-muted-foreground mt-2">Last updated: 29 June 2026</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>1. Credit-Based Model</h2>
        <p>
          Skill Gain operates on a credit system. Users purchase credits to access on-demand AI-powered learning tools. 
          Credits are digital and non-transferable.
        </p>

        <h2>2. General Refund Policy</h2>
        <p>
          Credit purchases are generally final. Once credits have been used to generate content or access features, 
          they are considered consumed and are non-refundable.
        </p>

        <h2>3. Unused Credits</h2>
        <p>
          Requests for refunds on unused credits will be considered within <strong>14 days</strong> of purchase 
          in cases of technical issues or exceptional circumstances, at our discretion. Change of mind after 
          purchase does not qualify for a refund.
        </p>

        <h2>4. How to Request a Refund Review</h2>
        <p>
          Please email <strong>support@skill-gain.com</strong> with your purchase details and reason for the request. 
          We aim to respond within 5 business days.
        </p>

        <h2>5. Cancellations</h2>
        <p>
          There are currently no recurring subscriptions. All credit purchases are one-time top-ups.
        </p>
      </div>

      </div>

      <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
        Skill Gain (Pty) Ltd • Ladismith, Western Cape, South Africa<br />
        Email: support@skill-gain.com • Phone: +27 (0)28 551 0088
      </div>
    </main>
  );
}
