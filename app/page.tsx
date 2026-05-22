'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect to avoid server-side redirect loops
    router.replace('/discover');
  }, [router]);

  // Optional loading state while redirecting
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-zinc-400">Loading Discover Lattice...</p>
    </div>
  );
}