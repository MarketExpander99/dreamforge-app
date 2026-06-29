import type { Metadata } from 'next';

import PublicLegalHeader from '@/components/PublicLegalHeader';

export const metadata: Metadata = {
  title: 'Delivery Policy | Skill Gain',
  description: 'Delivery policy for digital credit top-ups on the Skill Gain Dreamforge platform.',
};

export default function DeliveryPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <PublicLegalHeader />

      <div className="rounded-2xl border bg-white/95 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Delivery Policy</h1>
        <p className="text-muted-foreground mt-2">Last updated: 27 June 2026</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>1. Digital Service Only</h2>
        <p>
          Skill Gain Dreamforge is a digital SaaS platform. Upon successful payment for any credit pack, credits are added directly 
          to your account balance. There is no physical product and no physical delivery involved.
        </p>

        <h2>2. Instant Credit Delivery</h2>
        <p>
          Upon successful payment, credits are added to your account balance instantly or within a few minutes.
        </p>
        <p>
          You can immediately access and use your credits from your dashboard to generate lessons, build learning paths, 
          explore the knowledge lattice, and more.
        </p>

        <h2>3. Confirmation &amp; Access</h2>
        <p>
          A confirmation will be associated with your account. If credits do not appear within a reasonable time after payment, 
          please contact support and we will resolve the issue promptly.
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
