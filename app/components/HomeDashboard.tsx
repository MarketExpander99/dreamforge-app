'use client'

import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Users, Trophy, Target, Calendar, TrendingUp, Star, Clock, Sparkles, Compass } from 'lucide-react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { getUserStats, getUserProgress, getUserAchievements, UserProgress, UserAchievement } from '@/lib/data'
import { useEffect, useState } from 'react'

interface Profile {
  role: string
  teacher_onboarding_completed?: boolean
  full_name?: string
  avatar?: string
}

interface HomeDashboardProps {
  user: User
  profile: Profile | null
}

export default function HomeDashboard({ user, profile }: HomeDashboardProps) {
  const userRole = profile?.role || 'student'
  const userName = profile?.full_name || user.email?.split('@')[0] || 'Student'

  const [userStats, setUserStats] = useState<{
    totalCompleted: number
    totalStarted: number
    currentStreak: number
    totalTime: number
    achievements: number
  } | null>(null)

  const [recentProgress, setRecentProgress] = useState<UserProgress[]>([])
  const [recentAchievements, setRecentAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [stats, progress, achievements] = await Promise.all([
          getUserStats(user.id),
          getUserProgress(user.id),
          getUserAchievements(user.id)
        ])

        setUserStats(stats)
        setRecentProgress(progress.slice(0, 3)) // Get 3 most recent progress items
        setRecentAchievements(achievements.slice(0, 2)) // Get 2 most recent achievements
      } catch (error) {
        console.error('Error loading user data:', error)
        // Set empty state for new users
        setUserStats({
          totalCompleted: 0,
          totalStarted: 0,
          currentStreak: 0,
          totalTime: 0,
          achievements: 0
        })
        setRecentProgress([])
        setRecentAchievements([])
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user.id])

  // Check if user is new (no activity)
  const isNewUser = !userStats || (userStats.totalCompleted === 0 && userStats.totalStarted === 0 && userStats.achievements === 0)

  const quickActions = [
    {
      title: 'Continue Learning',
      description: 'Pick up where you left off',
      href: '/learning',
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      title: 'Browse Curriculum',
      description: 'Explore available courses',
      href: '/learning/curriculum',
      icon: Target,
      color: 'bg-green-500'
    },
    {
      title: 'View Profile',
      description: 'Check your progress',
      href: '/profile',
      icon: Users,
      color: 'bg-purple-500'
    }
  ]

  if (userRole === 'teacher') {
    quickActions.unshift({
      title: 'Teacher Dashboard',
      description: 'Manage your classes',
      href: '/teacher',
      icon: Users,
      color: 'bg-orange-500'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Welcome Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-mobile-display text-gray-900 dark:text-white">
              {isNewUser ? `Welcome to Skill Gain, ${userName}! 🎉` : `Welcome back, ${userName}! 👋`}
            </h1>
            <p className="mt-3 text-mobile-body text-gray-600 dark:text-gray-400">
              {isNewUser
                ? "Let's start your learning journey together. Explore our curriculum and begin your first lesson!"
                : "Ready to continue your learning journey?"
              }
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer touch-manipulation min-h-[120px] sm:min-h-[140px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`${action.color} p-2 rounded-lg flex-shrink-0`}>
                        <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg leading-tight">{action.title}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {/* Stats Overview - Only show for users with activity */}
          {!isNewUser && userStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold">{userStats.currentStreak} days</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {userStats.currentStreak > 0 ? 'Keep it up!' : 'Start your streak today!'}
                  </p>
                </CardContent>
              </Card>

              <Card className="touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold">{userStats.totalCompleted}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {userStats.totalStarted > 0 ? `${userStats.totalStarted - userStats.totalCompleted} in progress` : 'Begin your journey!'}
                  </p>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1 touch-manipulation">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold">{Math.round(userStats.totalTime / 60)}h</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Total learning time</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* New User Welcome Section */}
          {isNewUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Ready to Start Learning?</CardTitle>
                      <CardDescription>Begin your educational journey with our curated curriculum</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href="/explore">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Compass className="mr-2 h-4 w-4" />
                      Explore Content
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Set Learning Goals</CardTitle>
                      <CardDescription>Define what you want to achieve and track your progress</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href="/learning/curriculum">
                    <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Browse Curriculum
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {isNewUser ? 'Get Started' : 'Recent Activity'}
              </CardTitle>
              <CardDescription>
                {isNewUser
                  ? 'Begin your learning journey and track your progress here'
                  : 'Your latest learning progress and achievements'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isNewUser ? (
                <div className="text-center py-8">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-6 rounded-lg mb-4">
                    <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Your Learning Journey Starts Here
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Complete your first lesson to see your progress and achievements appear here.
                    </p>
                    <Link href="/explore">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Star className="mr-2 h-4 w-4" />
                        Start Your First Lesson
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProgress.length === 0 && recentAchievements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity to show</p>
                    </div>
                  ) : (
                    <>
                      {/* Show recent progress */}
                      {recentProgress.slice(0, 2).map((progress) => (
                        <div key={progress.id} className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${
                            progress.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900'
                              : 'bg-blue-100 dark:bg-blue-900'
                          }`}>
                            <BookOpen className={`h-4 w-4 ${
                              progress.status === 'completed'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {progress.status === 'completed' ? 'Completed' : 'Started'} {progress.content?.title || 'Content'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(progress.last_accessed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={progress.status === 'completed' ? 'secondary' : 'outline'}>
                            {progress.status === 'completed' ? '+50 XP' : 'In Progress'}
                          </Badge>
                        </div>
                      ))}

                      {/* Show recent achievements */}
                      {recentAchievements.slice(0, 1).map((achievement) => (
                        <div key={achievement.id} className="flex items-center space-x-4">
                          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
                            <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{achievement.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(achievement.earned_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">Achievement</Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}