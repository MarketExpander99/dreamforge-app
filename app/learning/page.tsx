"use client"

import { BookOpen, Search, Lightbulb, Loader2, RefreshCw, ExternalLink, GraduationCap } from 'lucide-react'
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

interface SuggestedCourse {
  title: string
  provider: string
  url: string
  estimatedTime: string
  level: string
  reason: string
}

export default function LearningPage() {
  const { user, authLoading } = useAuth()
  const router = useRouter()
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([])
  const [suggestedCourses, setSuggestedCourses] = useState<SuggestedCourse[]>([])
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
    } finally {
      setLoading(false)
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
        setLearningPath(data.path || [])
        setSuggestedCourses(data.suggestedCourses || [])
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

  // Auto-generate personalized path + courses from history
  useEffect(() => {
    if (savedQueries.length > 0 && learningPath.length === 0 && !generatingPath) {
      generateLearningPath()
    }
  }, [savedQueries.length]) // Only depend on length to avoid unnecessary re-runs

  if (loading && savedQueries.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="py-8 px-4 md:px-8 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-zinc-700 dark:text-zinc-300" />
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Your Learning Journey</h1>
          </div>
          <p className="text-muted-foreground mb-10 max-w-2xl">Personalized path + formal course recommendations built from your discovery searches, questions, and AI chat history.</p>

          {/* Saved History */}
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <Search className="h-5 w-5" />
                Search & Question History
              </CardTitle>
              <CardDescription>
                {savedQueries.length > 0 
                  ? `Using your ${savedQueries.length} explorations to build a personalized experience` 
                  : 'These drive your personalized recommendations (powered by your discovery data and chatlogs)'}
              </CardDescription>
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
                <p className="text-zinc-500 dark:text-zinc-400 py-12 text-center">No saved searches yet. Start exploring in Discover to build your path and course suggestions!</p>
              )}
            </CardContent>
          </Card>

          {/* Dynamic Learning Path */}
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 mb-8">
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
              <CardDescription>
                {savedQueries.length > 0 
                  ? "Step-by-step path generated by Grok from your unique questions and goals" 
                  : "Step-by-step path tailored to your unique questions and goals"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {generatingPath && learningPath.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-400 mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400">Analyzing your history and generating personalized recommendations...</p>
                </div>
              ) : learningPath.length > 0 ? (
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
                  Your learning path will appear here once you have saved searches and questions from Discover.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Formal Courses */}
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <GraduationCap className="h-5 w-5" />
                Suggested Formal Courses
              </CardTitle>
              <CardDescription>
                High-quality structured courses from top providers. Complements your personalized path.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatingPath && suggestedCourses.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Generating course recommendations from your history...
                </div>
              ) : suggestedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggestedCourses.map((course, index) => (
                    <div 
                      key={index} 
                      className="group border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 leading-tight">{course.title}</h3>
                          <Badge variant="outline" className="shrink-0 text-xs">{course.level}</Badge>
                        </div>
                        
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{course.provider}</p>
                        
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{course.reason}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>{course.estimatedTime}</span>
                        </div>
                        <a 
                          href={course.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          View Course 
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  Formal course recommendations will appear here once your discovery history and questions are analyzed.
                </div>
              )}
              
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-6 text-center">
                Recommendations generated in real-time by Grok using your saved searches and AI chat history.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
