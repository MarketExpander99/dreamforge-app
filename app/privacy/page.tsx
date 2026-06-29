import type { Metadata } from 'next';

import PublicLegalHeader from '@/components/PublicLegalHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy | Skill Gain',
  description: 'Privacy policy for the Skill Gain Dreamforge platform, including POPIA compliance and data practices.',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <PublicLegalHeader />

      <div className="rounded-2xl border bg-white/95 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">Last updated: 27 June 2026</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>1. Data We Collect</h2>
        <p>
          We collect personal information when you create an account via Supabase Auth (including email address and user identifiers). 
          We also collect usage data such as your learning progress, explorations on the knowledge lattice, generated lesson interactions, 
          profile details you provide (e.g. grade level, interests, display name preferences), and technical information necessary to operate the service.
        </p>

        <h2>2. How We Use Data</h2>
        <p>
          Your data is used to personalize your learning experience, track and display progress, generate tailored AI-powered lesson content and learning paths, 
          provide recommendations, and improve the overall Platform. We do not sell your personal data to third parties.
        </p>

        <h2>3. POPIA Compliance (South Africa)</h2>
        <p>
          Skill Gain (Pty) Ltd complies with the Protection of Personal Information Act (POPIA). We process personal information lawfully, 
          fairly, and transparently. We collect only what is necessary, keep it secure, and respect your rights to access, correct, or delete your information.
        </p>

        <h2>4. Data Retention &amp; Deletion</h2>
        <p>
          We retain personal data only for as long as necessary to provide the service, comply with legal obligations, or resolve disputes. 
          You may request deletion of your account and associated data at any time. Upon verified request we will delete or anonymise your data, 
          subject to any legal retention requirements.
        </p>

        <h2>5. Contact for Data Requests</h2>
        <p>
          To request access to your data, corrections, deletion, or to exercise any other rights under POPIA, please contact us using the details below. 
          We aim to respond within a reasonable timeframe.
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
