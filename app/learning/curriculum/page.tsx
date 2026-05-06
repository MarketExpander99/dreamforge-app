'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/user-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Recommendations } from '@/components/recommendations'
import { BookOpen, Target, Clock, Star, ChevronRight, Play } from 'lucide-react'

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

interface LearningPath {
  id: string
  current_grade: string
  progress_percentage: number
  status: string
  subjects: {
    name: string
    icon: string
    color: string
  }
}

export default function CurriculumPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
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
    try {
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
    } finally {
      setLoading(false)
    }
  }

  const startLessonPlan = async (lessonPlanId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create or update learning path
      const { error } = await supabase
        .from('learning_paths')
        .upsert({
          user_id: user.id,
          curriculum_id: curriculums.find(c => c.name === selectedCurriculum)?.id,
          subject_id: lessonPlans.find(lp => lp.id === lessonPlanId)?.subject_id,
          current_grade: selectedGrade,
          current_lesson: lessonPlanId,
          last_accessed_at: new Date().toISOString()
        })

      if (error) throw error

      // Navigate to lesson (you would implement this navigation)
      console.log('Starting lesson:', lessonPlanId)

    } catch (error) {
      console.error('Error starting lesson:', error)
    }
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
    <div className="container mx-auto px-4 py-8">
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

      <Tabs defaultValue="curriculum" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="curriculum">Curriculum Browser</TabsTrigger>
          <TabsTrigger value="lessons">Lesson Plans</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-6">
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

          {/* Subjects Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>Available subjects for {selectedGrade} in {selectedCurriculum}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects
                  .filter(subject => subject.grade_levels.includes(selectedGrade))
                  .map((subject) => (
                    <Card key={subject.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{subject.icon}</span>
                          <div>
                            <h3 className="font-semibold">{subject.name}</h3>
                            <Badge
                              style={{ backgroundColor: subject.color }}
                              className="text-white text-xs"
                            >
                              {selectedGrade}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{subject.description}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}