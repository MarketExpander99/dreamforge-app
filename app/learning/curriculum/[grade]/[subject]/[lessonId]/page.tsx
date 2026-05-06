'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/user-context'
import { useAchievements } from '@/lib/achievements'
import { updateLearningPathsOnProgress } from '@/lib/data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  CheckCircle,
  Play,
  BookOpen,
  Video,
  Image as ImageIcon,
  Headphones,
  HelpCircle,
  ArrowLeft,
  Trophy
} from 'lucide-react'

interface LessonPlan {
  id: string
  title: string
  description: string
  grade_level: string
  duration_minutes: number
  unit_title: string
  term: string
  week: number
  difficulty: string
  subject_id: string
  subjects: {
    name: string
    icon: string
    color: string
  }
  prerequisites: string[]
}

interface ContentItem {
  id: string
  title: string
  content: string
  type: 'text' | 'text-image' | 'video' | 'quiz' | 'audio'
  image_url?: string
  video_url?: string
  audio_url?: string
  quiz?: any
  read_time: number
}

interface LessonContent {
  id: string
  content_id: string
  sequence_order: number
  content_type: string
  is_required: boolean
  estimated_duration: number
  content_items: ContentItem
}

interface UserProgress {
  id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  time_spent: number
  completed_at?: string
  last_accessed_at: string
}

