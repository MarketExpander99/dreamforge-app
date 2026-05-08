'use client'

import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { Recommendations } from '@/components/recommendations'
import { BookOpen, Loader2, GraduationCap, Target, Users, PenTool, CheckCircle, Star, ArrowRight, Play, Award, Shield, Zap, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/user-context'
import { getUserProgress, getUserBookmarks, getUserAchievements, getUserStats, UserProgress, UserBookmark, UserAchievement } from '@/lib/data'
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

// Landing Page Component
function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
              Master Any Skill with
              <span className="block text-blue-600 dark:text-blue-400">Personalized Learning</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Skill Gain adapts to your learning style, pace, and goals. Whether you're a student, teacher, or lifelong learner, discover the joy of mastering new skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={() => router.push('/auth/signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Learning Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/explore')}
                className="border-2 border-gray-300 hover:border-blue-500 text-gray-700 dark:text-gray-300 hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Explore Content
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Skill Gain?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for South African learners with CAPS curriculum alignment and privacy-first design
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* For Students */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  For Students
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Personalized learning paths adapted to your grade level and learning style. Master subjects with interactive content and quizzes.
                </p>
                <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    CAPS-aligned curriculum
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Adaptive difficulty
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Progress tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* For Teachers */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  For Teachers
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Create engaging content, manage classes, and track student progress. Everything you need to inspire the next generation.
                </p>
                <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Class management tools
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Content creation suite
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Student analytics
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* For Parents */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  For Parents
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Monitor your child's learning journey, set goals, and celebrate achievements together. Privacy-focused family learning.
                </p>
                <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Family progress tracking
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Goal setting tools
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    Achievement celebrations
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How Skill Gain Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple, effective, and tailored to South African education standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Assess & Personalize
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Take a quick assessment to understand your current knowledge level. We create a personalized learning path just for you.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Learn & Practice
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Engage with interactive content, videos, quizzes, and exercises. Learn at your own pace with immediate feedback.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Track & Achieve
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your progress, earn achievements, and celebrate milestones. Build confidence with every completed lesson.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Skill Gain Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Skill Gain Stands Out
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Designed specifically for South African learners with curriculum alignment and privacy protection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                CAPS Curriculum Alignment
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Every lesson and assessment is aligned with the South African Curriculum and Assessment Policy Statement (CAPS).
                Learn with confidence knowing your education meets national standards.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Award className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Grade-appropriate content</span>
                </li>
                <li className="flex items-center">
                  <Award className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Assessment standards compliance</span>
                </li>
                <li className="flex items-center">
                  <Award className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">National curriculum coverage</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Privacy-First Design
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your privacy matters. We comply with POPI Act regulations and GDPR standards. Your real name is never displayed publicly.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">POPI Act compliant</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Anonymous public profiles</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Secure data handling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of South African learners already mastering new skills
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Skill Gain helped me understand mathematics in a way my textbook never could. The interactive quizzes and personalized feedback made all the difference."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Sarah M.</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Grade 11 Student</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "As a teacher, I love how Skill Gain aligns perfectly with CAPS requirements. My students are more engaged and performing better than ever."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 dark:text-green-400 font-semibold">M</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Mr. Johnson</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mathematics Teacher</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Watching my daughter go from struggling with science to loving it has been incredible. Skill Gain made learning fun and accessible."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">L</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Linda K.</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Parent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of South African learners already mastering new skills with Skill Gain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth/signup')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg"
            >
              Get Started Free
              <Zap className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/auth/login')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-2xl font-bold">Skill Gain</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering South African learners with personalized, CAPS-aligned education that adapts to every student's unique journey.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 Skill Gain. All rights reserved.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">For Students</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Teachers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Parents</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Content Library</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
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

  // Show loading state while fetching content
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="md:pl-64">
          <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
            <div className="max-w-2xl mx-auto">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-8"></div>
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (!user && !authLoading) {
    return <LandingPage />
  }

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
