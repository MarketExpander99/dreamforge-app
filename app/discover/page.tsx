import { Navigation } from '@/components/navigation'
import { ExploreGraph } from '@/components/explore-graph'

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-8 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl font-bold mb-3">Discover</h1>
              <p className="text-xl text-muted-foreground">
                Search any topic and explore its components and real-world uses
              </p>
            </div>

            <ExploreGraph />
          </div>
        </main>
      </div>
    </div>
  )
}