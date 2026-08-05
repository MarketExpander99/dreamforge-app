'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/user-context'
import { getSavedPath, updatePathProgress, getUserCredits, generateLessonCardForStep, markPathLessonComplete } from '@/app/actions/paths'
import type { SavedLearningPath, PathStep, LessonCard } from '@/lib/paths'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, CheckCircle2, Clock, CreditCard, Sparkles, BookOpen } from 'lucide-react'

export default function SavedPathDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, authLoading } = useAuth()

  const [path, setPath] = useState<SavedLearningPath | null>(null)
  const [steps, setSteps] = useState<PathStep[]>([])
  const [lessons, setLessons] = useState<Record<string, LessonCard>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Phase 3 Study: credits + generation state + tabs
  const [credits, setCredits] = useState<number>(25)
  const [creditsLoading, setCreditsLoading] = useState(true)
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'progress'>('overview')

  const pathId = params?.id as string

  const loadPath = async () => {
    if (!pathId) return
    setLoading(true)
    setError(null)
    const res = await getSavedPath(pathId)
    if (res.error || !res.path) {
      setError(res.error || 'Path not found')
      setPath(null)
      setSteps([])
      setLessons({})
    } else {
      setPath(res.path)
      const mods: any = res.path.modules || {}
      const rawSteps = Array.isArray(mods.path) ? mods.path : (Array.isArray(mods) ? mods : [])
      const normalized: PathStep[] = rawSteps.map((s: any) => ({
        title: String(s.title || 'Step'),
        description: String(s.description || ''),
        estimatedTime: String(s.estimatedTime || s.estimated_time || '—'),
        difficulty: (s.difficulty || 'Intermediate') as PathStep['difficulty'],
      }))
      setSteps(normalized)
      setLessons(mods.lessons && typeof mods.lessons === 'object' ? mods.lessons : {})
    }
    setLoading(false)
  }

  const loadCredits = async () => {
    setCreditsLoading(true)
    const c = await getUserCredits()
    if (typeof c.credits === 'number') setCredits(c.credits)
    setCreditsLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (pathId) {
      loadPath()
      loadCredits()
    }
  }, [pathId, user, authLoading, router])

  const handleProgressUpdate = async (newProgress: number) => {
    if (!pathId || !path) return
    setUpdating(true)
    setMessage(null)
    const res = await updatePathProgress(pathId, newProgress)
    if (res.success) {
      setPath({ ...path, progress: newProgress, status: newProgress >= 100 ? 'completed' : 'active' })
      setMessage(`Progress updated to ${newProgress}%`)
      setTimeout(() => setMessage(null), 2500)
    } else {
      setMessage(res.error || 'Update failed')
    }
    setUpdating(false)
  }

  // Phase 3: Generate lesson card for a specific step (uses 1 credit)
  const handleGenerateLesson = async (idx: number, step: PathStep) => {
    if (!pathId) return
    setGeneratingIndex(idx)
    setMessage(null)

    const res = await generateLessonCardForStep({
      pathId,
      stepIndex: idx,
      step
    })

    if (res.success && res.lesson) {
      const key = `step-${idx}`
      const updatedLessons = { ...lessons, [key]: res.lesson }
      setLessons(updatedLessons)

      // Update local path modules so UI reflects immediately
      if (path) {
        const updatedModules: any = { ...(path.modules || {}), lessons: updatedLessons }
        setPath({ ...path, modules: updatedModules })
      }

      if (typeof res.creditsRemaining === 'number') {
        setCredits(res.creditsRemaining)
      }

      setMessage(`Lesson card generated for "${step.title}"`)
      setTimeout(() => setMessage(null), 3200)

      // Gentle auto progress nudge when first lesson on a low-progress path
      if (path && (path.progress ?? 0) < 15 && idx === 0) {
        // fire and forget small bump — user can fine tune in Progress tab
        updatePathProgress(pathId, Math.max(15, (path.progress ?? 0) + 10))
          .then(r => { if (r.success && path) setPath({ ...path, progress: Math.max(15, (path.progress ?? 0) + 10) }) })
      }
    } else {
      setMessage(res.error || 'Could not generate lesson right now')
      setTimeout(() => setMessage(null), 4000)
    }

    setGeneratingIndex(null)
  }

  const getLessonForStep = (idx: number): LessonCard | null => {
    return lessons[`step-${idx}`] || null
  }

  // Phase 6: complete lesson step → update progress + award lesson XP
  const markLessonComplete = async (idx: number) => {
    if (!path || !pathId) return
    setUpdating(true)
    setMessage(null)
    const res = await markPathLessonComplete({
      pathId,
      stepIndex: idx,
      totalSteps: Math.max(1, steps.length),
      currentProgress: path.progress ?? 0,
    })
    if (res.success && typeof res.progress === 'number') {
      setPath({
        ...path,
        progress: res.progress,
        status: res.progress >= 100 ? 'completed' : 'active',
      })
      setMessage(res.message || `Progress updated to ${res.progress}%`)
      setTimeout(() => setMessage(null), 3200)
    } else {
      setMessage(res.error || 'Could not mark lesson complete')
      setTimeout(() => setMessage(null), 4000)
    }
    setUpdating(false)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !path) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <main className="max-w-3xl mx-auto px-4 md:px-8 py-12">
          <Button variant="outline" asChild className="mb-6">
            <Link href="/paths"><ArrowLeft className="h-4 w-4 mr-2" /> Back to My Paths</Link>
          </Button>
          <Card className="border-0 shadow-sm p-10 text-center">
            <p className="text-lg font-medium mb-2">Path not available</p>
            <p className="text-muted-foreground">{error || 'This path does not exist or you do not have access.'}</p>
            <Button asChild className="mt-6"><Link href="/paths">Return to My Paths</Link></Button>
          </Card>
        </main>
      </div>
    )
  }

  const progress = path.progress ?? 0
  const status = path.status || 'active'
  const created = new Date(path.created_at).toLocaleDateString()
  const lessonCount = Object.keys(lessons).length

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-20 md:pb-8">
        {/* Top bar with back + credit balance */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="outline" asChild>
            <Link href="/paths"><ArrowLeft className="h-4 w-4 mr-2" /> Study</Link>
          </Button>

          <div className="flex items-center gap-3">
            {/* Prominent credit balance + buy teaser (header) */}
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-xl text-sm transition-colors">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold tabular-nums">{credits}</span>
              <span className="text-xs text-muted-foreground">credits</span>
              {credits < 3 && <span className="text-[10px] text-amber-600">low</span>}
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] ml-0.5" asChild>
                <Link href="/buy-credits">Buy</Link>
              </Button>
            </div>
            <Badge variant={status === 'completed' ? 'default' : 'outline'}>
              {status} • {progress}%
            </Badge>
          </div>
        </div>

        {/* Path header */}
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-amber-500" /> {path.title}
            </CardTitle>
            {path.description && (
              <CardDescription className="text-base mt-1">{path.description}</CardDescription>
            )}
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Saved {created} • {steps.length} steps • {lessonCount} lesson cards
            </div>
          </CardHeader>
        </Card>

        {/* Simple navigation tabs: Overview | Lessons | Progress */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons ({lessonCount})</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB — steps + generate lesson buttons */}
          <TabsContent value="overview">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Path Steps</h2>
              <span className="text-sm text-muted-foreground">{steps.length} steps</span>
            </div>

            {steps.length === 0 ? (
              <Card className="border-0 shadow-sm p-8 text-center text-muted-foreground">
                No step details stored for this path.
              </Card>
            ) : (
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const existingLesson = getLessonForStep(idx)
                  const isGenerating = generatingIndex === idx
                  return (
                    <Card key={idx} className="border-0 shadow-sm transition-all hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg leading-snug">{step.title}</CardTitle>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{step.estimatedTime}</Badge>
                              <Badge variant="outline" className="text-xs">{step.difficulty}</Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line mb-4">
                          {step.description}
                        </p>

                        {/* Generate or view lesson card inline */}
                        {existingLesson ? (
                          <div className="rounded-lg border bg-zinc-50 dark:bg-zinc-900/60 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-amber-500" />
                              <span className="font-medium text-sm">Lesson Card</span>
                              <Badge variant="outline" className="text-[10px] ml-auto">{existingLesson.estimatedTime || '—'}</Badge>
                            </div>
                            <div className="text-base font-semibold mb-1">{existingLesson.title}</div>
                            <div className="text-sm whitespace-pre-line text-zinc-700 dark:text-zinc-300 mb-3">{existingLesson.content}</div>
                            {existingLesson.keyPoints?.length > 0 && (
                              <ul className="list-disc pl-5 text-sm space-y-0.5 text-zinc-600 dark:text-zinc-400 mb-3">
                                {existingLesson.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                              </ul>
                            )}
                            <Button size="sm" variant="outline" onClick={() => markLessonComplete(idx)} disabled={updating}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark lesson complete
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Button
                              size="sm"
                              onClick={() => handleGenerateLesson(idx, step)}
                              disabled={isGenerating || credits < 1}
                              className="gap-2"
                            >
                              {isGenerating ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                              ) : (
                                <><Sparkles className="h-4 w-4" /> Generate Lesson Card</>
                              )}
                            </Button>
                            <span className="ml-3 text-xs text-muted-foreground">Uses 1 credit • Balance: {credits}</span>
                            {credits < 1 && (
                              <span className="ml-2 text-xs text-red-500">Not enough credits</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {message && (
              <p className="text-sm mt-4 text-emerald-600 dark:text-emerald-400">{message}</p>
            )}
          </TabsContent>

          {/* LESSONS TAB — all generated lesson cards */}
          <TabsContent value="lessons">
            <h2 className="text-xl font-semibold mb-3">Your Lesson Cards</h2>
            {lessonCount === 0 ? (
              <Card className="border-0 shadow-sm p-10 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-amber-500 mb-3" />
                <h3 className="font-semibold mb-1">No lesson cards yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">Go to the Overview tab and tap “Generate Lesson Card” on any step. Each card costs 1 credit and stays saved for your studies.</p>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('overview')}>Go to steps</Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const card = getLessonForStep(idx)
                  if (!card) return null
                  return (
                    <Card key={idx} className="border-0 shadow-sm transition-all hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step {idx + 1}</Badge>
                          <CardTitle className="text-lg">{card.title}</CardTitle>
                        </div>
                        <div className="text-xs text-muted-foreground">{step.title}</div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
                          <p className="whitespace-pre-line text-sm">{card.content}</p>
                        </div>
                        {card.keyPoints?.length > 0 && (
                          <div className="mb-3">
                            <div className="font-medium text-sm mb-1">Key Points</div>
                            <ul className="list-disc pl-5 text-sm space-y-0.5">
                              {card.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => markLessonComplete(idx)} disabled={updating}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark complete (updates progress)
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActiveTab('overview')}>
                            Back to steps
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* PROGRESS TAB — existing + credit feedback */}
          <TabsContent value="progress">
            <Card className="border-0 shadow-sm mb-6">
              <CardHeader>
                <CardTitle>Track Your Progress</CardTitle>
                <CardDescription>Update overall path progress. Completing lesson cards can help advance this automatically.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-sm font-medium">Overall Progress</div>
                    <div className="text-2xl font-semibold tabular-nums">{progress}%</div>
                  </div>
                  <Progress value={progress} className="h-3 mb-4" />

                  <div className="flex flex-wrap gap-2">
                    {[0, 25, 50, 75, 100].map((p) => (
                      <Button
                        key={p}
                        variant={progress === p ? 'default' : 'outline'}
                        size="sm"
                        disabled={updating}
                        onClick={() => handleProgressUpdate(p)}
                      >
                        {p === 100 ? 'Complete' : `${p}%`}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updating}
                      onClick={() => handleProgressUpdate(Math.min(100, Math.max(0, progress + 10)))}
                    >
                      +10%
                    </Button>
                  </div>

                  {message && <p className="text-sm mt-3 text-emerald-600 dark:text-emerald-400">{message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Progress is saved to your path. Generating and completing lessons moves you forward.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm transition-all hover:shadow-md">
              <CardContent className="pt-6 text-sm">
                <div className="font-medium mb-1">Credits &amp; Usage</div>
                <div>Your current balance: <span className="font-semibold tabular-nums">{credits}</span> credits.</div>
                <div className="text-muted-foreground mt-1">Each lesson card generation costs 1 credit. Credits are deducted only on successful generation.</div>
                {credits < 5 && (
                  <div className="mt-2 text-amber-600 text-xs">Your balance is getting low. Lesson generation will be limited soon.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline">
            <Link href="/learning">Generate a new path</Link>
          </Button>
          <Button asChild variant="ghost" onClick={() => setActiveTab('overview')}>
            Back to Overview
          </Button>
        </div>
      </main>
    </div>
  )
}
