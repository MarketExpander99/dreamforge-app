import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  FileText,
  Image,
  Video,
  Headphones,
  HelpCircle,
  Upload,
  Save,
  Eye,
  ArrowLeft,
  Plus,
  X,
  Settings,
  Tag,
  Clock,
  Users
} from 'lucide-react'
import Link from 'next/link'

export default function CreateContentPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/teacher/content">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Content
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Create New Content</h1>
                  <p className="text-muted-foreground">
                    Create engaging lessons, quizzes, and activities for your students
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Provide the essential details for your content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter a compelling title for your content"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what students will learn from this content"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mathematics">Mathematics</SelectItem>
                            <SelectItem value="science">Science</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="history">History</SelectItem>
                            <SelectItem value="geography">Geography</SelectItem>
                            <SelectItem value="computer-science">Computer Science</SelectItem>
                            <SelectItem value="art">Art</SelectItem>
                            <SelectItem value="music">Music</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="grade">Grade Level *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grade-7">Grade 7</SelectItem>
                            <SelectItem value="grade-8">Grade 8</SelectItem>
                            <SelectItem value="grade-9">Grade 9</SelectItem>
                            <SelectItem value="grade-10">Grade 10</SelectItem>
                            <SelectItem value="grade-11">Grade 11</SelectItem>
                            <SelectItem value="grade-12">Grade 12</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Photosynthesis
                          <X className="h-3 w-3 cursor-pointer" />
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Biology
                          <X className="h-3 w-3 cursor-pointer" />
                        </Badge>
                      </div>
                      <Input
                        id="tags"
                        placeholder="Add tags (press Enter to add)"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Content Type Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Type</CardTitle>
                    <CardDescription>
                      Choose the type of content you want to create
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="article" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="article" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Article
                        </TabsTrigger>
                        <TabsTrigger value="video" className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video
                        </TabsTrigger>
                        <TabsTrigger value="audio" className="flex items-center gap-2">
                          <Headphones className="h-4 w-4" />
                          Audio
                        </TabsTrigger>
                        <TabsTrigger value="quiz" className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Quiz
                        </TabsTrigger>
                        <TabsTrigger value="mixed" className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Mixed
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="article" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="article-content">Content</Label>
                          <Textarea
                            id="article-content"
                            placeholder="Write your article content here..."
                            rows={10}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Media Upload</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Drag and drop images or click to upload
                            </p>
                            <Button variant="outline" size="sm">
                              Choose Files
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="video" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="video-url">Video URL</Label>
                          <Input
                            id="video-url"
                            placeholder="Enter YouTube, Vimeo, or direct video URL"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="video-description">Video Description</Label>
                          <Textarea
                            id="video-description"
                            placeholder="Provide context and key points from the video"
                            rows={4}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="audio" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Audio Upload</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                            <Headphones className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Upload audio file (MP3, WAV, etc.)
                            </p>
                            <Button variant="outline" size="sm">
                              Choose Audio File
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="audio-transcript">Transcript</Label>
                          <Textarea
                            id="audio-transcript"
                            placeholder="Provide a transcript of the audio content"
                            rows={6}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="quiz" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Questions</h4>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Question
                            </Button>
                          </div>

                          {/* Sample Question */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <Input placeholder="Question text" />
                                <div className="space-y-2">
                                  <Label className="text-sm">Answer Options</Label>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <input type="radio" name="q1" className="text-primary" />
                                      <Input placeholder="Option A" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input type="radio" name="q1" />
                                      <Input placeholder="Option B" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input type="radio" name="q1" />
                                      <Input placeholder="Option C" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <input type="radio" name="q1" />
                                      <Input placeholder="Option D" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="mixed" className="space-y-4 mt-4">
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold mb-2">Mixed Media Content</h3>
                          <p className="text-muted-foreground mb-4">
                            Combine text, images, videos, and interactive elements
                          </p>
                          <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure Content Blocks
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <Select defaultValue="private">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="class-only">Class Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Duration</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Word Count</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reading Time</span>
                      <span className="font-medium">0 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Media Files</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Questions</span>
                      <span className="font-medium">0</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Assignment Integration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment</CardTitle>
                    <CardDescription>
                      Link this content to an assignment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No assignment</SelectItem>
                          <SelectItem value="homework-1">Homework #1</SelectItem>
                          <SelectItem value="quiz-1">Quiz #1</SelectItem>
                          <SelectItem value="project-1">Project #1</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Assignment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}