export default function LessonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [lessonContent, setLessonContent] = useState<LessonContent[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [currentContentIndex, setCurrentContentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [nextLesson, setNextLesson] = useState<LessonPlan | null>(null)
  const [previousLesson, setPreviousLesson] = useState<LessonPlan | null>(null)

  const supabase = createBrowserSupabaseClient()
  const grade = params.grade as string
  const subject = params.subject as string
  const lessonId = params.lessonId as string

  useEffect(() => {
    loadLessonData()
  }, [lessonId, user])

  const loadLessonData = async () => {
    setLoading(true)
    try {
      // Load lesson plan
      const { data: lessonData } = await supabase
        .from('lesson_plans')
        .select(`
          *,
          subjects (
            name,
            icon,
            color
          )
        `)
        .eq('id', lessonId)
        .single()

      if (lessonData) {
        setLessonPlan(lessonData)

        // Load lesson content
        const { data: contentData } = await supabase
          .from('lesson_content')
          .select(`
            *,
            content_items (*)
          `)
          .eq('lesson_plan_id', lessonId)
          .order('sequence_order')

        setLessonContent(contentData || [])

        // Load user progress
        if (user) {
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('content_id', contentData?.[0]?.content_id || '')
            .single()

          if (progressData) {
            setUserProgress(progressData)
            // Find the last accessed content item
            const lastAccessedIndex = contentData?.findIndex(
              (item: any) => item.content_id === progressData.content_id
            ) || 0
            setCurrentContentIndex(lastAccessedIndex)
          }
        }

        // Load next/previous lessons
        await loadAdjacentLessons(lessonData.subject_id, lessonData.sequence_order)
      }
    } catch (error) {
      console.error('Error loading lesson data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdjacentLessons = async (subjectId: string, currentSequence: number) => {
    try {
      // Load next lesson
      const { data: nextData } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('grade_level', grade)
        .gt('sequence_order', currentSequence)
        .order('sequence_order')
        .limit(1)
        .single()

      setNextLesson(nextData)

      // Load previous lesson
      const { data: prevData } = await supabase
        .from('lesson_plans')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('grade_level', grade)
        .lt('sequence_order', currentSequence)
        .order('sequence_order', { ascending: false })
        .limit(1)
        .single()

      setPreviousLesson(prevData)
    } catch (error) {
      console.error('Error loading adjacent lessons:', error)
    }
  }

  const updateProgress = async (contentId: string, status: string, progressPercent: number = 100) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          status,
          progress_percentage: progressPercent,
          time_spent: (userProgress?.time_spent || 0) + 1,
          last_accessed_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })

      if (error) throw error

      // Update local state
      setUserProgress(prev => ({
        ...prev!,
        status: status as any,
        progress_percentage: progressPercent,
        time_spent: (prev?.time_spent || 0) + 1,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
        last_accessed_at: new Date().toISOString()
      }))

    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const markCurrentContentComplete = async () => {
    const currentContent = lessonContent[currentContentIndex]
    if (currentContent && user) {
      await updateProgress(currentContent.content_id, 'completed')

      // Check for new achievements
      const { checkAchievements } = useAchievements()
      const achievementResult = await checkAchievements(user.id)
      if (achievementResult.success && achievementResult.newAchievements.length > 0) {
        // Could show a toast notification here for new achievements
        console.log('New achievements earned:', achievementResult.newAchievements)
      }

      // Check if this is the last content item in the lesson
      const isLastContentItem = currentContentIndex >= lessonContent.length - 1

      if (isLastContentItem) {
        // Update learning paths when the entire lesson is completed
        try {
          await updateLearningPathsOnProgress(user.id, lessonId)
        } catch (error) {
          console.error('Error updating learning paths:', error)
        }
      }

      // Move to next content item if available
      if (currentContentIndex < lessonContent.length - 1) {
        setCurrentContentIndex(currentContentIndex + 1)
      }
    }
  }

  const navigateToLesson = (lesson: LessonPlan) => {
    const subjectSlug = lesson.subjects?.name.toLowerCase().replace(/\s+/g, '-')
    router.push(`/learning/curriculum/${grade}/${subjectSlug}/${lesson.id}`)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />
      case 'audio': return <Headphones className="h-5 w-5" />
      case 'quiz': return <HelpCircle className="h-5 w-5" />
      case 'text-image': return <ImageIcon className="h-5 w-5" />
      default: return <BookOpen className="h-5 w-5" />
    }
  }

  const CircularProgress = ({ value }: { value: number }) => {
    const radius = 32
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (value / 100) * circumference
    return (
      <svg className="w-16 h-16" viewBox="0 0 70 70">
        <circle
          cx="35"
          cy="35"
          r={radius}
          strokeWidth="6"
          stroke="hsl(var(--muted))"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
        <circle
          cx="35"
          cy="35"
          r={radius}
          strokeWidth="6"
          stroke="hsl(var(--primary))"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 35 35)"
        />
        <text x="35" y="40" textAnchor="middle" className="text-sm font-semibold">
          {value}%
        </text>
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!lessonPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson Not Found</h2>
          <p className="text-gray-600">The lesson you're looking for doesn't exist.</p>
          <Button
            onClick={() => router.back()}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const currentContent = lessonContent[currentContentIndex]
  const overallProgress = lessonContent.length > 0
    ? Math.round(((currentContentIndex + 1) / lessonContent.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Curriculum
            </Button>
            <div className="flex items-center space-x-4">
              <CircularProgress value={overallProgress} />
              <div className="text-right">
                <p className="text-sm text-gray-600">Lesson Progress</p>
                <p className="text-lg font-semibold">{currentContentIndex + 1} of {lessonContent.length}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl">{lessonPlan.subjects?.icon}</span>
                <div>
                  <h1 className="text-2xl font-bold">{lessonPlan.title}</h1>
                  <p className="text-gray-600">{lessonPlan.subjects?.name} • {lessonPlan.grade_level}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{lessonPlan.description}</p>
              <div className="flex items-center space-x-4">
                <Badge className={getDifficultyColor(lessonPlan.difficulty)}>
                  {lessonPlan.difficulty}
                </Badge>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{lessonPlan.duration_minutes} min</span>
                </div>
                {lessonPlan.term && (
                  <Badge variant="outline">
                    {lessonPlan.term} Week {lessonPlan.week}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentContent && (
              <motion.div
                key={currentContentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      {getContentIcon(currentContent.content_items.type)}
                      <div>
                        <CardTitle>{currentContent.content_items.title}</CardTitle>
                        <CardDescription>
                          {currentContent.content_type} • {currentContent.estimated_duration || currentContent.content_items.read_time} min read
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Content Display */}
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: currentContent.content_items.content }} />
                    </div>

                    {/* Media Content */}
                    {currentContent.content_items.image_url && (
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={currentContent.content_items.image_url}
                          alt={currentContent.content_items.title}
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {currentContent.content_items.video_url && (
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={currentContent.content_items.video_url}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {currentContent.content_items.audio_url && (
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <audio controls className="w-full">
                          <source src={currentContent.content_items.audio_url} />
                        </audio>
                      </div>
                    )}

                    {/* Quiz Content */}
                    {currentContent.content_items.quiz && (
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="font-semibold mb-4">Knowledge Check</h3>
                        <div className="space-y-4">
                          <p className="font-medium">{currentContent.content_items.quiz.question}</p>
                          <div className="space-y-2">
                            {currentContent.content_items.quiz.options?.map((option: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="quiz-answer"
                                  value={index}
                                  className="text-blue-600"
                                />
                                <label>{option}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completion Button */}
                    <div className="flex justify-between items-center pt-6 border-t">
                      <div className="text-sm text-gray-600">
                        {userProgress?.status === 'completed' ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <span>Mark as complete to continue</span>
                        )}
                      </div>
                      <Button
                        onClick={markCurrentContentComplete}
                        disabled={userProgress?.status === 'completed'}
                      >
                        {userProgress?.status === 'completed' ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Trophy className="h-4 w-4 mr-2" />
                            Mark Complete
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lesson Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previousLesson && (
                  <Button
                    onClick={() => navigateToLesson(previousLesson)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous: {previousLesson.title}
                  </Button>
                )}

                {nextLesson && (
                  <Button
                    onClick={() => navigateToLesson(nextLesson)}
                    className="w-full justify-start"
                  >
                    Next: {nextLesson.title}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Lesson Content List */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lessonContent.map((content, index) => (
                    <div
                      key={content.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        index === currentContentIndex
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentContentIndex(index)}
                    >
                      <div className={`p-1 rounded ${
                        index <= currentContentIndex ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {index < currentContentIndex ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : index === currentContentIndex ? (
                          <Play className="h-4 w-4 text-blue-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{content.content_items.title}</p>
                        <p className="text-xs text-gray-600">{content.content_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Unit</p>
                  <p className="text-sm text-gray-600">{lessonPlan.unit_title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-gray-600">{lessonPlan.duration_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Difficulty</p>
                  <Badge className={getDifficultyColor(lessonPlan.difficulty)}>
                    {lessonPlan.difficulty}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}