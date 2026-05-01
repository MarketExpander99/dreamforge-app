import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { sampleFeedContent } from '@/lib/sample-content'
import { Search, Filter, TrendingUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const categories = [
  { id: 'all', name: 'All Topics', icon: '🌟', count: 10 },
  { id: 'science', name: 'Science', icon: '🔬', count: 3 },
  { id: 'history', name: 'History', icon: '🏛️', count: 2 },
  { id: 'geography', name: 'Geography', icon: '🌍', count: 2 },
  { id: 'daily-life', name: 'Daily Life', icon: '🏠', count: 3 },
]

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Explore Learning Content</h1>
              <p className="text-muted-foreground">
                Discover new topics and expand your knowledge across various subjects
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search for topics, subjects, or keywords..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={category.id === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto py-2 px-3"
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Featured Content */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Featured Content</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sampleFeedContent.slice(0, 3).map((card) => (
                  <Card key={card.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {card.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {card.likes}
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{card.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {card.content}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{card.readTime} min read</span>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Content */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">All Content</h2>
              </div>

              <div className="space-y-6">
                {sampleFeedContent.map((card) => (
                  <FeedCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
