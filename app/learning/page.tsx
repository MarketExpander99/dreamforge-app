"use client"

import { BookOpen, Search, Lightbulb, Loader2, RefreshCw, ExternalLink, GraduationCap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/user-context'
import { useRouter } from 'next/navigation'
import type { PathStep, SuggestedCourse, GeneratedPath } from '@/lib/paths'
import { savePersonalizedPath } from '@/app/actions/paths'

interface SavedQuery {
  id: string
  shortSearch: string
  fullQuestion: string
  gradeLevel?: string
  createdAt: string
}

const ITEMS_PER_PAGE = 5

export default function LearningPage() {
  const { user, authLoading } = useAuth()
  const router = useRouter()
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [learningPath, setLearningPath] = useState<PathStep[]>([])
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

  // Save path (Task 2)
  const [isSavingPath, setIsSavingPath] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

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

  const fetchLatestLearningPath = async () => {
    try {
      const res = await fetch('/api/learning/latest-path')
      if (res.ok) {
        const json = await res.json()
        return json && !json.error ? json : null
      }
    } catch (error) {
      console.error('Error fetching latest learning path:', error)
    }
    return null
  }

  const getJourneyCacheKey = (uid?: string) => `sg_learning_journey_${uid || 'anon'}`

  // Save successful generation result to localStorage using a signature of the history.
  // This guarantees we can avoid repeated AI calls even if DB row has issues (e.g. conflicts with other upserts).
  const saveJourneyToLocal = (path: any[], suggested: any[], sig: string) => {
    try {
      if (user?.id) {
        localStorage.setItem(getJourneyCacheKey(user.id), JSON.stringify({
          sig,
          path,
          suggestedCourses: suggested,
          savedAt: Date.now()
        }))
      }
    } catch (e) {
      // localStorage may be unavailable (private mode etc) — non fatal
    }
  }

  const loadJourneyFromLocal = (sig: string) => {
    try {
      if (!user?.id) return null
      const raw = localStorage.getItem(getJourneyCacheKey(user.id))
      if (!raw) return null
      const cached = JSON.parse(raw)
      if (cached.sig === sig && Array.isArray(cached.path) && cached.path.length > 0) {
        return cached
      }
    } catch (e) {}
    return null
  }

  const generateLearningPath = async (persist: boolean = false, force: boolean = false) => {
    const currentLength = savedQueries.length
    if (currentLength === 0) return

    // Build signature for local cache
    const maxCreated = savedQueries.reduce((max: string, q: any) => {
      const c = q?.createdAt || ''
      return c && (!max || c > max) ? c : max
    }, '' as string)
    const sig = `${currentLength}|${maxCreated}`

    setGeneratingPath(true)
    try {
      const response = await fetch('/api/learning/generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          queries: savedQueries,
          persist,
          force
        }),
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
        setShowSaveForm(false)
        setSaveMessage(null)

        // Persist result locally so future loads skip AI even without reliable DB cache
        saveJourneyToLocal(data.path || [], data.suggestedCourses || [], sig)
      }
    } catch (error) {
      console.error('Error generating learning path:', error)
    } finally {
      setGeneratingPath(false)
    }
  }

  // Save the currently displayed generated path as a named user path (Phase 2)
  const handleSaveCurrentPath = async () => {
    if (!learningPath.length) return

    const defaultTitle = saveTitle.trim() || `My Path - ${new Date().toLocaleDateString()}`
    setIsSavingPath(true)
    setSaveMessage(null)

    const pathData: GeneratedPath = {
      path: learningPath,
      suggestedCourses: suggestedCourses,
    }

    const result = await savePersonalizedPath({
      title: defaultTitle,
      description: 'Saved from Study with Grok personalized path',
      pathData,
    })

    if (result.success) {
      const xp = result.xp
      if (xp?.success && xp.message && ((xp.xpGained ?? 0) > 0 || xp.leveledUp || (xp.newAchievements?.length ?? 0) > 0)) {
        setSaveMessage(`✅ Path saved! ${xp.message} — find it in Study / My Paths.`)
      } else if (xp?.success && xp.skipped && xp.skipReason === 'daily_cap') {
        setSaveMessage('✅ Path saved! Daily path XP already earned today — find it in Study / My Paths.')
      } else if (xp?.errorCode === 'missing_migration') {
        setSaveMessage('✅ Path saved! (XP tracking not set up yet) — find it in Study / My Paths.')
      } else {
        setSaveMessage('✅ Path saved! You can find it in My Paths.')
      }
      setShowSaveForm(false)
      setSaveTitle('')
      // Clear message after a bit
      setTimeout(() => setSaveMessage(null), 5000)
    } else {
      setSaveMessage(result.error || 'Failed to save path')
    }
    setIsSavingPath(false)
  }

  const openSaveForm = () => {
    // Prefill a sensible title from first step if available
    const suggested = learningPath[0]?.title
      ? learningPath[0].title.slice(0, 60)
      : `Personalized Path ${new Date().toLocaleDateString()}`
    setSaveTitle(suggested)
    setShowSaveForm(true)
    setSaveMessage(null)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchSavedQueries()
  }, [user, authLoading, router])

  // Smart load: read cached path from DB first (preferred), then localStorage fallback.
  // Only trigger AI generation (and persist) if *no* matching cached journey exists for this exact history snapshot.
  // This stops repeated unnecessary Grok calls when the user has not added new explorations.
  useEffect(() => {
    const loadOrGeneratePath = async () => {
      const currentLength = savedQueries.length
      if (currentLength === 0) return

      // Strong signature = length + newest exploration timestamp (survives count caps)
      const currentMaxCreated = savedQueries.reduce((max: string, q: any) => {
        const c = q?.createdAt || ''
        return c && (!max || c > max) ? c : max
      }, '' as string)
      const sig = `${currentLength}|${currentMaxCreated}`

      // 1. Try DB (source of truth)
      const existing = await fetchLatestLearningPath()
      if (existing && !existing.error) {
        const hasCachedPath = Array.isArray(existing.path) && existing.path.length > 0
        const storedCount = existing.exploration_count_at_generation ?? 0
        if (hasCachedPath && storedCount >= currentLength) {
          // Up to date (cached count >= current explorations) — use DB, skip Grok entirely.
          setLearningPath(existing.path || [])
          setSuggestedCourses(existing.suggestedCourses || [])
          setPathPage(1)
          setCoursePage(1)
          setExpandedPathIndex(null)
          setExpandedCourseIndex(null)
          setShowSaveForm(false)
          setSaveMessage(null)
          return
        }
        // If has cached but storedCount < currentLength: fall through to regenerate (new history detected)
      }

      // 2. Fallback to localStorage (reliable per-browser cache using signature)
      const localCached = loadJourneyFromLocal(sig)
      if (localCached) {
        setLearningPath(localCached.path || [])
        setSuggestedCourses(localCached.suggestedCourses || [])
        setPathPage(1)
        setCoursePage(1)
        setExpandedPathIndex(null)
        setExpandedCourseIndex(null)
        setShowSaveForm(false)
        setSaveMessage(null)
        return
      }

      // 3. Nothing cached for this history → generate fresh + persist (DB + local)
      if (!generatingPath) {
        await generateLearningPath(true, false)
      }
    }

    if (!authLoading && user) {
      loadOrGeneratePath()
    }
  }, [savedQueries.length, user, authLoading]) // length change signals possible new history

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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  // === Page-level fallback for users with no exploration history ===
  // A single, welcoming, actionable empty state (per spec). No other sections render.
  if (savedQueries.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <main className="py-8 px-4 md:px-8 pb-20 md:pb-8">
          <div className="max-w-2xl mx-auto text-center pt-16">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-100 dark:bg-purple-950">
              <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>

            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Your learning journey starts here
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
              The Learn page becomes magical once you’ve explored a few topics in Discover.
              Every search and question you save powers personalized paths, recommendations, and progress tracking.
            </p>

            <Button
              size="lg"
              onClick={() => router.push('/discover')}
              className="px-8"
            >
              Start Exploring in Discover
            </Button>

            <div className="mt-12 text-left">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Try exploring these to get started:</p>
              <div className="flex flex-wrap gap-2">
                {['Photosynthesis', 'Python basics', 'The solar system', 'How cameras work'].map((topic) => (
                  <Button
                    key={topic}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push('/discover')
                    }}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Normal rich content only renders when user has history
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
                {`Using your ${savedQueries.length} explorations • Click titles to expand`}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openSaveForm}
                    disabled={generatingPath || !learningPath.length || isSavingPath}
                  >
                    Save to My Paths
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateLearningPath(true, true)} // force fresh AI + persist (manual override)
                    disabled={generatingPath || savedQueries.length === 0}
                  >
                    {generatingPath ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Regenerate
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {savedQueries.length > 0 
                  ? "Step-by-step path generated by Grok from your unique questions and goals" 
                  : "Built from your Discover explorations — search anything to begin"}
              </CardDescription>

              {/* Save Path form (appears when user clicks Save) */}
              {showSaveForm && (
                <div className="mt-2 mb-1 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-950/50">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      placeholder="Path title"
                      className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                      disabled={isSavingPath}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveCurrentPath}
                        disabled={isSavingPath || !saveTitle.trim()}
                      >
                        {isSavingPath ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setShowSaveForm(false); setSaveMessage(null); }}
                        disabled={isSavingPath}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">This saves a copy of the current generated path to your account.</p>
                </div>
              )}

              {saveMessage && (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">{saveMessage} <a href="/paths" className="underline">View My Paths →</a></div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {generatingPath && learningPath.length === 0 ? (
                // HISTORY EXISTS — safe to show generating state
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
                // Fallback when history exists but nothing generated yet
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  Your learning path will appear here once Grok finishes analyzing your saved explorations.
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
                // HISTORY EXISTS — safe to show generating state for courses
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
                  Formal course recommendations will appear here once Grok finishes analyzing your saved explorations.
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