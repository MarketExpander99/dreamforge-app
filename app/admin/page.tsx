import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  FileText,
  Image,
  Video,
  Headphones,
  HelpCircle,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  // Mock data - in real app, this would come from database
  const stats = {
    totalContent: 24,
    publishedContent: 18,
    draftContent: 6,
    totalUsers: 156,
    activeUsers: 89,
    categories: 8
  }

  const recentContent = [
    { id: 1, title: 'Photosynthesis Explained', type: 'text', status: 'published', author: 'Admin', updated: '2 hours ago' },
    { id: 2, title: 'Ancient Rome Quiz', type: 'quiz', status: 'draft', author: 'Admin', updated: '1 day ago' },
    { id: 3, title: 'Water Cycle Video', type: 'video', status: 'published', author: 'Admin', updated: '3 days ago' },
  ]

  const contentTypeIcons = {
    text: FileText,
    'text-image': Image,
    video: Video,
    audio: Headphones,
    quiz: HelpCircle
  }

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
                  <h1 className="text-3xl font-bold mb-2">Content Management</h1>
                  <p className="text-muted-foreground">
                    Manage learning content, categories, and platform settings
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button asChild>
                    <Link href="/admin/content/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Content
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalContent}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.publishedContent} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft Content</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.draftContent}</div>
                  <p className="text-xs text-muted-foreground">
                    awaiting review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    of {stats.totalUsers} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.categories}</div>
                  <p className="text-xs text-muted-foreground">
                    subjects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94%</div>
                  <p className="text-xs text-muted-foreground">
                    completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Healthy</div>
                  <p className="text-xs text-muted-foreground">
                    all systems
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/admin/content/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Content
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/admin/categories">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Manage Categories
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/admin/content">
                          <BookOpen className="h-4 w-4 mr-2" />
                          View All Content
                        </Link>
                      </Button>
                      <Button className="w-full justify-start" variant="outline" asChild>
                        <Link href="/admin/users">
                          <Users className="h-4 w-4 mr-2" />
                          User Management
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Content</CardTitle>
                      <CardDescription>Latest content updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentContent.map((item) => {
                          const IconComponent = contentTypeIcons[item.type as keyof typeof contentTypeIcons] || FileText
                          return (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-md">
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{item.author}</span>
                                  <span>•</span>
                                  <span>{item.updated}</span>
                                </div>
                              </div>
                              <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Content Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Distribution</CardTitle>
                    <CardDescription>Breakdown by content type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(contentTypeIcons).map(([type, Icon]) => (
                        <div key={type} className="text-center">
                          <div className="p-3 bg-muted rounded-lg mx-auto w-fit mb-2">
                            <Icon className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-medium capitalize">{type.replace('-', ' ')}</p>
                          <p className="text-xs text-muted-foreground">
                            {type === 'text' ? '12' : type === 'quiz' ? '4' : type === 'video' ? '3' : type === 'text-image' ? '3' : '2'} items
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Management</CardTitle>
                    <CardDescription>Manage all learning content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Content Management Interface</h3>
                      <p className="text-muted-foreground mb-4">
                        View, edit, and organize all learning content from this centralized interface.
                      </p>
                      <Button asChild>
                        <Link href="/admin/content">
                          Go to Content Manager
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">User Administration</h3>
                      <p className="text-muted-foreground mb-4">
                        View user accounts, manage roles, and monitor platform activity.
                      </p>
                      <Button asChild>
                        <Link href="/admin/users">
                          Go to User Manager
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Analytics</CardTitle>
                    <CardDescription>Track engagement and performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
                      <p className="text-muted-foreground mb-4">
                        Monitor user engagement, content performance, and platform growth.
                      </p>
                      <Button asChild>
                        <Link href="/admin/analytics">
                          View Analytics
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}