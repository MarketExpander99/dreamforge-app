"use client"

import { BookOpen, Search, Lightbulb, Loader2, RefreshCw, ExternalLink, GraduationCap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
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

const ITEMS_PER_PAGE = 5

export default function LearningPage() {
  const { user, authLoading } = useAuth()
  const router = useRouter()
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([])
  const [suggestedCourses, setSuggestedCourses] = useState<SuggestedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPath, setGeneratingPath] = useState(false)

  // Pagination + drill-down states (consistent across all sections)
  const [historyPage, setHistoryPage] = useState(1)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

  const [pathPage, setPathPage] = useState(1)
  const [expandedPathIndex, setExpandedPathIndex] = useState<number | null>(null)

  const [coursePage, setCoursePage] = useState(1)
  const [expandedCourseIndex, setExpandedCourseIndex] = useState<number | null>(null)

  const fetchSavedQueries = async () => {
    try {
      const response = await fetch('/api/learning/saved-queries')
      if (response.ok) {
        const data = await response.json()
        setSavedQueries(data)
        setHistoryPage(1)
        setExpandedHistoryId(null)
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
        // Reset pagination + expanded states on fresh generation
        setPathPage(1)
        setCoursePage(1)
        setExpandedPathIndex(null)
        setExpandedCourseIndex(null)
      }
    } catch (error) {
      console.error('Error generating learning path:', error)
    } finally {
      setGeneratingPath(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchSavedQueries()
  }, [user, authLoading, router])

  // Auto-generate personalized path + courses from history
  useEffect(() => {
    if (savedQueries.length > 0 && learningPath.length === 0 && !generatingPath) {
      generateLearningPath()
    }
  }, [savedQueries.length]) // Only depend on length to avoid unnecessary re-runs

  // Pagination helpers
  const totalHistoryPages = Math.ceil(savedQueries.length / ITEMS_PER_PAGE)
  const paginatedHistory = savedQueries.slice(
    (historyPage - 1) * ITEMS_PER_PAGE,
    historyPage * ITEMS_PER_PAGE
  )

  const totalPathPages = Math.ceil(learningPath.length / ITEMS_PER_PAGE)
  const paginatedPath = learningPath.slice(
    (pathPage - 1) * ITEMS_PER_PAGE,
    pathPage * ITEMS_PER_PAGE
  )

  const totalCoursePages = Math.ceil(suggestedCourses.length / ITEMS_PER_PAGE)
  const paginatedCourses = suggestedCourses.slice(
    (coursePage - 1) * ITEMS_PER_PAGE,
    coursePage * ITEMS_PER_PAGE
  )

  if (loading && savedQueries.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="py-8 px-5 md:px-8 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="h-7 w-7 text-zinc-700 dark:text-zinc-300" />
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Your Learning Journey</h1>
            <span 
              className="ml-1 text-amber-500 text-2xl leading-none select-none" 
              title="Infused with golden-ratio (φ ≈ 1.618) + Fibonacci harmony — our Da Vinci touch for the polish"
            >
              φ
            </span>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl">Personalized path + recommendations from your discoveries and chats.</p>

          {/* Search & Question History */}
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 mb-7">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <Search className="h-5 w-5" />
                Search &amp; Question History
              </CardTitle>
              <CardDescription>
                {savedQueries.length > 0 
                  ? `Using your ${savedQueries.length} explorations • Click titles to expand` 
                  : 'Start exploring in Discover — your questions build this path.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedQueries.length > 0 ? (
                <div className="space-y-2">
                  {paginatedHistory.map((query) => (
                    <div 
                      key={query.id}
                      onClick={() => setExpandedHistoryId(expandedHistoryId === query.id ? null : query.id)}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{query.shortSearch}</span>
                          {query.gradeLevel && <Badge variant="outline" className="text-xs shrink-0">{query.gradeLevel}</Badge>}
                        </div>
                        <span className="text-xs text-zinc-400 shrink-0">{new Date(query.createdAt).toLocaleDateString()}</span>
                      </div>

                      {expandedHistoryId === query.id && (
                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">FULL QUESTION</p>
                          <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">{query.fullQuestion}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination controls */}
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setHistoryPage(p => Math.max(1, p - 1)); setExpandedHistoryId(null) }} 
                        disabled={historyPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                      </Button>
                      <span className="text-xs text-zinc-500 tabular-nums">Page {historyPage} of {totalHistoryPages}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setHistoryPage(p => Math.min(totalHistoryPages, p + 1)); setExpandedHistoryId(null) }} 
                        disabled={historyPage === totalHistoryPages}
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-500 dark:text-zinc-400 py-12 text-center">No saved searches yet. Start exploring in Discover to build your path and course suggestions!</p>
              )}
            </CardContent>
          </Card>

          {/* Personalized Learning Path — same title list + drill-down + pagination pattern */}
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
                  ? "Step-by-step path generated by Grok from your unique questions and goals • Click any step to drill down" 
                  : "Step-by-step path tailored to your unique questions and goals"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {generatingPath && learningPath.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Sparkles className="h-10 w-10 text-amber-500 animate-pulse mb-4" />
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium">Grok is crafting your personalized learning path...</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Analyzing your discovery history and questions</p>
                </div>
              ) : learningPath.length > 0 ? (
                <>
                  {paginatedPath.map((item, index) => {
                    const originalIndex = (pathPage - 1) * ITEMS_PER_PAGE + index
                    return (
                      <div 
                        key={originalIndex}
                        onClick={() => setExpandedPathIndex(expandedPathIndex === originalIndex ? null : originalIndex)}
                        className="flex gap-4 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-0.5">
                          {originalIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 pr-2">{item.title}</h3>
                          {expandedPathIndex === originalIndex && (
                            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">{item.description}</p>
                              <div className="flex gap-2">
                                <Badge variant="outline">{item.estimatedTime}</Badge>
                                <Badge variant="outline">{item.difficulty}</Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {totalPathPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setPathPage(p => Math.max(1, p - 1)); setExpandedPathIndex(null) }} 
                        disabled={pathPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                      </Button>
                      <span className="text-xs text-zinc-500 tabular-nums">Page {pathPage} of {totalPathPages}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setPathPage(p => Math.min(totalPathPages, p + 1)); setExpandedPathIndex(null) }} 
                        disabled={pathPage === totalPathPages}
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  Your learning path will appear here once you have saved searches and questions from Discover.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Formal Courses — same title list + drill-down + pagination + improved Grok indicator */}
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <GraduationCap className="h-5 w-5" />
                Suggested Formal Courses
              </CardTitle>
              <CardDescription>
                High-quality structured courses from top providers. AI-matched to your grade + full discovery history. Click any title to drill down.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatingPath && suggestedCourses.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <Sparkles className="h-10 w-10 text-amber-500 animate-pulse mb-4" />
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium">Grok is finding the perfect formal courses matched to your grade and learning history...</p>
                  <p className="text-xs text-zinc-400 mt-1.5">Analyzing every search, question, and goal for the ideal fit</p>
                </div>
              ) : suggestedCourses.length > 0 ? (
                <div className="space-y-3">
                  {paginatedCourses.map((course, index) => {
                    const originalIndex = (coursePage - 1) * ITEMS_PER_PAGE + index
                    return (
                      <div 
                        key={originalIndex}
                        onClick={() => setExpandedCourseIndex(expandedCourseIndex === originalIndex ? null : originalIndex)}
                        className="group border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 leading-tight pr-2">{course.title}</h3>
                          <Badge variant="outline" className="shrink-0 text-xs mt-1">{course.level}</Badge>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{course.provider}</p>

                        {expandedCourseIndex === originalIndex && (
                          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{course.reason}</p>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{course.estimatedTime}</span>
                              <a 
                                href={course.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                View Course <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {totalCoursePages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setCoursePage(p => Math.max(1, p - 1)); setExpandedCourseIndex(null) }} 
                        disabled={coursePage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                      </Button>
                      <span className="text-xs text-zinc-500 tabular-nums">Page {coursePage} of {totalCoursePages}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setCoursePage(p => Math.min(totalCoursePages, p + 1)); setExpandedCourseIndex(null) }} 
                        disabled={coursePage === totalCoursePages}
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  Formal course recommendations will appear here once your discovery history and questions are analyzed.
                </div>
              )}
              
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-6 text-center">
                Recommendations generated in real-time by Grok using your saved searches and AI chat history. Perfect grade + interest match.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}