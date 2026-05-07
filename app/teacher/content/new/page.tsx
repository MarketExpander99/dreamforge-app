import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Save,
  Eye,
  ArrowLeft,
  Plus,
  X,
  Image,
  Video,
  FileText,
  HelpCircle,
  Upload
} from 'lucide-react'
import Link from 'next/link'

export default function TeacherContentCreation() {
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
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teacher">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Create New Content</h1>
                <p className="text-muted-foreground">
                  Create engaging learning materials for your students
                </p>
              </div>
            </div>

            <form className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Essential details about your content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Introduction to Fractions"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="science">Science</SelectItem>
                          <SelectItem value="language-arts">Language Arts</SelectItem>
                          <SelectItem value="social-studies">Social Studies</SelectItem>
                          <SelectItem value="health">Health & Wellness</SelectItem>
                          <SelectItem value="arts">Arts & Culture</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade Level *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grade-1">Grade 1</SelectItem>
                          <SelectItem value="grade-2">Grade 2</SelectItem>
                          <SelectItem value="grade-3">Grade 3</SelectItem>
                          <SelectItem value="grade-4">Grade 4</SelectItem>
                          <SelectItem value="grade-5">Grade 5</SelectItem>
                          <SelectItem value="grade-6">Grade 6</SelectItem>
                          <SelectItem value="grade-7">Grade 7</SelectItem>
                          <SelectItem value="grade-8">Grade 8</SelectItem>
                          <SelectItem value="grade-9">Grade 9</SelectItem>
                          <SelectItem value="grade-10">Grade 10</SelectItem>
                          <SelectItem value="grade-11">Grade 11</SelectItem>
                          <SelectItem value="grade-12">Grade 12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty *</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="read-time">Read Time (minutes)</Label>
                      <Input
                        id="read-time"
                        type="number"
                        placeholder="5"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the content..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="e.g., fractions, mathematics, grade-4 (comma separated)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas. These help students find your content.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Content Type & Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Type & Media</CardTitle>
                  <CardDescription>Choose the type of content and add media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Content Type *</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="text" name="content-type" value="text" defaultChecked />
                        <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer">
                          <FileText className="h-4 w-4" />
                          Text Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="text-image" name="content-type" value="text-image" />
                        <Label htmlFor="text-image" className="flex items-center gap-2 cursor-pointer">
                          <Image className="h-4 w-4" />
                          Text with Image
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="video" name="content-type" value="video" />
                        <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                          <Video className="h-4 w-4" />
                          Video Content
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="quiz" name="content-type" value="quiz" />
                        <Label htmlFor="quiz" className="flex items-center gap-2 cursor-pointer">
                          <HelpCircle className="h-4 w-4" />
                          Quiz/Assessment
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Media Upload Section */}
                  <div className="space-y-4">
                    <Label>Media Upload</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your files here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports images (JPG, PNG), videos (MP4), and audio files (MP3)
                      </p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Choose Files
                      </Button>
                    </div>
                  </div>

                  {/* URL Inputs */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="image-url">Image URL</Label>
                      <Input
                        id="image-url"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="video-url">Video URL</Label>
                      <Input
                        id="video-url"
                        placeholder="https://example.com/video.mp4"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Creation */}
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>Write your learning content</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="write" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="write">Write</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="write" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                          id="content"
                          placeholder="Write your learning content here..."
                          rows={15}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Use simple language appropriate for your students' grade level.
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="preview" className="space-y-4">
                      <div className="min-h-[300px] p-4 border rounded-lg bg-muted/50">
                        <p className="text-muted-foreground text-center">
                          Content preview will appear here as you type.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Quiz Section (Conditional) */}
              <Card id="quiz-section" className="hidden">
                <CardHeader>
                  <CardTitle>Quiz Questions</CardTitle>
                  <CardDescription>Add assessment questions to test understanding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Questions</h4>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>

                    {/* Sample Question */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Question 1</span>
                        <Button variant="ghost" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <Textarea
                        placeholder="Enter your question..."
                        rows={2}
                      />

                      <div className="space-y-2">
                        <Label className="text-sm">Answer Options</Label>
                        <div className="space-y-2">
                          {['A', 'B', 'C', 'D'].map((option) => (
                            <div key={option} className="flex items-center gap-2">
                              <input type="radio" name="correct-answer" value={option} />
                              <Input placeholder={`Option ${option}`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="explanation" className="text-sm">Explanation</Label>
                        <Textarea
                          id="explanation"
                          placeholder="Explain why this is the correct answer..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Content
                </Button>
                <Button type="button" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/teacher">
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}