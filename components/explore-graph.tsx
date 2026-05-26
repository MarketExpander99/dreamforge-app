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

const nodeTypes = {}
const edgeTypes = {}

interface ExploreGraphProps {
  initialQuery?: string
}

export function ExploreGraph({ initialQuery }: ExploreGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchGraphData = useCallback(async (query?: string) => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createBrowserSupabaseClient()

      const { data: contentItems, error: contentError } = await supabase
        .from('content_items')
        .select('id, title, difficulty, tags, category:categories(name, color)')
        .eq('is_published', true)
        .limit(30)

      if (contentError) throw contentError

      if (!contentItems || contentItems.length === 0) {
        setNodes([{
          id: 'empty',
          type: 'default',
          position: { x: 0, y: 0 },
          data: { label: 'No content yet' },
          style: { width: 200, textAlign: 'center' }
        }])
        setLoading(false)
        return
      }

      const graphNodes: Node[] = contentItems.map((item: any, index: number) => ({
        id: item.id,
        data: { label: item.title },
        position: {
          x: Math.cos((index * 2 * Math.PI) / contentItems.length) * 250,
          y: Math.sin((index * 2 * Math.PI) / contentItems.length) * 250,
        },
        style: {
          background: '#ffffff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          padding: '12px',
          minWidth: '140px',
          textAlign: 'center',
          fontWeight: '500',
        },
      }))

      setNodes(graphNodes)
      setEdges([])
    } catch (err: any) {
      console.error(err)
      setError('Failed to load discover graph')
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    fetchGraphData(initialQuery)
  }, [initialQuery, fetchGraphData])

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.id !== 'empty') {
      router.push(`/content/${node.id}`)
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] border rounded-lg bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading discover graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchGraphData(initialQuery)}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params: Connection) => setEdges((eds) => addEdge(params, eds))}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

        <Panel position="top-right">
          <Card>
            <CardContent className="p-3 flex gap-2">
              <Button size="sm" variant="default">Core Components</Button>
              <Button size="sm" variant="outline">Real-World Uses</Button>
            </CardContent>
          </Card>
        </Panel>
      </ReactFlow>
    </div>
  )
}