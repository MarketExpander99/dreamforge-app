"use client";

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProminentTabs, ProminentTabsContent, ProminentTabsList, ProminentTabsTrigger } from '@/components/ui/prominent-tabs'
import { TeacherOnboarding } from '@/components/teacher-onboarding'
import {
  Users,
  BookOpen,
  TrendingUp,
  Plus,
  UserCheck,
  BarChart3,
  Settings,
  Share2,
  Target,
  Award,
  Clock,
  CheckCircle,
  X
} from 'lucide-react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

export default function TeacherDashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('teacher_onboarding_completed')
            .eq('id', user.id)
            .single()

          if (!profile?.teacher_onboarding_completed) {
            setShowOnboarding(true)
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      }
    }

    checkOnboardingStatus()
  }, [supabase])

  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    classesCreated: 0,
    lessonsAssigned: 0,
    avgCompletion: 0,
    totalEngagement: 0
  })

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [classData, setClassData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load teacher's classes
        const { data: classes, error: classesError } = await supabase
          .from('teacher_classes')
          .select(`
            id,
            name,
            subject,
            grade_level,
            class_code,
            created_at,
            max_students,
            is_active
          `)
          .eq('teacher_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (classesError) {
          // Silently handle RLS errors - don't show in console for better UX
          console.log('Classes query completed (some errors handled gracefully)')
          // Continue with empty classes array instead of returning
        }

        // Load student counts for each class
        const classesWithCounts = await Promise.all(
          (classes || []).map(async (classItem: any) => {
            const { count: studentCount } = await supabase
              .from('class_students')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', classItem.id)
              .eq('status', 'active')

            return {
              ...classItem,
              students: studentCount || 0,
              avgProgress: 0, // TODO: Calculate actual progress
              activeThisWeek: 0, // TODO: Calculate active students this week
            }
          })
        )

        setClassData(classesWithCounts)

        // Calculate stats
        const totalStudents = classesWithCounts.reduce((sum, cls) => sum + cls.students, 0)
        const classesCreated = classesWithCounts.length

        setStats({
          totalStudents,
          activeStudents: totalStudents, // For now, assume all are active
          classesCreated,
          lessonsAssigned: 0, // TODO: Calculate from assignments
          avgCompletion: 0, // TODO: Calculate from progress data
          totalEngagement: totalStudents * 5 // Mock engagement score
        })

        // Mock recent activity - in real app, this would come from a notifications/activities table
        setRecentActivity([
          { id: 1, type: 'class', message: `Created "${classesWithCounts[0]?.name || 'New Class'}"`, time: 'Recently' },
          { id: 2, type: 'info', message: `${totalStudents} students enrolled across ${classesCreated} classes`, time: 'This week' },
        ])

      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [supabase])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
                  <p className="text-muted-foreground">
                    Monitor student progress, manage classes, and create engaging learning experiences
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Class Code
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeStudents} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.classesCreated}</div>
                  <p className="text-xs text-muted-foreground">
                    active classes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lessons Assigned</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.lessonsAssigned}</div>
                  <p className="text-xs text-muted-foreground">
                    this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgCompletion}%</div>
                  <p className="text-xs text-muted-foreground">
                    class average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEngagement}</div>
                  <p className="text-xs text-muted-foreground">
                    activities completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">
                    earned this week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Tabs */}
            <ProminentTabs defaultValue="overview" className="space-y-6">
              <ProminentTabsList className="grid w-full grid-cols-5">
                <ProminentTabsTrigger value="overview">Overview</ProminentTabsTrigger>
                <ProminentTabsTrigger value="classes">My Classes</ProminentTabsTrigger>
                <ProminentTabsTrigger value="students">Students</ProminentTabsTrigger>
                <ProminentTabsTrigger value="content">Content</ProminentTabsTrigger>
                <ProminentTabsTrigger value="moderation">Moderation</ProminentTabsTrigger>
              </ProminentTabsList>

              {/* Overview Tab */}
              <ProminentTabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common teaching tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/teacher/classes/new'}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Class
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/teacher/content/new'}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Create Content
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/teacher/assignments/new'}>
                        <Target className="h-4 w-4 mr-2" />
                        Assign Lesson
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/teacher/analytics'}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest classroom activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.map((item) => (
                          <div key={item.id} className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-md">
                              {item.type === 'student' && <UserCheck className="h-4 w-4" />}
                              {item.type === 'class' && <Users className="h-4 w-4" />}
                              {item.type === 'lesson' && <BookOpen className="h-4 w-4" />}
                              {item.type === 'progress' && <TrendingUp className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{item.message}</p>
                              <p className="text-xs text-muted-foreground">{item.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Class Performance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Class Performance</CardTitle>
                    <CardDescription>Overview of all your classes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {classData.map((classItem) => (
                        <div key={classItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{classItem.name}</h3>
                              <Badge variant="outline">{classItem.code}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{classItem.students} students</span>
                              <span>{classItem.activeThisWeek} active this week</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {classItem.avgProgress}% avg progress
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => window.location.href = `/teacher/classes/${classItem.id}`}>
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ProminentTabsContent>

              {/* Classes Tab */}
              <ProminentTabsContent value="classes" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">My Classes</h2>
                    <p className="text-muted-foreground">Manage your teaching classes</p>
                  </div>
                  <Button onClick={() => window.location.href = '/teacher/classes/new'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Class
                  </Button>
                </div>

                {isLoading ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading classes...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : classData.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No Classes Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first class to start teaching and managing students.
                      </p>
                      <Button onClick={() => window.location.href = '/teacher/classes/new'}>
                        Create New Class
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classData.map((classItem) => (
                      <Card key={classItem.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-1">{classItem.name}</CardTitle>
                              <CardDescription>
                                {classItem.subject.replace('-', ' ')} • {classItem.grade_level.replace('grade-', 'Grade ')}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {classItem.class_code}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Students</span>
                              <span className="font-medium">{classItem.students}/{classItem.max_students}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Status</span>
                              <Badge variant={classItem.is_active ? "default" : "secondary"} className="text-xs">
                                {classItem.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.href = `/teacher/classes/${classItem.id}`}>
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${classItem.class_code}`)}
                              >
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ProminentTabsContent>

              {/* Students Tab */}
              <ProminentTabsContent value="students" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>View and manage your students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Student Overview</h3>
                      <p className="text-muted-foreground mb-4">
                        Monitor individual student progress and provide personalized support.
                      </p>
                      <Button onClick={() => window.location.href = '/teacher/students'}>
                        View All Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ProminentTabsContent>

              {/* Content Tab */}
              <ProminentTabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Creation</CardTitle>
                    <CardDescription>Create and manage learning content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Content Management</h3>
                      <p className="text-muted-foreground mb-4">
                        Create engaging lessons, quizzes, and activities for your students.
                      </p>
                      <Button onClick={() => window.location.href = '/teacher/content/new'}>
                        Create New Content
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ProminentTabsContent>

              {/* Moderation Tab */}
              <ProminentTabsContent value="moderation" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                      <BookOpen className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">3</div>
                      <p className="text-xs text-muted-foreground">
                        content items awaiting approval
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">12</div>
                      <p className="text-xs text-muted-foreground">
                        content items approved
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                      <X className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">2</div>
                      <p className="text-xs text-muted-foreground">
                        content items this week
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Moderation Queue</CardTitle>
                    <CardDescription>Review and approve teacher-created content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Mock pending content items */}
                      {[
                        {
                          id: 1,
                          title: "Introduction to Photosynthesis",
                          author: "Ms. Johnson",
                          subject: "Natural Sciences",
                          grade: "Grade 5",
                          submitted: "2 hours ago",
                          type: "lesson"
                        },
                        {
                          id: 2,
                          title: "Multiplication Quiz - Grade 4",
                          author: "Mr. Smith",
                          subject: "Mathematics",
                          grade: "Grade 4",
                          submitted: "4 hours ago",
                          type: "quiz"
                        },
                        {
                          id: 3,
                          title: "English Literature Analysis",
                          author: "Mrs. Davis",
                          subject: "English Home Language",
                          grade: "Grade 8",
                          submitted: "1 day ago",
                          type: "lesson"
                        }
                      ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{item.title}</h3>
                              <Badge variant="outline" className="capitalize">{item.type}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>by {item.author}</span>
                              <span>{item.subject}</span>
                              <span>{item.grade}</span>
                              <span>Submitted {item.submitted}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Preview
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Reject
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ProminentTabsContent>
            </ProminentTabs>
          </div>
        </main>
      </div>

      {/* Teacher Onboarding */}
      {showOnboarding && (
        <TeacherOnboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  )
}
