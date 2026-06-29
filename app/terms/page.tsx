import type { Metadata } from 'next';

import PublicLegalHeader from '@/components/PublicLegalHeader';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Skill Gain',
  description: 'Terms and conditions for using the Skill Gain Dreamforge platform and credit system.',
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <PublicLegalHeader />

      <div className="rounded-2xl border bg-white/95 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Terms &amp; Conditions</h1>
        <p className="text-muted-foreground mt-2">Last updated: 27 June 2026</p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <h2>1. Introduction</h2>
        <p>
          These Terms &amp; Conditions (“Terms”) govern your access to and use of the Skill Gain Dreamforge platform (“Platform”), 
          operated by Skill Gain (Pty) Ltd. By purchasing credits or using the Platform, you agree to these Terms.
        </p>

        <h2>2. Our Model – Credit-Based Access</h2>
        <p>
          Skill Gain provides a credit-based system. Users purchase credits to access on-demand AI-powered tools including 
          personalized learning path generation, lattice exploration, lesson card creation, and progress tracking. 
          We do not sell fixed courses or guarantee specific educational outcomes or results.
        </p>

        <h2>3. Acceptable Use</h2>
        <p>
          You agree to use the Platform responsibly and not for any unlawful purpose. AI-generated content is provided 
          as a learning aid and should be verified by the user where appropriate.
        </p>

        <h2>4. Account &amp; Credits</h2>
        <p>
          Credits are non-transferable and tied to your account. Unused credits remain available until used or expired 
          according to the purchased pack terms.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          All content, designs, and AI tools on the Platform are owned by Skill Gain or its licensors. 
          You retain ownership of content you create using the Platform, subject to these Terms.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          The Platform is provided “as is”. Skill Gain is not liable for any indirect, incidental, or consequential 
          damages arising from use of the service.
        </p>

        <h2>7. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use after changes constitutes acceptance.
        </p>

        <h2>8. Contact</h2>
        <p>
          For any questions regarding these Terms, please contact us at the details below.
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
