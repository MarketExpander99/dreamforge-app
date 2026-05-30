import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/navigation';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Skill Gain — Discover',
  description: 'Powered by Grok • Gamified Learning for Students & Parents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen bg-zinc-950">
            {/* Navigation (Sidebar + Mobile Bottom Nav) */}
            <Navigation />

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 min-h-screen">
              {children}
            </main>
          </div>

          {/* Global Toaster - placed inside Providers for full toast support across feed, learning, and discover */}
          <Toaster position="top-center" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}