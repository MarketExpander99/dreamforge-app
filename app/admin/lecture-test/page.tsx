'use client'

/**
 * Admin Lecture Test Page
 * Temporary page for end-to-end testing of Two-Stage Lecture Generation + Viewer.
 *
 * - Generates using the two-stage pipeline
 * - Optionally persists to lectures + lecture_sections (requires migration SQL applied)
 * - Renders the ProgressiveLectureViewer component
 *
 * Access: Protected under /admin (admin email gate can be added later)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ProgressiveLectureViewer } from '@/components/lecture/ProgressiveLectureViewer'
import { LectureSection } from '@/lib/ai/lecture-generation'
import { Loader2, Play, Save } from 'lucide-react'

interface GenerateResponse {
  success: boolean
  topic?: string
  masterLecture?: string
  sections?: LectureSection[]
  metadata?: any
  lectureId?: string | null
  persisted?: boolean
  error?: string
}

export default function AdminLectureTestPage() {
  const [topic, setTopic] = useState('Binary Search Trees')
  const [targetAudience, setTargetAudience] = useState('Grade 11-12 IT / CS students')
  const [persist, setPersist] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runGeneration = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/lecture/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          targetAudience: targetAudience.trim(),
          persist,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed')
      }

      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Failed to generate lecture')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionComplete = (sectionNumber: number) => {
    console.log('Section completed:', sectionNumber)
    // Future: could POST to a progress endpoint
  }

  const handleLectureComplete = () => {
    console.log('Full lecture completed!')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Lecture Generation Test</h1>
          <p className="mt-2 text-zinc-400">
            Two-stage pipeline (Master Lecture → Progressive Sections). For admin / developer testing.
          </p>
          <div className="mt-1 text-xs text-amber-400">
            Requires the lectures + lecture_sections tables (see scripts/2026-06-26-create-lectures-tables.sql)
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-8 border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>Generate a Progressive Lecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic" className="text-sm text-zinc-400">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Recursion, Photosynthesis, Supply and Demand"
                className="mt-1 bg-zinc-950"
              />
            </div>

            <div>
              <Label htmlFor="audience" className="text-sm text-zinc-400">Target Audience</Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="mt-1 bg-zinc-950"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox 
                id="persist" 
                checked={persist} 
                onCheckedChange={(v) => setPersist(!!v)} 
              />
              <Label htmlFor="persist" className="text-sm cursor-pointer">
                Persist to database (lectures + sections)
              </Label>
            </div>

            <Button 
              onClick={runGeneration} 
              disabled={loading || !topic.trim()}
              size="lg"
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating (two stages)...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Generate Lecture {persist ? '(+ Save)' : ''}
                </>
              )}
            </Button>

            {result?.lectureId && (
              <div className="text-xs bg-emerald-950 text-emerald-400 px-3 py-2 rounded flex items-center gap-2">
                <Save className="h-3.5 w-3.5" /> Saved as lecture ID: <span className="font-mono">{result.lectureId}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded border border-red-900 bg-red-950/60 p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Results + Viewer */}
        {result && result.sections && result.masterLecture && (
          <div className="space-y-6">
            <div className="text-sm text-zinc-400 flex gap-4">
              <div>Sections: <span className="font-medium text-white">{result.sections.length}</span></div>
              <div>Est. total: <span className="font-medium text-white">{result.metadata?.estimatedTotalMinutes || '?'} min</span></div>
              {result.persisted && <div className="text-emerald-400">Persisted ✓</div>}
            </div>

            <ProgressiveLectureViewer
              topic={result.topic || topic}
              masterLecture={result.masterLecture}
              sections={result.sections}
              onSectionComplete={handleSectionComplete}
              onLectureComplete={handleLectureComplete}
            />
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-12 text-sm text-zinc-500">
            Enter a topic above and click Generate.<br />
            First generation creates the master document, then intelligently splits it without repetition.
          </div>
        )}
      </div>
    </div>
  )
}
