'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/user-context'
import { listUserPaths, getUserCredits } from '@/app/actions/paths'
import type { SavedLearningPath } from '@/lib/paths'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, BookOpen, Plus, Calendar, CreditCard, GraduationCap } from 'lucide-react'

export default function MyPathsPage() {
  const { user, authLoading } = useAuth()
  const router = useRouter()

  const [paths, setPaths] = useState<SavedLearningPath[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Phase 3: credit balance for Study dashboard
  const [credits, setCredits] = useState<number>(25)
  const [creditsLoading, setCreditsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth/login')
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      const res = await listUserPaths()
      if (res.error) {
        setError(res.error)
      } else {
        setPaths(res.paths)
      }
      setLoading(false)
    }

    const loadCredits = async () => {
      setCreditsLoading(true)
      const c = await getUserCredits()
      if (typeof c.credits === 'number') setCredits(c.credits)
      setCreditsLoading(false)
    }

    load()
    loadCredits()
  }, [user, authLoading, router])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 pb-20 md:pb-8">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-amber-500" />
              Study
            </h1>
            <p className="text-muted-foreground mt-1">
              Your saved personalized paths. Generate lesson cards and study actively.
            </p>
          </div>

          {/* Credit balance — Phase 3/4 Study dashboard + header teaser */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-xl text-sm shrink-0">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold tabular-nums">{credits}</span>
            <span className="text-xs text-muted-foreground">credits</span>
            {credits < 5 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">low</span>
            )}
            <Button variant="ghost" size="sm" className="h-6 px-2 ml-1 text-[10px]" asChild>
              <Link href="/buy-credits">Buy</Link>
            </Button>
          </div>

          <Button asChild>
            <Link href="/learning">
              <Plus className="h-4 w-4 mr-2" />
              Generate New Path
            </Link>
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-0 shadow-sm bg-red-50 dark:bg-red-950/30">
            <CardContent className="pt-6 text-red-600 dark:text-red-400">{error}</CardContent>
          </Card>
        )}

        {paths.length === 0 ? (
          <Card className="border-0 shadow-sm p-12 md:p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
              <GraduationCap className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No paths yet — time to start your first one</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Explore topics in Discover, build a path on the Learn page, then save it. Come back here to study actively with AI lesson cards (1 credit each).
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/discover">Start in Discover</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/learning">Go to Learn &amp; generate</Link>
              </Button>
            </div>
            <p className="mt-6 text-[11px] text-zinc-500">First path is free to explore. Credits only used when generating lesson cards in Study.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {paths.map((p) => {
              const created = new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              const status = p.status || 'active'
              return (
                <Card key={p.id} className="border-0 shadow-sm flex flex-col transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-xl leading-tight pr-1 line-clamp-2">{p.title}</CardTitle>
                      <Badge
                        variant={status === 'completed' ? 'default' : 'outline'}
                        className={status === 'completed' ? 'bg-emerald-600 text-white' : ''}
                      >
                        {status}
                      </Badge>
                    </div>
                    {p.description && (
                      <CardDescription className="line-clamp-2 mt-1">{p.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium tabular-nums">{p.progress || 0}%</span>
                      </div>
                      <Progress value={p.progress || 0} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Saved {created}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/paths/${p.id}`}>Open</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-zinc-400">
          Study privately. Generate lesson cards on demand inside each path. Credits are used only when you create new AI content.
        </p>
      </main>
    </div>
  )
}
