import type { Metadata } from 'next';

import PublicLegalHeader from '@/components/PublicLegalHeader';

export const metadata: Metadata = {
  title: 'Refund Policy | Skill Gain',
  description: 'Refund policy for credit purchases on the Skill Gain Dreamforge platform.',
};

export default function RefundPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <PublicLegalHeader />

      <div className="rounded-2xl border bg-white/95 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Refund Policy</h1>
        <p className="text-muted-foreground mt-2">Last updated: 27 June 2026</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>1. Credit-Based Model</h2>
        <p>
          Skill Gain Dreamforge uses a flexible credit system. Users purchase credits to unlock on-demand AI tools including 
          personalized learning paths, lattice exploration, lesson content generation, and progress features. 
          We do not sell fixed courses.
        </p>

        <h2>2. Refund Policy for Credits</h2>
        <p>
          Credits are generally non-refundable once used.
        </p>
        <p>
          Unused credits: refund requests will be considered within 14 days of purchase for technical issues or other exceptional circumstances, 
          at Skill Gain’s sole discretion.
        </p>
        <p>
          No refunds are provided for change of mind after credits have been used.
        </p>

        <h2>3. How to Request a Refund Review</h2>
        <p>
          To request a review of a potential refund for unused credits, please contact support with your purchase details and reason. 
          We will assess each request fairly and respond promptly.
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
