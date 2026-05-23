'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ExploreGraph } from '@/components/explore-graph'
import { Search, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ExploreClient({ initialQuery }: { initialQuery: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push(`/explore?q=${encodeURIComponent(trimmed)}`, { scroll: false })
    }
  }

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || initialQuery)
  }, [searchParams, initialQuery])

  return (
    <div>
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
      </form>

      <div className="mb-8">
        <Button variant="default" size="sm">
          <Network className="h-4 w-4 mr-2" />
          Graph View
        </Button>
      </div>

      <ExploreGraph initialQuery={searchQuery} />
    </div>
  )
}