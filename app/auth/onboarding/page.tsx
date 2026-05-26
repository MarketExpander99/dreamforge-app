'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { updateUserProfileAction } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, BookOpen, Users, Trophy } from 'lucide-react'

export default function OnboardingPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [grade, setGrade] = useState('grade-3')
  const [curriculum, setCurriculum] = useState('CAPS')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Supabase not configured:', error)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [loading, user, router])

  const handleContinue = async () => {
    if (user) {
      try {
        // Update user profile with grade + curriculum and mark onboarding complete
        await updateUserProfileAction(user.id, {
          grade_level: grade,
          role: 'student'
        })
        // Also set onboarding_completed via direct update (minimal)
        const supabase = createBrowserSupabaseClient()
        await supabase.from('profiles').update({ onboarding_completed: true, interests: [curriculum] }).eq('id', user.id)
      } catch (error) {
        console.error('Error updating profile:', error)
      }
    }
    router.push('/student')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to Skill Gain!</CardTitle>
          <CardDescription className="text-lg">
            Your account has been created successfully. Let's get you started on your learning journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <BookOpen className="h-8 w-8 mb-2 text-blue-600" />
              <h3 className="font-semibold">Learn Through Discovery</h3>
              <p className="text-sm text-muted-foreground">
                Explore fascinating topics in bite-sized, engaging content
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <Users className="h-8 w-8 mb-2 text-purple-600" />
              <h3 className="font-semibold">Interactive Learning</h3>
              <p className="text-sm text-muted-foreground">
                Test your knowledge with quizzes and challenges
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <Trophy className="h-8 w-8 mb-2 text-yellow-600" />
              <h3 className="font-semibold">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your learning journey and achievements
              </p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium">Select your grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-2 border rounded">
                <option value="grade-r">Grade R</option>
                <option value="grade-1">Grade 1</option>
                <option value="grade-2">Grade 2</option>
                <option value="grade-3">Grade 3</option>
                <option value="grade-4">Grade 4</option>
                <option value="grade-5">Grade 5</option>
                <option value="grade-6">Grade 6</option>
                <option value="grade-7">Grade 7</option>
                <option value="grade-8">Grade 8</option>
                <option value="grade-9">Grade 9</option>
                <option value="grade-10">Grade 10</option>
                <option value="grade-11">Grade 11</option>
                <option value="grade-12">Grade 12</option>
              </select>
              <label className="text-sm font-medium">Curriculum</label>
              <select value={curriculum} onChange={(e) => setCurriculum(e.target.value)} className="w-full p-2 border rounded">
                <option value="CAPS">CAPS (South Africa)</option>
                <option value="Cambridge">Cambridge</option>
                <option value="IB">IB</option>
              </select>
            </div>
            <p className="text-muted-foreground">
              Ready to start exploring? Your personalized feed is waiting for you.
            </p>
            <Button onClick={handleContinue} size="lg" className="px-8">
              Start Learning →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}