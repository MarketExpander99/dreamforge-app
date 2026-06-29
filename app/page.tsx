'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/user-context';
import LandingPage from '@/app/components/LandingPage';

export default function HomePage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();

  useEffect(() => {
    // Logged-in users go to the app; public visitors see the marketing landing
    if (!authLoading && user) {
      router.replace('/discover');
    }
  }, [authLoading, user, router]);

  // While checking auth, show neutral loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  // Authenticated users are redirected above
  if (user) {
    return null;
  }

  // Public visitors see the full marketing landing (with credit model + legal links)
  return <LandingPage />;
}