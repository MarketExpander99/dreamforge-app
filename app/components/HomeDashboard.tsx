import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Users, Trophy, Target, Calendar, TrendingUp, Star, Clock } from 'lucide-react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'

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

      <main className="ml-64 max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {userName}! 👋
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Ready to continue your learning journey?
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`${action.color} p-2 rounded-lg`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7 days</div>
                <p className="text-xs text-muted-foreground">Keep it up!</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24h</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest learning progress and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed Mathematics Module</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                  <Badge variant="secondary">+50 XP</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                    <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Achievement Unlocked: Math Master</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                  <Badge variant="secondary">Achievement</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                    <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Started Science Curriculum</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                  <Badge variant="outline">In Progress</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}