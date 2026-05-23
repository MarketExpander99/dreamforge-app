'use client'
//'HERE IT IS'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ExploreGraph } from '@/components/explore-graph'
import { Search, Filter, List, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ExploreClient({ initialQuery }: { initialQuery: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph')
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push(`/explore?q=${encodeURIComponent(trimmed)}`)
    }
  }

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || initialQuery)
  }, [searchParams, initialQuery])

  return (
    <>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a topic (e.g. PC, Tesla Model 3, Cheeseburger)"
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline" className="sm:w-auto">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button type="button" variant="outline" className="sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </form>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4 mr-2" />
          List View
        </Button>
        <Button
          variant={viewMode === 'graph' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('graph')}
        >
          <Network className="h-4 w-4 mr-2" />
          Graph View
        </Button>
      </div>

      {viewMode === 'graph' ? (
        <ExploreGraph initialQuery={searchQuery} />
      ) : (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-muted-foreground">List view coming soon in Phase 1</p>
          <Button onClick={() => setViewMode('graph')} className="mt-4">
            Switch to Graph View
          </Button>
        </div>
      )}
    </>
  )
}