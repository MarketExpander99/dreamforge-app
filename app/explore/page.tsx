import { Suspense } from 'react'
import { Navigation } from '@/components/navigation'
import { ExploreGraph } from '@/components/explore-graph'
import { Search, Filter, List, Network } from 'lucide-react'

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const initialQuery = params.q || ''

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Discover</h1>
              <p className="text-muted-foreground">
                Search any topic and explore its components, connections, and real-world uses
              </p>
            </div>

            <Suspense
              fallback={
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Discover...</p>
                  </div>
                </div>
              }
            >
              <ExploreGraph initialQuery={initialQuery} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}