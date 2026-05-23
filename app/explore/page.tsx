'use client'

import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { ExploreGraph } from '@/components/explore-graph'
import { Recommendations } from '@/components/recommendations'
import { clientData, Category, ContentItem } from '@/lib/data'
import { Search, ArrowLeft, CreditCard, Crown, Share2, BookOpen, Plus, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ExplorePage() {
  const router = useRouter()
  const searchParamsHook = useSearchParams()

  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph')
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([])
  const [allContent, setAllContent] = useState<ContentItem[]>([])
  const [allContentForCounts, setAllContentForCounts] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  // New Phase 1 state
  const [searchTerm, setSearchTerm] = useState(searchParamsHook.get('q') || '')
  const [centerNode, setCenterNode] = useState(searchParamsHook.get('q') || '')
  const [connectedNodes, setConnectedNodes] = useState<string[]>([])
  const [possibleUses, setPossibleUses] = useState<string[]>([])
  const [breadcrumb, setBreadcrumb] = useState<string[]>(searchParamsHook.get('q') ? [searchParamsHook.get('q')!] : [])
  const [credits, setCredits] = useState(12)
  const [isDeepQuery, setIsDeepQuery] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const results = await Promise.allSettled([
          clientData.getCategories(),
          clientData.getContentItems({ featured: true, limit: 3 }),
          clientData.getContentItems({ limit: 20 }),
          clientData.getContentItems({ limit: 1000 })
        ])

        setCategories(results[0].status === 'fulfilled' ? results[0].value : [])
        setFeaturedContent(results[1].status === 'fulfilled' ? results[1].value : [])
        setAllContent(results[2].status === 'fulfilled' ? results[2].value : [])
        setAllContentForCounts(results[3].status === 'fulfilled' ? results[3].value : [])
      } catch (error) {
        console.error('Database connection error in explore page:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // New Phase 1 functions
  const fetchConnectedData = async (query: string) => {
    if (!query.trim()) return
    setCenterNode(query)
    setTimeout(() => {
      setConnectedNodes(['CPU', 'RAM', 'Motherboard', 'GPU', 'SSD', 'PSU'])
      setPossibleUses(['PC Builds', 'Laptops', 'Servers', 'Gaming Rigs', 'Workstations'])
      setBreadcrumb(prev => [...new Set([...prev, query])])
    }, 400)
  }

  const handleNodeClick = (node: string) => {
    setSearchTerm(node)
    fetchConnectedData(node)
  }

  const handleBack = () => {
    if (breadcrumb.length > 1) {
      const newBreadcrumb = breadcrumb.slice(0, -1)
      setBreadcrumb(newBreadcrumb)
      const previous = newBreadcrumb[newBreadcrumb.length - 1]
      setCenterNode(previous)
      setSearchTerm(previous)
      fetchConnectedData(previous)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      fetchConnectedData(searchTerm.trim())
      router.push(`/explore?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Header + Credits */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
              <p className="text-muted-foreground mt-1">
                Infinite E8 Knowledge Lattice • Powered by Grok
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted px-5 py-3 rounded-3xl">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-xl">{credits}</span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
              <Button onClick={() => router.push('/profile/plans')} variant="outline">
                Top Up
              </Button>
              <Button onClick={() => router.push('/profile/plans')} className="gap-2">
                <Crown className="h-4 w-4" />
                View Plans
              </Button>
            </div>
          </div>

          {/* Search Textbox */}
          <form onSubmit={handleSearch} className="mb-6 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any topic or component... (e.g. PC, RAM, Tesla Model 3)"
                className="pl-14 py-8 text-lg rounded-3xl border-2"
              />
            </div>
          </form>

          {/* Connected Nodes directly below textbox */}
          {centerNode && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" onClick={handleBack} disabled={breadcrumb.length <= 1} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  {breadcrumb.map((crumb, i) => (
                    <span key={i}>{crumb}{i < breadcrumb.length - 1 && ' → '}</span>
                  ))}
                </div>
              </div>

              <p className="text-sm font-medium mb-3 text-muted-foreground">Connected nodes</p>
              <div className="flex flex-wrap gap-3 mb-8">
                {connectedNodes.map((node) => (
                  <Button
                    key={node}
                    variant="outline"
                    className="rounded-2xl px-6 py-6 text-base"
                    onClick={() => handleNodeClick(node)}
                  >
                    {node}
                  </Button>
                ))}
              </div>

              {/* Possible Uses */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Possible uses for {centerNode}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {possibleUses.map((use) => (
                      <Badge key={use} variant="secondary" className="px-5 py-2">
                        {use}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex gap-3 mb-8">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  View on Grokipedia
                </Button>
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share on X
                </Button>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Save to Learning Path
                </Button>
              </div>
            </>
          )}

          {/* View toggle + DeepQuery */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'graph' ? 'default' : 'outline'}
                onClick={() => setViewMode('graph')}
              >
                Knowledge Lattice
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isDeepQuery} onCheckedChange={setIsDeepQuery} />
              <div className="text-sm">
                <span className="font-medium">DeepQuery Mode</span>
                <span className="text-muted-foreground ml-2">(Premium)</span>
              </div>
            </div>
          </div>

          {/* Main content - lattice or list */}
          {viewMode === 'graph' ? (
            <ExploreGraph />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {allContent.map((content) => (
                  <FeedCard key={content.id} content={content} />
                ))}
              </div>
              <div>
                <Recommendations />
              </div>
            </div>
          )}

          {loading && <p className="text-center py-12 text-muted-foreground">Loading lattice...</p>}
        </main>
      </div>
    </div>
  )
}