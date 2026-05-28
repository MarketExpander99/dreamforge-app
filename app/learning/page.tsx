"use client"

import { BookOpen, Search, Lightbulb, Loader2, RefreshCw, Clock, CheckCircle2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  status: 'in_progress' | 'completed'
  progress_percentage: number
  xp_earned: number
  xp_total: number
  last_accessed: string
  quiz?: {
    questions: Array<{
      question: string
      options: string[]
      correctAnswer: string
      userAnswer?: string
      xpValue: number
    }>
  }
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
        // Enhance with progress data for immediate UI demo (real data from user_progress in next step)
        const enhancedPath: LearningPathItem[] = data.path.map((item: any, index: number) => ({
          ...item,
          status: index % 2 === 0 ? 'in_progress' : 'completed' as const,
          progress_percentage: index % 2 === 0 ? 65 : 92,
          xp_earned: index % 2 === 0 ? 325 : 920,
          xp_total: index % 2 === 0 ? 500 : 1000,
          last_accessed: index % 2 === 0 ? '2 days ago' : '1 week ago',
          quiz: index % 2 === 1 ? {
            questions: [
              {
                question: 'What is the primary pigment used in photosynthesis?',
                options: ['Chlorophyll', 'Hemoglobin', 'Melanin', 'Carotene'],
                correctAnswer: 'Chlorophyll',
                userAnswer: 'Chlorophyll',
                xpValue: 250
              },
              {
                question: 'Which gas is released as a byproduct of photosynthesis?',
                options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'],
                correctAnswer: 'Oxygen',
                userAnswer: 'Carbon dioxide',
                xpValue: 250
              },
              {
                question: 'Where does photosynthesis primarily occur in plants?',
                options: ['Roots', 'Leaves', 'Stem', 'Flowers'],
                correctAnswer: 'Leaves',
                userAnswer: 'Leaves',
                xpValue: 250
              }
            ]
          } : undefined
        }))
        setLearningPath(enhancedPath)
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

  const inProgress = learningPath.filter(t => t.status === 'in_progress')
  const completed = learningPath.filter(t => t.status === 'completed')

  const proficiencyColor = (percent: number) => {
    if (percent >= 85) return 'text-emerald-600'
    if (percent >= 60) return 'text-amber-600'
    return 'text-red-500'
  }

  if (loading && savedQueries.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="py-8 px-4 md:px-8 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">My Learning</h1>
              <p className="text-muted-foreground">Track progress, review tests, and earn XP • Built from your searches</p>
            </div>
            <Button variant="outline" onClick={generateLearningPath} disabled={generatingPath || savedQueries.length === 0} className="gap-2">
              {generatingPath ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh Path
            </Button>
          </div>

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

          {/* In Progress Section */}
          <div className="mb-12">
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6">
              <Clock className="h-6 w-6 text-amber-500" />
              In Progress
            </h2>
            {inProgress.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                No topics in progress yet. Head to Discover to add something new!
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {inProgress.map((topic, index) => (
                  <Card key={index} className="border-0 shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{topic.title}</CardTitle>
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">In Progress</Badge>
                      </div>
                      <CardDescription>{topic.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{topic.progress_percentage}%</span>
                        </div>
                        <Progress value={topic.progress_percentage} className="h-2" />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span>XP Earned</span>
                        </div>
                        <span className="font-semibold">{topic.xp_earned} / {topic.xp_total}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Last accessed {topic.last_accessed}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed Section */}
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              Completed
            </h2>
            {completed.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                No completed topics yet. Finish a topic to see test reviews and XP breakdown here.
              </Card>
            ) : (
              <div className="space-y-6">
                {completed.map((topic, index) => (
                  <Card key={index} className="border-0 shadow-sm overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            {topic.title}
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                              Completed
                            </Badge>
                          </CardTitle>
                          <CardDescription>{topic.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${proficiencyColor(topic.progress_percentage)}`}>
                            {topic.progress_percentage}%
                          </div>
                          <p className="text-xs text-muted-foreground">Proficiency</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-6 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="h-4 w-4" />
                          XP Earned
                        </div>
                        <span className="font-semibold text-emerald-600">{topic.xp_earned} / {topic.xp_total} XP</span>
                      </div>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="review">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Review Test Questions &amp; Answers
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-8 pt-4">
                              {topic.quiz?.questions.map((q, qIdx) => (
                                <div key={qIdx} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5">
                                  <p className="font-medium mb-3">{q.question}</p>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Your answer:</span>
                                      <span className={q.userAnswer === q.correctAnswer ? 'text-emerald-600' : 'text-red-500'}>
                                        {q.userAnswer}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Correct answer:</span>
                                      <span className="text-emerald-600 font-medium">{q.correctAnswer}</span>
                                    </div>
                                  </div>
                                  <div className="mt-4 text-xs flex items-center justify-between">
                                    <span className="text-muted-foreground">XP for this question</span>
                                    <Badge variant="outline">+{q.xpValue}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}