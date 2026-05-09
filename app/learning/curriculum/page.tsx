'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/user-context'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProminentTabs, ProminentTabsContent, ProminentTabsList, ProminentTabsTrigger } from '@/components/ui/prominent-tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Recommendations } from '@/components/recommendations'
import { BookOpen, Target, Clock, Star, ChevronRight, Play, ChevronDown, CheckCircle, Lock, MapPin, Route } from 'lucide-react'
import { getNextBestLesson, LearningPath, NextBestLesson } from '@/lib/data'
import { useCurriculumCache } from '@/lib/curriculum-cache'

interface Curriculum {
  id: string
  name: string
  country: string
  description: string
  grade_levels: string[]
}

interface Subject {
  id: string
  name: string
  description: string
  icon: string
  color: string
  grade_levels: string[]
}

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
}



export default function CurriculumPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { cacheItem, getItems, preloadPopular } = useCurriculumCache()
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('CAPS')
  const [selectedGrade, setSelectedGrade] = useState<string>('Grade 3')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isParent, setIsParent] = useState(false)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [subjectLessons, setSubjectLessons] = useState<Record<string, LessonPlan[]>>({})
  const [nextBestLesson, setNextBestLesson] = useState<NextBestLesson | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    if (profile?.role === 'parent') {
      setIsParent(true)
      loadChildren()
    } else {
      setSelectedUserId(user?.id || null)
    }
  }, [profile, user])

  useEffect(() => {
    loadCurriculumData()
  }, [selectedCurriculum, selectedGrade, selectedUserId])

  // Load next best lesson recommendation
  useEffect(() => {
    const loadNextBestLesson = async () => {
      if (selectedUserId) {
        try {
          const lesson = await getNextBestLesson(selectedUserId)
          setNextBestLesson(lesson)
        } catch (error) {
          console.error('Error loading next best lesson:', error)
          setNextBestLesson(null)
        }
      }
    }

    loadNextBestLesson()
  }, [selectedUserId])

  const loadChildren = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, grade_level')
      .eq('parent_id', user.id)
      .eq('role', 'student')
    setChildren(data || [])
    if (data && data.length > 0) {
      setSelectedUserId(data[0].id)
    }
  }

  const loadCurriculumData = async () => {
    setLoading(true)
    setIsOffline(!navigator.onLine)

    try {
      // Check if we're offline and try to load from cache first
      if (!navigator.onLine) {
        console.log('Offline mode: Loading from cache')
        try {
          const cachedLessons = await getItems({ limit: 50 })
          if (cachedLessons.length > 0) {
            // Transform cached data to match expected format
            const lessonPlans = cachedLessons.map(item => ({
              id: item.id,
              title: item.title,
              description: item.content.substring(0, 200) + '...',
              grade_level: selectedGrade,
              duration_minutes: 45, // Default duration
              unit_title: 'Unit',
              term: 'Term 1',
              week: 1,
              difficulty: item.difficulty,
              subject_id: item.category_id || '',
              subjects: {
                name: 'Subject',
                icon: '📚',
                color: '#3b82f6'
              }
            }))
            setLessonPlans(lessonPlans)
            setLoading(false)
            return
          }
        } catch (cacheError) {
          console.warn('Failed to load from cache:', cacheError)
        }
      }

      // Load curriculums
      const { data: curriculumData } = await supabase
        .from('curriculums')
        .select('*')
        .eq('is_active', true)

      setCurriculums(curriculumData || [])

      const capsCurriculum = curriculumData?.find(c => c.name === 'CAPS')
      const capsId = capsCurriculum?.id

      // Load subjects for CAPS
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('*')
        .eq('curriculum_id', capsId)
        .eq('is_active', true)

      setSubjects(subjectData || [])

      // Load lesson plans for selected grade
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
        .eq('grade_level', selectedGrade)
        .eq('is_active', true)
        .order('sequence_order')

      setLessonPlans(lessonData || [])

      // Cache lesson content for offline access
      if (navigator.onLine && lessonData) {
        try {
          // Get content items for these lessons
          const lessonIds = lessonData.map(lesson => lesson.id)
          const { data: contentItems } = await supabase
            .from('content_items')
            .select('*')
            .in('lesson_id', lessonIds)
            .eq('is_published', true)
            .limit(20) // Cache first 20 items

          if (contentItems) {
            for (const item of contentItems) {
              try {
                await cacheItem(item)
              } catch (cacheError) {
                console.warn(`Failed to cache item ${item.id}:`, cacheError)
              }
            }
          }
        } catch (cacheError) {
          console.warn('Failed to cache curriculum content:', cacheError)
        }
      }

      // Load user's learning paths
      if (selectedUserId) {
        const { data: pathData } = await supabase
          .from('learning_paths')
          .select(`
            *,
            subjects (
              name,
              icon,
              color
            )
          `)
          .eq('user_id', selectedUserId)
          .eq('status', 'active')

        setLearningPaths(pathData || [])
      }

    } catch (error) {
      console.error('Error loading curriculum data:', error)

      // If online request fails, try cache as fallback
      if (navigator.onLine) {
        try {
          const cachedLessons = await getItems({ limit: 20 })
          if (cachedLessons.length > 0) {
            const lessonPlans = cachedLessons.map(item => ({
              id: item.id,
              title: item.title,
              description: item.content.substring(0, 200) + '...',
              grade_level: selectedGrade,
              duration_minutes: 45,
              unit_title: 'Unit',
              term: 'Term 1',
              week: 1,
              difficulty: item.difficulty,
              subject_id: item.category_id || '',
              subjects: {
                name: 'Subject',
                icon: '📚',
                color: '#3b82f6'
              }
            }))
            setLessonPlans(lessonPlans)
          }
        } catch (cacheError) {
          console.warn('Cache fallback also failed:', cacheError)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleSubjectExpansion = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects)
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId)
    } else {
      newExpanded.add(subjectId)
      // Load lessons for this subject if not already loaded
      if (!subjectLessons[subjectId]) {
        loadSubjectLessons(subjectId)
      }
    }
    setExpandedSubjects(newExpanded)
  }

  const loadSubjectLessons = async (subjectId: string) => {
    try {
      const { data: lessons } = await supabase
        .from('lesson_plans')
        .select(`
          *,
          subjects (
            name,
            icon,
            color
          )
        `)
        .eq('subject_id', subjectId)
        .eq('grade_level', selectedGrade)
        .eq('is_active', true)
        .order('sequence_order')

      setSubjectLessons(prev => ({
        ...prev,
        [subjectId]: lessons || []
      }))
    } catch (error) {
      console.error('Error loading subject lessons:', error)
    }
  }

  const startLessonPlan = async (lessonPlanId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const lesson = lessonPlans.find(lp => lp.id === lessonPlanId)
      if (!lesson) return

      // Create or update learning path
      const { error } = await supabase
        .from('learning_paths')
        .upsert({
          user_id: user.id,
          curriculum_id: curriculums.find(c => c.name === selectedCurriculum)?.id,
          subject_id: lesson.subject_id,
          current_grade: selectedGrade,
          current_lesson: lessonPlanId,
          last_accessed_at: new Date().toISOString()
        })

      if (error) throw error

      // Navigate to lesson detail page
      const subjectSlug = lesson.subjects?.name.toLowerCase().replace(/\s+/g, '-')
      router.push(`/learning/curriculum/${selectedGrade.toLowerCase().replace(' ', '-')}/${subjectSlug}/${lessonPlanId}`)

    } catch (error) {
      console.error('Error starting lesson:', error)
    }
  }

  const getSubjectProgress = (subjectId: string) => {
    // Calculate progress based on completed lessons in learning paths
    const subjectPath = learningPaths.find(path => path.subject_id === subjectId)
    return subjectPath?.progress_percentage || 0
  }

  const grades = Array.from({length: 12}, (_, i) => `Grade ${i + 1}`)

  const CircularProgress = ({ value }: { value: number }) => {
    const radius = 42
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (value / 100) * circumference
    return (
      <svg className="w-20 h-20" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
          stroke="hsl(var(--muted))"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
          stroke="hsl(var(--primary))"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
    )
  }

  return (
    <>
      <Navigation />
      <div className="md:ml-64 container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CAPS Curriculum Browser</h1>
        <p className="text-gray-600">Structured Grade 1-12 learning paths aligned with South African CAPS</p>
        {isParent && children.length > 0 && (
          <div className="mt-4">
            <Select value={selectedUserId || ''} onValueChange={(value) => setSelectedUserId(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={user?.id || ''}>My Progress</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.full_name} ({child.grade_level || 'No grade'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <ProminentTabs defaultValue="curriculum" className="space-y-6">
        <ProminentTabsList className="grid w-full grid-cols-4">
          <ProminentTabsTrigger value="curriculum">Curriculum Browser</ProminentTabsTrigger>
          <ProminentTabsTrigger value="path">My Path</ProminentTabsTrigger>
          <ProminentTabsTrigger value="lessons">Lesson Plans</ProminentTabsTrigger>
          <ProminentTabsTrigger value="progress">My Progress</ProminentTabsTrigger>
        </ProminentTabsList>

        <ProminentTabsContent value="curriculum" className="space-y-6">
          {/* Curriculum Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Curriculum</CardTitle>
              <CardDescription>Choose the curriculum framework for your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {curriculums.map((curriculum) => (
                  <Card
                    key={curriculum.id}
                    className={`cursor-pointer transition-all ${
                      selectedCurriculum === curriculum.name
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedCurriculum(curriculum.name)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{curriculum.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{curriculum.country}</p>
                      <p className="text-sm">{curriculum.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {curriculum.grade_levels.slice(0, 4).map((grade) => (
                          <Badge key={grade} variant="secondary" className="text-xs">
                            {grade}
                          </Badge>
                        ))}
                        {curriculum.grade_levels.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{curriculum.grade_levels.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grade Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Grade Level</CardTitle>
              <CardDescription>Choose the appropriate grade for lesson planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {curriculums
                  .find(c => c.name === selectedCurriculum)
                  ?.grade_levels.map((grade) => (
                    <Button
                      key={grade}
                      variant={selectedGrade === grade ? 'default' : 'outline'}
                      onClick={() => setSelectedGrade(grade)}
                    >
                      {grade}
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Subjects with Lessons Accordion */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Curriculum</CardTitle>
              <CardDescription>Explore structured learning paths for {selectedGrade} in {selectedCurriculum}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjects
                  .filter(subject => subject.grade_levels.includes(selectedGrade))
                  .map((subject) => {
                    const isExpanded = expandedSubjects.has(subject.id)
                    const subjectProgress = getSubjectProgress(subject.id)
                    const lessons = subjectLessons[subject.id] || []

                    return (
                      <div key={subject.id} className="border rounded-lg overflow-hidden">
                        {/* Subject Header */}
                        <div
                          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => toggleSubjectExpansion(subject.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl">{subject.icon}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{subject.name}</h3>
                              <p className="text-sm text-gray-600">{subject.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <CircularProgress value={subjectProgress} />
                              <p className="text-xs text-gray-600 mt-1">Progress</p>
                            </div>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            </motion.div>
                          </div>
                        </div>

                        {/* Expandable Lessons */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t bg-white"
                            >
                              <div className="p-4">
                                {lessons.length === 0 ? (
                                  <div className="text-center py-8">
                                    <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">Loading lessons...</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {lessons.map((lesson, index) => (
                                      <motion.div
                                        key={lesson.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                              <span className="text-xs font-semibold text-blue-600">
                                                {index + 1}
                                              </span>
                                            </div>
                                            <div className="text-sm">
                                              <p className="font-medium">{lesson.title}</p>
                                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                                <Clock className="h-3 w-3" />
                                                <span>{lesson.duration_minutes} min</span>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                  style={{
                                                    borderColor: subject.color,
                                                    color: subject.color
                                                  }}
                                                >
                                                  {lesson.difficulty}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            startLessonPlan(lesson.id)
                                          }}
                                          className="shrink-0"
                                        >
                                          <Play className="h-3 w-3 mr-1" />
                                          Start
                                        </Button>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
              </div>

              {subjects.filter(subject => subject.grade_levels.includes(selectedGrade)).length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects available</h3>
                  <p className="text-gray-600">Subjects for this grade will be added soon.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ProminentTabsContent>

        <ProminentTabsContent value="path" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-blue-600" />
                Your Personalized Learning Path
              </CardTitle>
              <CardDescription>AI-powered recommendations based on your assessment and progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Next Best Lesson */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Next Best Lesson
                </h3>

                {nextBestLesson ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-2 border-green-200 rounded-lg p-6 bg-gradient-to-r from-green-50 to-blue-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl">
                            {subjects.find(s => s.name === nextBestLesson.subject)?.icon || '📚'}
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold">{nextBestLesson.title}</h4>
                            <p className="text-sm text-gray-600">{nextBestLesson.subject} • {nextBestLesson.grade}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4">{nextBestLesson.reason}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <Badge variant="outline" className="capitalize">
                            {nextBestLesson.estimatedDifficulty}
                          </Badge>
                          <span>Priority: {nextBestLesson.priority}/10</span>
                        </div>
                      </div>
                      <Button
                        size="lg"
                        className="ml-6"
                        onClick={() => {
                          // Navigate to the lesson
                          const subjectSlug = nextBestLesson.subject.toLowerCase().replace(/\s+/g, '-')
                          router.push(`/learning/curriculum/${nextBestLesson.grade.toLowerCase().replace(' ', '-')}/${subjectSlug}/${nextBestLesson.lessonId}`)
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start This Lesson
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h4 className="font-semibold mb-2">No recommendations available</h4>
                      <p className="text-gray-600 mb-4">
                        Complete your grade assessment or start some lessons to get personalized recommendations.
                      </p>
                      <Button
                        onClick={() => router.push('/assessment')}
                        className="mr-2"
                      >
                        Take Assessment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/learning/curriculum')}
                      >
                        Browse Lessons
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Learning Path Overview */}
              {learningPaths.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Active Learning Paths</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {learningPaths.map((path) => (
                      <Card key={path.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl">{path.subjects?.icon}</span>
                            <div>
                              <h4 className="font-semibold">{path.subjects?.name}</h4>
                              <p className="text-sm text-gray-600">{path.current_grade}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{path.progress_percentage}%</span>
                            </div>
                            <Progress value={path.progress_percentage} className="w-full" />
                          </div>
                          <Badge
                            variant={path.status === 'active' ? 'default' : 'secondary'}
                            className="mt-2"
                          >
                            {path.status}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recommended Content</h3>
                <Recommendations
                  title=""
                  subtitle="Based on your learning path and interests"
                  limit={3}
                  showScrollButtons={false}
                />
              </div>
            </CardContent>
          </Card>
        </ProminentTabsContent>

        <ProminentTabsContent value="lessons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Plans for {selectedGrade}</CardTitle>
              <CardDescription>Structured learning sequences with clear objectives</CardDescription>
            </CardHeader>
            <CardContent>
              {lessonPlans.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plans available</h3>
                  <p className="text-gray-600">Lesson plans for this grade will be added soon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lessonPlans.map((lesson) => (
                    <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-xl">{lesson.subjects?.icon}</span>
                              <h3 className="text-lg font-semibold">{lesson.title}</h3>
                              <Badge variant="outline">{lesson.difficulty}</Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{lesson.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{lesson.duration_minutes} min</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Target className="h-4 w-4" />
                                <span>{lesson.unit_title}</span>
                              </div>
                              {lesson.term && (
                                <Badge variant="secondary">{lesson.term} Week {lesson.week}</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => startLessonPlan(lesson.id)}
                            className="ml-4"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Lesson
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </ProminentTabsContent>

        <ProminentTabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Learning Progress</CardTitle>
              <CardDescription>Track your progress across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {learningPaths.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active learning paths</h3>
                  <p className="text-gray-600">Start a lesson plan to begin tracking your progress.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {learningPaths.map((path) => (
                    <Card key={path.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{path.subjects?.icon}</span>
                            <div>
                              <h3 className="font-semibold">{path.subjects?.name}</h3>
                              <p className="text-sm text-gray-600">{path.current_grade}</p>
                            </div>
                          </div>
                          <Badge variant={path.status === 'active' ? 'default' : 'secondary'}>
                            {path.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{path.progress_percentage}%</span>
                          </div>
                          <Progress value={path.progress_percentage} className="w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </ProminentTabsContent>
      </ProminentTabs>
    </div>
  </>
)
}
