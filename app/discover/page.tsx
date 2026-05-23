// app/discover/page.tsx
'use client';

import { Navigation } from '@/components/navigation';

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      
      <div className="md:pl-64">
        <main className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <h1 className="text-6xl font-bold tracking-tight mb-6">
              Discover the Lattice
            </h1>
            <p className="text-2xl text-muted-foreground max-w-md">
              Infinite E8 Knowledge Lattice • Powered by Grok
            </p>
            <p className="mt-8 text-muted-foreground">
              Search any topic or component to begin exploring
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}