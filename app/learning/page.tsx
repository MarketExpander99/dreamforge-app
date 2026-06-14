"use client"

import { 
  BookOpen, Search, Lightbulb, Loader2, RefreshCw, 
  ExternalLink, GraduationCap, Clock, CheckCircle2, Trophy 
} from 'lucide-react'
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
  status?: 'in_progress' | 'completed'
  progress_percentage?: number
  xp_earned?: number
  xp_total?: number
  last_accessed?: string
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

  // Auto-generate from history (improved)
  useEffect(() => {
    if (savedQueries.length > 0 && learningPath.length === 0 && !generatingPath) {
      generateLearningPath()
    }
  }, [savedQueries.length])

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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <GraduationCap className="h-8 w-8 text-zinc-700 dark:text-zinc-300" />
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">My Learning</h1>
              </div>
              <p className="text-muted-foreground">Personalized path + formal courses from your discovery &amp; AI chat history</p>
            </div>
            <Button 
              variant="outline" 
              onClick={generateLearningPath} 
              disabled={generatingPath || savedQueries.length === 0}
              className="gap-2"
            >
              {generatingPath ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate
            </Button>
          </div>

          {/* Search History */}
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <Search className="h-5 w-5" />
                Search &amp; Question History
              </CardTitle>
              <CardDescription>
                {savedQueries.length > 0 
                  ? `Using your ${savedQueries.length} explorations to build a personalized experience` 
                  : 'These drive your personalized recommendations'}
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
                <p className="text-zinc-500 dark:text-zinc-400 py-12 text-center">No saved searches yet. Start exploring in Discover.</p>
              )}
            </CardContent>
          </Card>

          {/* In Progress */}
          <div className="mb-12">
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6">
              <Clock className="h-6 w-6 text-amber-500" />
              In Progress
            </h2>
            {inProgress.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                No topics in progress yet.
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
                          <span className="font-medium">{topic.progress_percentage ?? 0}%</span>
                        </div>
                        <Progress value={topic.progress_percentage ?? 0} className="h-2" />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span>XP Earned</span>
                        </div>
                        <span className="font-semibold">{topic.xp_earned ?? 0} / {topic.xp_total ?? 0}</span>
                      </div>
                      {topic.last_accessed && (
                        <p className="text-xs text-muted-foreground">Last accessed {topic.last_accessed}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Completed */}
          <div className="mb-12">
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              Completed
            </h2>
            {completed.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                No completed topics yet.
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
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Completed</Badge>
                          </CardTitle>
                          <CardDescription>{topic.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${proficiencyColor(topic.progress_percentage ?? 0)}`}>
                            {topic.progress_percentage ?? 0}%
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
                        <span className="font-semibold text-emerald-600">{topic.xp_earned ?? 0} / {topic.xp_total ?? 0} XP</span>
                      </div>

                      {topic.quiz?.questions && topic.quiz.questions.length > 0 && (
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
                                {topic.quiz.questions.map((q, qIdx) => (
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
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

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
                  Formal course recommendations will appear here once your discovery history is analyzed.
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