import type { Metadata } from 'next';

import PublicLegalHeader from '@/components/PublicLegalHeader';

export const metadata: Metadata = {
  title: 'Delivery Policy | Skill Gain',
  description: 'How credits are delivered after purchase on the Skill Gain Dreamforge platform.',
};

export default function DeliveryPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <PublicLegalHeader />

      <div className="rounded-2xl border bg-white/95 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Delivery Policy</h1>
        <p className="text-muted-foreground mt-2">Last updated: 29 June 2026</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>1. Digital Delivery Only</h2>
        <p>
          Skill Gain is a digital platform. All purchases are for credits that unlock on-demand AI learning tools. 
          There is no physical product or shipping involved.
        </p>

        <h2>2. Instant Credit Delivery</h2>
        <p>
          Upon successful payment confirmation, credits are added to your account balance <strong>instantly</strong> 
          (or within a few minutes). You can immediately use them in your dashboard to generate learning paths, 
          lesson cards, and explore knowledge your way.
        </p>

        <h2>3. Checking Your Balance</h2>
        <p>
          Your current credit balance is always visible in your account dashboard after logging in.
        </p>

        <h2>4. Issues with Delivery</h2>
        <p>
          If credits do not appear in your account within 15 minutes of a successful payment, please contact 
          support@skill-gain.com with your transaction reference. We will investigate and resolve the issue promptly.
        </p>

        <h2>5. No Physical Delivery</h2>
        <p>
          This policy applies only to digital credit top-ups. There are no physical goods or course materials shipped.
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
