'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/user-context'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Clock,
  Target,
  Award,
  Calendar,
  ArrowLeft,
  Download
} from 'lucide-react'

interface AnalyticsData {
  totalStudents: number
  totalClasses: number
  totalContent: number
  totalAssignments: number
  averageCompletion: number
  weeklyActivity: Array<{
    week: string
    hours: number
  }>
  subjectProgress: Array<{
    subject: string
    completed: number
    total: number
    percentage: number
  }>
  topContent: Array<{
    id: string
    title: string
    views: number
    completionRate: number
  }>
}

export default function TeacherAnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      try {
        const supabase = createBrowserSupabaseClient()

        // Get teacher's classes
        const { data: classes } = await supabase
          .from('teacher_classes')
          .select('id')
          .eq('teacher_id', user.id)

        const classIds = classes?.map(c => c.id) || []

        // Get student count
        const { count: totalStudents } = await supabase
          .from('class_students')
          .select('*', { count: 'exact', head: true })
          .in('class_id', classIds)

        // Get content count
        const { count: totalContent } = await supabase
          .from('content_items')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id)

        // Get assignment count (placeholder - table doesn't exist yet)
        const totalAssignments = 0

        // Get completion data
        const { data: progressData } = await supabase
          .from('user_progress')
          .select(`
            status,
            content:content_items(
              category_id,
              teacher_id
            )
          `)
          .in('content.teacher_id', [user.id])

        const completedItems = progressData?.filter(p => p.status === 'completed').length || 0
        const totalItems = progressData?.length || 0
        const averageCompletion = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

        // Mock weekly activity data (would need real implementation)
        const weeklyActivity = [
          { week: 'Week 1', hours: 12 },
          { week: 'Week 2', hours: 15 },
          { week: 'Week 3', hours: 18 },
          { week: 'Week 4', hours: 14 }
        ]

        // Mock subject progress (would need real implementation)
        const subjectProgress = [
          { subject: 'Mathematics', completed: 8, total: 10, percentage: 80 },
          { subject: 'Science', completed: 6, total: 8, percentage: 75 },
          { subject: 'English', completed: 12, total: 15, percentage: 80 }
        ]

        // Mock top content (would need real implementation)
        const topContent = [
          { id: '1', title: 'Introduction to Algebra', views: 45, completionRate: 85 },
          { id: '2', title: 'Basic Chemistry', views: 38, completionRate: 78 },
          { id: '3', title: 'Shakespeare Overview', views: 32, completionRate: 92 }
        ]

        setAnalytics({
          totalStudents: totalStudents || 0,
          totalClasses: classIds.length,
          totalContent: totalContent || 0,
          totalAssignments,
          averageCompletion,
          weeklyActivity,
          subjectProgress,
          topContent
        })

      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Analytics not available
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Unable to load analytics data at this time.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Teacher Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Insights into your teaching impact and student progress
                </p>
              </div>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalStudents}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Classes
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalClasses}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Content Items
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalContent}
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg. Completion
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Math.round(analytics.averageCompletion)}%
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Learning Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.weeklyActivity.map((week, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{week.week}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(week.hours / 20) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                        {week.hours}h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Subject Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.subjectProgress.map((subject, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{subject.subject}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {subject.completed}/{subject.total}
                      </span>
                    </div>
                    <Progress value={subject.percentage} className="h-2" />
                    <div className="text-xs text-gray-500 text-right">
                      {Math.round(subject.percentage)}% complete
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Most Popular Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topContent.map((content, index) => (
                <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{content.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{content.views} views</span>
                        <span>{content.completionRate}% completion</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {content.completionRate}% complete
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Teaching Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Student Engagement
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your students are highly engaged with an average completion rate of {Math.round(analytics.averageCompletion)}%.
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Content Performance
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your top content has an average completion rate of 85%, indicating high quality materials.
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Growth Opportunity
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Consider creating more content in subjects where completion rates are below 80%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}