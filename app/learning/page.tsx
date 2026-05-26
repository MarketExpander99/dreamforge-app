"use client"

import { Navigation } from '@/components/navigation'
import { BookOpen, Search, Lightbulb, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/user-context'
import { useRouter } from 'next/navigation'

interface SavedQuery {
  id: string
  shortSearch: string
  fullQuestion: string
  gradeLevel?: string
  createdAt: string
}

interface LearningPathItem {
  title: string
  description: string
  estimatedTime: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

export default function LearningPage() {
  const { user, authLoading } = useAuth()
  const router = useRouter()
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPath, setGeneratingPath] = useState(false)

  const fetchSavedQueries = async () => {
    try {
      const response = await fetch('/api/learning/saved-queries')
      if (response.ok) {
        const data = await response.json()
        setSavedQueries(data)
      }
    } catch (error) {
      console.error('Error fetching saved queries:', error)
    }
  }

  const generateLearningPath = async () => {
    if (savedQueries.length === 0) return
    setGeneratingPath(true)
    try {
      const response = await fetch('/api/learning/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: savedQueries }),
      })
      if (response.ok) {
        const data = await response.json()
        setLearningPath(data.path)
      }
    } catch (error) {
      console.error('Error generating learning path:', error)
    } finally {
      setGeneratingPath(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
        return
      }
      fetchSavedQueries()
    }
  }, [user, authLoading])

  // Auto-generate path once we have queries
  useEffect(() => {
    if (savedQueries.length > 0 && learningPath.length === 0) {
      generateLearningPath()
    }
  }, [savedQueries])

  if (loading && savedQueries.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-8 px-4 md:px-8 pb-20 md:pb-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-100 mb-2">Your Learning Path</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mb-10">Built from your searches and questions</p>

            {/* Saved History */}
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 mb-10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                  <Search className="h-5 w-5" />
                  Search &amp; Question History
                </CardTitle>
                <CardDescription>These drive your personalized path</CardDescription>
              </CardHeader>
              <CardContent>
                {savedQueries.length > 0 ? (
                  <div className="space-y-6">
                    {savedQueries.map((query) => (
                      <div key={query.id} className="border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">{query.shortSearch}</Badge>
                          {query.gradeLevel && <Badge variant="outline">{query.gradeLevel}</Badge>}
                        </div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">{query.fullQuestion}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(query.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400 py-12 text-center">No saved searches yet. Start exploring to build your path!</p>
                )}
              </CardContent>
            </Card>

            {/* Dynamic Learning Path */}
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl font-semibold tracking-tight">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Personalized Learning Path
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateLearningPath}
                    disabled={generatingPath || savedQueries.length === 0}
                  >
                    {generatingPath ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerate
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {learningPath.length > 0 ? (
                  learningPath.map((item, index) => (
                    <div key={index} className="flex gap-6">
                      <div className="w-8 h-8 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1 leading-relaxed">{item.description}</p>
                        <div className="flex gap-4 mt-4 text-xs">
                          <Badge variant="outline">{item.estimatedTime}</Badge>
                          <Badge variant="outline">{item.difficulty}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    Your learning path will appear here once you have saved searches and questions.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}