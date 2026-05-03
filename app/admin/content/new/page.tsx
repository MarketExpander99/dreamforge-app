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
  Tag
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export default function NewContentPage() {
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

  // Quiz data
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { id: '1', question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }
  ])

  const contentTypes = [
    { value: 'text', label: 'Text Article', icon: FileText, description: 'Rich text content with formatting' },
    { value: 'text-image', label: 'Text with Image', icon: Image, description: 'Text content with accompanying images' },
    { value: 'video', label: 'Video Content', icon: Video, description: 'Video-based learning content' },
    { value: 'audio', label: 'Audio Content', icon: Headphones, description: 'Audio-based learning content' },
    { value: 'quiz', label: 'Interactive Quiz', icon: HelpCircle, description: 'Multiple choice questions with explanations' }
  ]

  const categories = [
    'Science', 'History', 'Geography', 'Mathematics', 'Language Arts',
    'Arts & Culture', 'Health & Wellness', 'Daily Life'
  ]

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

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
      const response = await fetch('/api/admin/content', {
        method: 'POST',
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
      alert('Content saved successfully!')
      // Reset form or redirect
      window.location.href = '/admin/content'
    } catch (error: any) {
      console.error('Error saving content:', error)
      alert(`Error saving content: ${error.message}`)
    }
  }

  const handlePreview = () => {
    // In a real app, this would open a preview modal or page
    alert('Preview functionality would open here')
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
                  <Link href="/admin">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl font-bold mb-2">Create New Content</h1>
              <p className="text-muted-foreground">
                Add new learning content to the platform
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

                {/* Content Type Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content Type</CardTitle>
                    <CardDescription>Choose the type of content you want to create</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contentTypes.map((type) => {
                        const IconComponent = type.icon
                        return (
                          <div
                            key={type.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              contentType === type.value
                                ? 'border-primary bg-primary/5'
                                : 'border-muted hover:border-muted-foreground/50'
                            }`}
                            onClick={() => setContentType(type.value)}
                          >
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-6 w-6" />
                              <div>
                                <h3 className="font-medium">{type.label}</h3>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                    <CardDescription>Create your learning content</CardDescription>
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
                        <div className="space-y-2">
                          <Label htmlFor="imageUrl">Image URL</Label>
                          <Input
                            id="imageUrl"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                          />
                        </div>
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
                        <div className="space-y-2">
                          <Label htmlFor="videoUrl">Video URL</Label>
                          <Input
                            id="videoUrl"
                            placeholder="https://example.com/video.mp4"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                          />
                        </div>
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
                        <div className="space-y-2">
                          <Label htmlFor="audioUrl">Audio URL</Label>
                          <Input
                            id="audioUrl"
                            placeholder="https://example.com/audio.mp3"
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                          />
                        </div>
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
                    <Button onClick={handleSave} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Content
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