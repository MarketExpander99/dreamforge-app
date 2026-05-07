"use client";

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  Users,
  BookOpen,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

interface ClassData {
  id: string
  name: string
  subject: string
  grade_level: string
  description: string | null
  teacher_id: string
  max_students: number
  settings: any
  learning_goals: string[] | null
  created_at: string
  teacher_name?: string
  student_count?: number
}

export default function JoinClassPage() {
  const params = useParams()
  const router = useRouter()
  const classCode = params.classCode as string
  const supabase = createBrowserSupabaseClient()

  const [classData, setClassData] = useState<ClassData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)

  useEffect(() => {
    const checkAuthAndLoadClass = async () => {
      try {
        // Check if user is authenticated
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

        if (userError || !currentUser) {
          // Redirect to login if not authenticated
          router.push(`/auth/login?redirect=/join/${classCode}`)
          return
        }

        setUser(currentUser)

        // Check if user profile exists and is a student
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (profileError || !profile) {
          setError('Please complete your profile setup before joining a class.')
          return
        }

        if (profile.role !== 'student') {
          setError('Only students can join classes.')
          return
        }

        // Load class data
        const { data: classInfo, error: classError } = await supabase
          .from('teacher_classes')
          .select(`
            *,
            profiles!teacher_classes_teacher_id_fkey(full_name)
          `)
          .eq('class_code', classCode)
          .eq('is_active', true)
          .single()

        if (classError || !classInfo) {
          setError('Class not found or no longer available.')
          return
        }

        // Check if student is already enrolled
        const { data: enrollment, error: enrollError } = await supabase
          .from('class_students')
          .select('*')
          .eq('class_id', classInfo.id)
          .eq('student_id', currentUser.id)
          .eq('status', 'active')
          .single()

        if (enrollment) {
          setIsAlreadyEnrolled(true)
        }

        // Get student count
        const { count: studentCount, error: countError } = await supabase
          .from('class_students')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', classInfo.id)
          .eq('status', 'active')

        setClassData({
          ...classInfo,
          teacher_name: classInfo.profiles?.full_name || 'Unknown Teacher',
          student_count: studentCount || 0
        })

      } catch (err: any) {
        setError(err.message || 'Failed to load class information')
      } finally {
        setIsLoading(false)
      }
    }

    if (classCode) {
      checkAuthAndLoadClass()
    }
  }, [classCode, router, supabase])

  const handleJoinClass = async () => {
    if (!classData || !user) return

    setIsJoining(true)
    setError('')

    try {
      // Check if class is full
      if (classData.student_count && classData.student_count >= classData.max_students) {
        throw new Error('This class is already full.')
      }

      // Check if self-enrollment is allowed
      if (!classData.settings?.allow_self_enrollment) {
        throw new Error('Self-enrollment is not allowed for this class. Please contact your teacher.')
      }

      // Join the class
      const { error: joinError } = await supabase
        .from('class_students')
        .insert({
          class_id: classData.id,
          student_id: user.id,
          status: 'active'
        })

      if (joinError) {
        if (joinError.code === '23505') { // Unique constraint violation
          throw new Error('You are already enrolled in this class.')
        }
        throw new Error(joinError.message)
      }

      setSuccess(true)

      // Redirect to student dashboard after a short delay
      setTimeout(() => {
        router.push('/student')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to join class')
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="md:pl-64">
          <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading class information...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error && !classData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="md:pl-64">
          <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="md:pl-64">
          <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">Class not found.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Join Class</h1>
                <p className="text-muted-foreground">
                  You're about to join a class using invite code: <code className="bg-muted px-2 py-1 rounded font-mono">{classCode}</code>
                </p>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800">
                  Successfully joined the class! Redirecting to your dashboard...
                </p>
              </div>
            )}

            {/* Class Information */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{classData.name}</CardTitle>
                    <CardDescription className="text-base">
                      {classData.subject} • {classData.grade_level.replace('grade-', 'Grade ')}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {classData.student_count}/{classData.max_students} students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {classData.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{classData.description}</p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Teacher</h3>
                    <p className="text-muted-foreground">{classData.teacher_name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Subject</h3>
                    <p className="text-muted-foreground capitalize">{classData.subject.replace('-', ' ')}</p>
                  </div>
                </div>

                {classData.learning_goals && classData.learning_goals.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Learning Goals</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {classData.learning_goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Active class</span>
                  </div>
                  {classData.settings?.enable_gamification && (
                    <Badge variant="outline" className="text-xs">
                      Gamification Enabled
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Join Action */}
            <div className="flex gap-4">
              {isAlreadyEnrolled ? (
                <div className="w-full">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-800">
                      You are already enrolled in this class.
                    </p>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <Button asChild className="flex-1">
                      <Link href="/student">
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/student/classes/${classData.id}`}>
                        View Class
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleJoinClass}
                    className="flex-1"
                    disabled={isJoining || success}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Joining Class...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join This Class
                      </>
                    )}
                  </Button>
                  <Button variant="outline" asChild disabled={isJoining}>
                    <Link href="/">
                      Cancel
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}