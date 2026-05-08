import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BookOpen,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  FileText,
  Image,
  Video,
  Headphones,
  HelpCircle,
  Calendar,
  TrendingUp,
  Users
} from 'lucide-react'
import Link from 'next/link'

export default function ContentManagementPage() {
  // Mock data - in real app, this would come from database
  const contentItems = [
    {
      id: 1,
      title: 'Photosynthesis Explained',
      type: 'text',
      status: 'published',
      views: 245,
      engagement: 92,
      author: 'Dr. Sarah Johnson',
      updated: '2 hours ago',
      subject: 'Biology',
      grade: 'Grade 10'
    },
    {
      id: 2,
      title: 'Ancient Rome Quiz',
      type: 'quiz',
      status: 'draft',
      views: 0,
      engagement: 0,
      author: 'Prof. Michael Chen',
      updated: '1 day ago',
      subject: 'History',
      grade: 'Grade 8'
    },
    {
      id: 3,
      title: 'Water Cycle Video',
      type: 'video',
      status: 'published',
      views: 189,
      engagement: 95,
      author: 'Ms. Emily Davis',
      updated: '3 days ago',
      subject: 'Geography',
      grade: 'Grade 7'
    },
    {
      id: 4,
      title: 'Algebra Fundamentals',
      type: 'text-image',
      status: 'published',
      views: 156,
      engagement: 88,
      author: 'Mr. David Wilson',
      updated: '1 week ago',
      subject: 'Mathematics',
      grade: 'Grade 9'
    },
    {
      id: 5,
      title: 'Climate Change Audio Lesson',
      type: 'audio',
      status: 'published',
      views: 98,
      engagement: 91,
      author: 'Dr. Lisa Thompson',
      updated: '2 weeks ago',
      subject: 'Environmental Science',
      grade: 'Grade 11'
    }
  ]

  const contentTypeIcons = {
    text: FileText,
    'text-image': Image,
    video: Video,
    audio: Headphones,
    quiz: HelpCircle
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
                  <h1 className="text-3xl font-bold mb-2">Content Library</h1>
                  <p className="text-muted-foreground">
                    Manage, edit, and organize all your educational content
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button asChild>
                    <Link href="/admin/content/new">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Create Content
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search content by title, subject, or author..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Content Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="text">Articles</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="quiz">Quizzes</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Content Grid */}
            <div className="grid gap-6">
              {contentItems.map((item) => {
                const IconComponent = contentTypeIcons[item.type as keyof typeof contentTypeIcons] || FileText
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-muted rounded-lg">
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {item.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4" />
                                {item.subject} • {item.grade}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {item.views} views
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {item.engagement}% engagement
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {item.updated}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/content/${item.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/content/${item.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Empty State */}
            {contentItems.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No content found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any content yet. Start by creating your first lesson or resource.
                  </p>
                  <Button asChild>
                    <Link href="/admin/content/new">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Create Your First Content
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-muted-foreground">
                Showing {contentItems.length} of {contentItems.length} results
              </p>
              <div className="flex gap-2">
                <Button variant="outline" disabled>
                  Previous
                </Button>
                <Button variant="outline" disabled>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}