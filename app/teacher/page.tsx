import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  // Mock data - in real app, this would come from database
  const stats = {
    totalStudents: 24,
    activeStudents: 18,
    classesCreated: 3,
    lessonsAssigned: 12,
    avgCompletion: 78,
    totalEngagement: 156
  }

  const recentActivity = [
    { id: 1, type: 'student', message: 'Sarah completed "Multiplication Basics"', time: '2 hours ago' },
    { id: 2, type: 'class', message: 'New student joined "Grade 4 Math Class"', time: '4 hours ago' },
    { id: 3, type: 'lesson', message: 'Lesson "Fractions Introduction" assigned to 8 students', time: '1 day ago' },
    { id: 4, type: 'progress', message: 'Class average improved by 12% this week', time: '2 days ago' },
  ]

  const classData = [
    {
      id: 'grade4-math',
      name: 'Grade 4 Mathematics',
      students: 12,
      avgProgress: 82,
      activeThisWeek: 10,
      code: 'MATH4-2024'
    },
    {
      id: 'grade5-science',
      name: 'Grade 5 Natural Sciences',
      students: 8,
      avgProgress: 75,
      activeThisWeek: 6,
      code: 'SCI5-2024'
    },
    {
      id: 'grade3-english',
      name: 'Grade 3 English',
      students: 4,
      avgProgress: 68,
      activeThisWeek: 3,
      code: 'ENG3-2024'
    }
  ]

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
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="classes">My Classes</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common teaching tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/teacher/classes/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Class
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/teacher/content/new">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Create Content
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/teacher/assignments/new">
                          <Target className="h-4 w-4 mr-2" />
                          Assign Lesson
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/teacher/analytics">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
                        </Link>
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
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/teacher/classes/${classItem.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Classes Tab */}
              <TabsContent value="classes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>My Classes</CardTitle>
                    <CardDescription>Manage your teaching classes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Class Management</h3>
                      <p className="text-muted-foreground mb-4">
                        Create and manage classes, assign students, and track progress.
                      </p>
                      <Button asChild>
                        <Link href="/teacher/classes/new">
                          Create New Class
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-6">
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
                      <Button asChild>
                        <Link href="/teacher/students">
                          View All Students
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
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
                      <Button asChild>
                        <Link href="/teacher/content/new">
                          Create New Content
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Moderation Tab */}
              <TabsContent value="moderation" className="space-y-6">
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
              </TabsContent>
            </Tabs>
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
