'use client'

import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { Recommendations } from '@/components/recommendations'
import { BookOpen, Loader2, GraduationCap, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/user-context'
import { useEffect, useState } from 'react'
import { hasCompletedAssessment } from '@/lib/data'
import { useRouter } from 'next/navigation'

interface ContentItem {
  id: string
  title: string
  content: string
  type: 'text' | 'text-image' | 'video' | 'quiz' | 'audio'
  category_id: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[] | null
  image_url: string | null
  video_url: string | null
  audio_url: string | null
  quiz: {
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  } | null
  read_time: number
  likes: number
  views: number
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string | null
    created_at: string
  }
}

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCompletedAssessmentState, setHasCompletedAssessmentState] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        setError(null)

        let url = '/api/content?limit=10'

        if (user && profile) {
          // Get user profile to determine grade level
          const gradeLevel = profile.grade_level || 'grade-3'
          url += `&gradeLevel=${encodeURIComponent(gradeLevel)}`
        }

        const response = await fetch(url)
        if (response.ok) {
          const items = await response.json()
          setContentItems(items)
        } else {
          // Silent failure - return empty array for graceful degradation
          setContentItems([])
        }
      } catch (error) {
        console.error('Database connection error:', error)
        setError('Failed to load content')
        setContentItems([])
      } finally {
        setLoading(false)
      }
    }

    // Only fetch content after auth is initialized
    if (!authLoading) {
      fetchContent()
    }
  }, [user, profile, authLoading])

  // Check assessment status for new users
  useEffect(() => {
    const checkAssessmentStatus = async () => {
      if (user && profile?.role === 'student') {
        try {
          const completed = await hasCompletedAssessment(user.id)
          setHasCompletedAssessmentState(completed)
        } catch (error) {
          // Silent failure - set default state for graceful degradation
          setHasCompletedAssessmentState(false)
        }
      }
    }

    if (!authLoading && user) {
      checkAssessmentStatus()
    }
  }, [user, profile, authLoading])

  // Auto-redirect teachers to onboarding if not completed
  useEffect(() => {
    if (!authLoading && user && profile) {
      const isTeacher = profile.role === 'teacher'
      const isAdmin = user.email === 'eben.combrinck@proton.me'
      const needsOnboarding = !profile.teacher_onboarding_completed

      // Redirect teachers who haven't completed onboarding
      if ((isTeacher || isAdmin) && needsOnboarding && !window.location.pathname.startsWith('/teacher')) {
        console.log('🎯 Auto-redirecting teacher to onboarding:', user.email)
        router.push('/teacher')
      }
    }
  }, [user, profile, authLoading, router])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
              Your Learning Feed
            </h1>

            {/* Assessment Prompt for New Users */}
            {user && profile?.role === 'student' && hasCompletedAssessmentState === false && (
              <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
                    <GraduationCap className="h-6 w-6 mr-2" />
                    Welcome to Skill Gain! Take Your Grade Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800 dark:text-blue-200 mb-4">
                    Get personalized learning recommendations by taking our quick grade assessment.
                    We'll create a customized learning path just for you!
                  </p>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => router.push('/assessment')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Start Assessment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setHasCompletedAssessmentState(null)} // Hide prompt
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Maybe Later
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personalized Recommendations */}
            {user && (
              <div className="mb-8">
                <Recommendations limit={6} />
              </div>
            )}

            {contentItems.length > 0 ? (
              <div className="space-y-6">
                {contentItems.map((item) => {
                  // Convert database item to FeedCard format
                  const feedCardItem = {
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    content: item.content,
                    imageUrl: item.image_url || undefined,
                    videoUrl: item.video_url || undefined,
                    audioUrl: item.audio_url || undefined,
                    quiz: item.quiz || undefined,
                    category: item.category?.name || 'General',
                    readTime: item.read_time,
                    likes: item.likes,
                    comments: 0 // Not implemented yet
                  }
                  return <FeedCard key={item.id} card={feedCardItem} />
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Welcome to Skill Gain!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your personalized learning journey starts here. Content will appear in your feed once it's added to the platform.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Explore different subjects and start building your knowledge base.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
