import type { Metadata } from 'next';

import PublicLegalHeader from '@/components/PublicLegalHeader';

export const metadata: Metadata = {
  title: 'Privacy Policy | Skill Gain',
  description: 'How Skill Gain collects, uses, and protects your data on the Dreamforge platform.',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <PublicLegalHeader />

      <div className="rounded-2xl border bg-white/95 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">Last updated: 29 June 2026</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>1. Introduction</h2>
        <p>
          Skill Gain (Pty) Ltd (“we”, “us”) respects your privacy. This Privacy Policy explains how we collect, 
          use, and protect your personal information when you use the Dreamforge platform.
        </p>

        <h2>2. Information We Collect</h2>
        <p>
          We collect information you provide directly (name, email, profile details) and usage data through Supabase 
          (authentication, learning progress, credit transactions, and feature usage). We do not sell your data.
        </p>

        <h2>3. How We Use Your Information</h2>
        <p>
          We use your data to provide and improve the Dreamforge experience — including personalized learning paths, 
          progress tracking, AI-generated content, and credit balance management. We may also send important service 
          notifications.
        </p>

        <h2>4. Data Sharing</h2>
        <p>
          We only share data with trusted service providers (e.g. Supabase, payment processors) necessary to operate 
          the platform. We never sell personal data to third parties.
        </p>

        <h2>5. POPIA Compliance (South Africa)</h2>
        <p>
          We process personal information in accordance with the Protection of Personal Information Act (POPIA). 
          You have the right to access, correct, or request deletion of your data.
        </p>

        <h2>6. Data Security &amp; Retention</h2>
        <p>
          We use industry-standard security measures. Data is retained only as long as necessary to provide the service 
          or meet legal obligations.
        </p>

        <h2>7. Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal information at any time by contacting us.
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
