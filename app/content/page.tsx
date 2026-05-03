import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Plus,
  FileText,
  Image,
  Video,
  Headphones,
  HelpCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

export default function ContentCreatorHub() {
  // Mock data - in real app, this would come from database
  const creatorStats = {
    totalContent: 24,
    publishedContent: 18,
    draftContent: 6,
    totalViews: 15420,
    avgEngagement: 87,
    recentSubmissions: 3
  }

  const recentContent = [
    { id: 1, title: 'Photosynthesis Explained', type: 'text', status: 'published', views: 245, engagement: 92, updated: '2 hours ago' },
    { id: 2, title: 'Ancient Rome Quiz', type: 'quiz', status: 'draft', views: 0, engagement: 0, updated: '1 day ago' },
    { id: 3, title: 'Water Cycle Video', type: 'video', status: 'published', views: 189, engagement: 95, updated: '3 days ago' },
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
                  <h1 className="text-3xl font-bold mb-2">Content Creator Hub</h1>
                  <p className="text-muted-foreground">
                    Create, manage, and track your learning content performance
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button asChild>
                    <Link href="/admin/content/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Content
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Creator Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Content</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorStats.totalContent}</div>
                  <p className="text-xs text-muted-foreground">
                    {creatorStats.publishedContent} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorStats.draftContent}</div>
                  <p className="text-xs text-muted-foreground">
                    in progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorStats.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    all time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorStats.avgEngagement}%</div>
                  <p className="text-xs text-muted-foreground">
                    average rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorStats.publishedContent}</div>
                  <p className="text-xs text-muted-foreground">
                    live content
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent</CardTitle>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{creatorStats.recentSubmissions}</div>
                  <p className="text-xs text-muted-foreground">
                    this week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Creator Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="create">Create</TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
                <TabsTrigger value="analytics">Performance</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Quick Create Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Create</CardTitle>
                      <CardDescription>Start creating new learning content</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       <Button className="w-full justify-start" variant="outline" asChild>
                         <Link href="/admin/content/new?type=text">
                           <FileText className="h-4 w-4 mr-2" />
                           New Article
                         </Link>
                       </Button>
                       <Button className="w-full justify-start" variant="outline" asChild>
                         <Link href="/admin/content/new?type=quiz">
                           <HelpCircle className="h-4 w-4 mr-2" />
                           Create Quiz
                         </Link>
                       </Button>
                       <Button className="w-full justify-start" variant="outline" asChild>
                         <Link href="/admin/content/new?type=video">
                           <Video className="h-4 w-4 mr-2" />
                           Video Content
                         </Link>
                       </Button>
                       <Button className="w-full justify-start" variant="outline" asChild>
                         <Link href="/admin/content/new?type=audio">
                           <Headphones className="h-4 w-4 mr-2" />
                           Audio Lesson
                         </Link>
                       </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>My Recent Content</CardTitle>
                      <CardDescription>Your latest creations and updates</CardDescription>
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
                                  <span>{item.views} views</span>
                                  <span>•</span>
                                  <span>{item.updated}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                                  {item.status}
                                </Badge>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/admin/content/${item.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
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
                    <CardTitle>My Content Mix</CardTitle>
                    <CardDescription>Breakdown of your content by type</CardDescription>
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

              {/* Create Tab */}
              <TabsContent value="create" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Content</CardTitle>
                    <CardDescription>Choose a content type to start creating</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        {
                          type: 'text',
                          title: 'Article',
                          description: 'Rich text content with formatting',
                          icon: FileText,
                          href: '/admin/content/new?type=text'
                        },
                        {
                          type: 'text-image',
                          title: 'Text with Images',
                          description: 'Articles with accompanying visuals',
                          icon: Image,
                          href: '/admin/content/new?type=text-image'
                        },
                        {
                          type: 'video',
                          title: 'Video Content',
                          description: 'Video-based learning materials',
                          icon: Video,
                          href: '/admin/content/new?type=video'
                        },
                        {
                          type: 'audio',
                          title: 'Audio Content',
                          description: 'Podcasts and audio lessons',
                          icon: Headphones,
                          href: '/admin/content/new?type=audio'
                        },
                        {
                          type: 'quiz',
                          title: 'Interactive Quiz',
                          description: 'Multiple choice questions with explanations',
                          icon: HelpCircle,
                          href: '/admin/content/new?type=quiz'
                        }
                      ].map((contentType) => {
                        const IconComponent = contentType.icon
                        return (
                          <Card key={contentType.type} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <Link href={contentType.href} className="block">
                                <div className="text-center">
                                  <div className="p-4 bg-primary/10 rounded-lg mx-auto w-fit mb-4">
                                    <IconComponent className="h-8 w-8 text-primary" />
                                  </div>
                                  <h3 className="font-semibold mb-2">{contentType.title}</h3>
                                  <p className="text-sm text-muted-foreground mb-4">{contentType.description}</p>
                                  <Button className="w-full">Create {contentType.title}</Button>
                                </div>
                              </Link>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manage Tab */}
              <TabsContent value="manage" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Management</CardTitle>
                    <CardDescription>View and manage all your content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Content Library</h3>
                      <p className="text-muted-foreground mb-4">
                        Access your complete content library with advanced filtering and management tools.
                      </p>
                      <Button asChild>
                        <Link href="/content/manage">
                          Open Content Library
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
                    <CardTitle>Content Performance</CardTitle>
                    <CardDescription>Track how your content is performing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Performance Analytics</h3>
                      <p className="text-muted-foreground mb-4">
                        View detailed analytics about your content engagement, reach, and impact.
                      </p>
                      <Button asChild>
                        <Link href="/content/analytics">
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