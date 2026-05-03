import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { getCategories, getContentItems, Category, ContentItem } from '@/lib/data'
import { Search, Filter, TrendingUp, Star, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ExplorePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const resolvedSearchParams = await searchParams
  const categoryParam = resolvedSearchParams.category as string | undefined
  const searchQuery = resolvedSearchParams.q as string | undefined

  let categories: Category[] = []
  let featuredContent: ContentItem[] = []
  let allContent: ContentItem[] = []

  try {
    // Fetch data from database with error handling
    const results = await Promise.allSettled([
      getCategories(),
      getContentItems({ featured: true, limit: 3 }),
      getContentItems({
        limit: 20,
        category: categoryParam && categoryParam !== 'all' ? categoryParam : undefined,
        search: searchQuery
      })
    ])

    categories = results[0].status === 'fulfilled' ? results[0].value : []
    featuredContent = results[1].status === 'fulfilled' ? results[1].value : []
    allContent = results[2].status === 'fulfilled' ? results[2].value : []
  } catch (error) {
    console.error('Database connection error in explore page:', error)
    // Continue with empty arrays
  }

  // Create category stats (in real app, this would be calculated from database)
  const categoryStats = categories.map(category => ({
    ...category,
    count: allContent.filter(content => content.category_id === category.id).length
  }))

  const allCategory = {
    id: 'all',
    name: 'All Topics',
    description: 'All available learning content',
    icon: '🌟',
    color: 'blue',
    created_at: new Date().toISOString(),
    count: allContent.length
  }

  const displayCategories = [allCategory, ...categoryStats]

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
              <form className="flex flex-col sm:flex-row gap-4" action="/explore" method="GET">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    name="q"
                    placeholder="Search for topics, subjects, or keywords..."
                    className="pl-10"
                    defaultValue={searchQuery || ''}
                  />
                </div>
                <Button type="submit" variant="outline" className="sm:w-auto">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" className="sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </form>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {displayCategories.map((category) => (
                  <Link key={category.id} href={`/explore${category.id === 'all' ? '' : `?category=${category.id}`}`}>
                    <Button
                      variant={category.id === (categoryParam || 'all') ? 'default' : 'outline'}
                      size="sm"
                      className="h-auto py-2 px-3"
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {category.count}
                      </Badge>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Featured Content */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Featured Content</h2>
              </div>
              {featuredContent.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {featuredContent.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {item.category?.name || 'General'}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            {item.likes}
                          </div>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {item.content}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{item.read_time} min read</span>
                          <Link href={`/explore/${item.id}`}>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Featured Content Yet</h3>
                    <p className="text-muted-foreground">
                      Featured content will appear here once it's added to the platform.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* All Content */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold">All Content</h2>
              </div>

              {allContent.length > 0 ? (
                <div className="space-y-6">
                  {allContent.map((item) => {
                    // Convert database item to FeedCard format
                    const feedCardItem = {
                      id: item.id,
                      type: item.type,
                      title: item.title,
                      content: item.content,
                      imageUrl: item.image_url || undefined,
                      videoUrl: item.video_url || undefined,
                      audioUrl: item.audio_url || undefined,
                      quiz: item.quiz || undefined,
                      category: item.category?.name || 'General',
                      readTime: item.read_time,
                      likes: item.likes,
                      comments: 0 // Not implemented yet
                    }
                    return <FeedCard key={item.id} card={feedCardItem} />
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Content Available</h3>
                    <p className="text-muted-foreground">
                      Learning content will appear here once it's added to the platform.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
