"use client"

import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  FileText,
  Image,
  Video,
  Headphones,
  HelpCircle,
  Plus,
  X,
  Tag,
  CloudUpload,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export default function EditContentPage() {
  const params = useParams()
  const contentId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [contentType, setContentType] = useState<string>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [readTime, setReadTime] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  // Media URLs
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')

  // File upload states
  const [uploading, setUploading] = useState(false)

  // Quiz data
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { id: '1', question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }
  ])

  const categories = [
    'Science', 'History', 'Geography', 'Mathematics', 'Language Arts',
    'Arts & Culture', 'Health & Wellness', 'Daily Life'
  ]

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

  // Load content data
  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`/api/admin/content/${contentId}`)
        if (!response.ok) {
          throw new Error('Failed to load content')
        }
        const data = await response.json()

        // Populate form with existing data
        setTitle(data.title || '')
        setContent(data.content || '')
        setContentType(data.type || 'text')
        setCategory(data.categories?.name || '')
        setDifficulty(data.difficulty || '')
        setTags(data.tags || [])
        setReadTime(data.read_time?.toString() || '')
        setIsFeatured(data.is_featured || false)
        setIsPublished(data.is_published || false)
        setImageUrl(data.image_url || '')
        setVideoUrl(data.video_url || '')
        setAudioUrl(data.audio_url || '')

        if (data.quiz && Array.isArray(data.quiz)) {
          setQuizQuestions(data.quiz)
        }
      } catch (error) {
        console.error('Error loading content:', error)
        alert('Failed to load content for editing')
      } finally {
        setLoading(false)
      }
    }

    if (contentId) {
      loadContent()
    }
  }, [contentId])

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const addQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }
    setQuizQuestions([...quizQuestions, newQuestion])
  }

  const updateQuizQuestion = (id: string, field: keyof QuizQuestion, value: any) => {
    setQuizQuestions(questions =>
      questions.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    )
  }

  const removeQuizQuestion = (id: string) => {
    if (quizQuestions.length > 1) {
      setQuizQuestions(questions => questions.filter(q => q.id !== id))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          type: contentType,
          category,
          difficulty,
          tags,
          readTime: readTime ? parseInt(readTime) : 5,
          isFeatured,
          isPublished,
          imageUrl,
          videoUrl,
          audioUrl,
          quiz: contentType === 'quiz' ? quizQuestions : null
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save content')
      }

      const result = await response.json()
      alert('Content updated successfully!')
    } catch (error: any) {
      console.error('Error saving content:', error)
      alert(`Error saving content: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'audio') => {
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()

      // Update the appropriate URL based on file type
      if (type === 'image') {
        setImageUrl(result.url)
      } else if (type === 'video') {
        setVideoUrl(result.url)
      } else if (type === 'audio') {
        setAudioUrl(result.url)
      }

      alert('File uploaded successfully!')
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file, type)
    }
  }

  const handlePreview = () => {
    alert('Preview functionality would open here')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="md:pl-64">
          <main className="py-6 px-4 md:px-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading content...</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

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
                  <Link href="/admin/content">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Content
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold mb-2">Edit Content</h1>
              <p className="text-muted-foreground">
                Update your learning content
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Essential details about your content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter content title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat.toLowerCase().replace(' & ', '-').replace(' ', '-')}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty *</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            {difficulties.map((diff) => (
                              <SelectItem key={diff.value} value={diff.value}>
                                {diff.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="readTime">Read Time (minutes)</Label>
                      <Input
                        id="readTime"
                        type="number"
                        placeholder="5"
                        value={readTime}
                        onChange={(e) => setReadTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                    <CardDescription>Edit your learning content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={contentType} className="w-full">
                      <TabsContent value="text" className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="content">Content *</Label>
                          <Textarea
                            id="content"
                            placeholder="Write your content here..."
                            rows={10}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="text-image" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Image</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                              <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <div className="space-y-2">
                                <Label htmlFor="imageFile" className="text-sm font-medium">
                                  Upload New Image
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG, GIF, WebP up to 10MB
                                </p>
                                <Input
                                  id="imageFile"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileSelect(e, 'image')}
                                  disabled={uploading}
                                  className="max-w-xs mx-auto"
                                />
                                {uploading && (
                                  <div className="flex items-center justify-center gap-2 mt-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Uploading...</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="imageUrl">Image URL</Label>
                              <Input
                                id="imageUrl"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-2">
                          <Label htmlFor="content">Content *</Label>
                          <Textarea
                            id="content"
                            placeholder="Write your content here..."
                            rows={8}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="video" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Video</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                              <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <div className="space-y-2">
                                <Label htmlFor="videoFile" className="text-sm font-medium">
                                  Upload New Video
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  MP4, WebM, OGG up to 10MB
                                </p>
                                <Input
                                  id="videoFile"
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleFileSelect(e, 'video')}
                                  disabled={uploading}
                                  className="max-w-xs mx-auto"
                                />
                                {uploading && (
                                  <div className="flex items-center justify-center gap-2 mt-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Uploading...</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="videoUrl">Video URL</Label>
                              <Input
                                id="videoUrl"
                                placeholder="https://example.com/video.mp4"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-2">
                          <Label htmlFor="content">Description</Label>
                          <Textarea
                            id="content"
                            placeholder="Describe the video content..."
                            rows={4}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="audio" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Audio</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                              <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <div className="space-y-2">
                                <Label htmlFor="audioFile" className="text-sm font-medium">
                                  Upload New Audio
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  MP3, WAV, OGG, M4A up to 10MB
                                </p>
                                <Input
                                  id="audioFile"
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleFileSelect(e, 'audio')}
                                  disabled={uploading}
                                  className="max-w-xs mx-auto"
                                />
                                {uploading && (
                                  <div className="flex items-center justify-center gap-2 mt-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Uploading...</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="audioUrl">Audio URL</Label>
                              <Input
                                id="audioUrl"
                                placeholder="https://example.com/audio.mp3"
                                value={audioUrl}
                                onChange={(e) => setAudioUrl(e.target.value)}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-2">
                          <Label htmlFor="content">Transcript/Description</Label>
                          <Textarea
                            id="content"
                            placeholder="Provide transcript or description..."
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="quiz" className="space-y-6">
                        <div className="space-y-4">
                          {quizQuestions.map((question, index) => (
                            <Card key={question.id}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                                  {quizQuestions.length > 1 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeQuizQuestion(question.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Question</Label>
                                  <Input
                                    placeholder="Enter your question"
                                    value={question.question}
                                    onChange={(e) => updateQuizQuestion(question.id, 'question', e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Options</Label>
                                  {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct-${question.id}`}
                                        checked={question.correctAnswer === optionIndex}
                                        onChange={() => updateQuizQuestion(question.id, 'correctAnswer', optionIndex)}
                                      />
                                      <Input
                                        placeholder={`Option ${optionIndex + 1}`}
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [...question.options]
                                          newOptions[optionIndex] = e.target.value
                                          updateQuizQuestion(question.id, 'options', newOptions)
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="space-y-2">
                                  <Label>Explanation</Label>
                                  <Textarea
                                    placeholder="Explain why this answer is correct"
                                    rows={2}
                                    value={question.explanation}
                                    onChange={(e) => updateQuizQuestion(question.id, 'explanation', e.target.value)}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          <Button onClick={addQuizQuestion} variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publishing Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Publishing</CardTitle>
                    <CardDescription>Control content visibility and status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Featured Content</Label>
                        <p className="text-sm text-muted-foreground">Highlight on explore page</p>
                      </div>
                      <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Publish Now</Label>
                        <p className="text-sm text-muted-foreground">Make content live</p>
                      </div>
                      <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={handlePreview} variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button onClick={handleSave} className="w-full" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Content
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Content Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Word Count</span>
                      <span>{content.split(' ').filter(word => word.length > 0).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Questions</span>
                      <span>{contentType === 'quiz' ? quizQuestions.length : 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tags</span>
                      <span>{tags.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status</span>
                      <Badge variant={isPublished ? 'default' : 'secondary'}>
                        {isPublished ? 'Published' : 'Draft'}
                      </Badge>
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