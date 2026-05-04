'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface ContentItem {
  id: string
  title: string
  type: string
  category: { name: string; color: string }[] | null
  difficulty: string
  tags: string[]
}

interface ContentRelationship {
  source_id: string
  target_id: string
  relationship_type: 'prerequisite' | 'extends' | 'gamified_link' | 'similar'
  strength: number
}

type ViewMode = 'connected' | 'affected' | 'self-similar'

interface ExploreGraphProps {
  initialContentId?: string
}

const nodeTypes = {}

const edgeTypes = {}

export function ExploreGraph({ initialContentId }: ExploreGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [viewMode, setViewMode] = useState<ViewMode>('connected')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Color scheme for different relationship types
  const relationshipColors = {
    prerequisite: '#ef4444', // red
    extends: '#10b981', // green
    gamified_link: '#f59e0b', // amber
    similar: '#8b5cf6', // violet
  }

  // Color scheme for difficulty levels
  const difficultyColors = {
    beginner: '#10b981', // green
    intermediate: '#f59e0b', // amber
    advanced: '#ef4444', // red
  }

  // Fetch content and relationships
  const fetchGraphData = useCallback(async (contentId?: string) => {
    setLoading(true)
    try {
      const supabase = createBrowserSupabaseClient()

      // Fetch content items with categories
      const { data: contentItems, error: contentError } = await supabase
        .from('content_items')
        .select(`
          id,
          title,
          type,
          difficulty,
          tags,
          category:categories(name, color)
        `)
        .eq('is_published', true)
        .limit(50) // Limit for performance

      if (contentError) throw contentError

      // Fetch relationships
      const { data: relationships, error: relError } = await supabase
        .from('content_relationships')
        .select('*')

      if (relError) throw relError

      // Create nodes
      const graphNodes: Node[] = (contentItems || []).map((item: ContentItem, index: number) => {
        const isCentral = contentId && item.id === contentId
        const angle = (index * 2 * Math.PI) / (contentItems?.length || 1)
        const radius = isCentral ? 0 : 200 + Math.random() * 100

        return {
          id: item.id,
          type: 'default',
          position: {
            x: isCentral ? 0 : Math.cos(angle) * radius,
            y: isCentral ? 0 : Math.sin(angle) * radius,
          },
          data: {
            label: item.title,
            content: item,
            isCentral,
          },
          style: {
            background: isCentral ? '#3b82f6' : '#ffffff',
            border: `2px solid ${difficultyColors[item.difficulty as keyof typeof difficultyColors] || '#6b7280'}`,
            borderRadius: '8px',
            padding: '10px',
            minWidth: '120px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: isCentral ? 'bold' : 'normal',
            color: isCentral ? '#ffffff' : '#000000',
          },
        }
      })

      // Create edges based on view mode
      const graphEdges: Edge[] = []

      if (relationships) {
        relationships.forEach((rel: ContentRelationship) => {
          let includeEdge = false

          switch (viewMode) {
            case 'connected':
              // Show prerequisites and extensions
              includeEdge = rel.relationship_type === 'prerequisite' || rel.relationship_type === 'extends'
              break
            case 'affected':
              // Show how this content affects other content and games
              includeEdge = rel.relationship_type === 'gamified_link' || rel.relationship_type === 'extends'
              break
            case 'self-similar':
              // Show similar content
              includeEdge = rel.relationship_type === 'similar'
              break
          }

          if (includeEdge) {
            graphEdges.push({
              id: `${rel.source_id}-${rel.target_id}`,
              source: rel.source_id,
              target: rel.target_id,
              type: 'smoothstep',
              style: {
                stroke: relationshipColors[rel.relationship_type],
                strokeWidth: Math.max(1, rel.strength / 2),
              },
              label: rel.relationship_type.replace('_', ' '),
              labelStyle: {
                fontSize: '10px',
                fill: relationshipColors[rel.relationship_type],
              },
            })
          }
        })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setNodes(graphNodes as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEdges(graphEdges as any)
    } catch (error) {
      console.error('Error fetching graph data:', error)
    } finally {
      setLoading(false)
    }
  }, [viewMode])

  // Update graph when view mode changes
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (isMounted) {
        await fetchGraphData(initialContentId)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [viewMode, initialContentId])

  // Handle node clicks
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Navigate to content
    router.push(`/explore/${node.id}`)
  }, [router])

  // Handle connections (for future editing features)
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const content = node.data?.content as ContentItem
            return difficultyColors[content?.difficulty as keyof typeof difficultyColors] || '#6b7280'
          }}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        {/* View Mode Toggle */}
        <Panel position="top-right">
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2 mb-2">
                <Button
                  size="sm"
                  variant={viewMode === 'connected' ? 'default' : 'outline'}
                  onClick={() => setViewMode('connected')}
                >
                  Connected
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'affected' ? 'default' : 'outline'}
                  onClick={() => setViewMode('affected')}
                >
                  Affected
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'self-similar' ? 'default' : 'outline'}
                  onClick={() => setViewMode('self-similar')}
                >
                  Similar
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {viewMode === 'connected' && 'Shows prerequisites and next lessons'}
                {viewMode === 'affected' && 'Shows impact on other content and games'}
                {viewMode === 'self-similar' && 'Shows similar difficulty/topic variations'}
              </div>
            </CardContent>
          </Card>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-right">
          <Card>
            <CardContent className="p-3">
              <div className="text-sm font-semibold mb-2">Legend</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Beginner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Intermediate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Advanced</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-red-500"></div>
                    <span>Prerequisite</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-green-500"></div>
                    <span>Extends</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-amber-500"></div>
                    <span>Game Link</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-violet-500"></div>
                    <span>Similar</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Panel>
      </ReactFlow>
    </div>
  )
}