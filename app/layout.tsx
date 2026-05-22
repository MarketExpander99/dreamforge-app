import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Skill Gain — Discover the Lattice',
  description: 'Powered by Grok • E8 Knowledge Lattice',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-zinc-950">
          {/* Navigation (Sidebar + Mobile Bottom Nav) */}
          <Navigation />

          {/* Main Content Area */}
          <main className="flex-1 lg:ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}