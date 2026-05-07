'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/user-context'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, X, BookOpen, Users, Calendar, FileText } from 'lucide-react'
import { ContentItem } from '@/lib/data'

interface Class {
  id: string
  title: string
  subject: string
  grade_level: string
  student_count?: number
}

export default function NewAssignmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [content, setContent] = useState<ContentItem[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentItem[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    instructions: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const supabase = createBrowserSupabaseClient()

        // Fetch teacher's classes
        const { data: classesData } = await supabase
          .from('teacher_classes')
          .select('*')
          .eq('teacher_id', user.id)

        setClasses(classesData || [])

        // Fetch teacher's content
        const { data: contentData } = await supabase
          .from('content_items')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('teacher_id', user.id)
          .eq('is_published', true)
          .limit(50)

        setContent(contentData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [user])

  const handleContentSelect = (contentItem: ContentItem) => {
    if (selectedContent.find(item => item.id === contentItem.id)) {
      setSelectedContent(selectedContent.filter(item => item.id !== contentItem.id))
    } else {
      setSelectedContent([...selectedContent, contentItem])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.classId || selectedContent.length === 0) return

    setLoading(true)
    try {
      // TODO: Implement assignment creation API
      // For now, just show success and redirect
      console.log('Creating assignment:', {
        ...formData,
        teacherId: user.id,
        contentIds: selectedContent.map(c => c.id)
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      router.push('/teacher/assignments')
    } catch (error) {
      console.error('Error creating assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please log in to create assignments
            </h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Assignment
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Assign learning content to your students
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Introduction to Algebra"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Select Class *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          <div className="flex items-center gap-2">
                            <span>{cls.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {cls.subject} • Grade {cls.grade_level}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the assignment..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions for Students</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Specific instructions for completing this assignment..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Select Content to Assign *
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedContent.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Selected Content ({selectedContent.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.map((item) => (
                      <Badge key={item.id} variant="default" className="flex items-center gap-1">
                        {item.title}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleContentSelect(item)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {content.map((item) => {
                  const isSelected = selectedContent.find(selected => selected.id === item.id)
                  return (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleContentSelect(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {item.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {item.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{item.read_time} min read</span>
                            <span>{item.likes} likes</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {isSelected ? (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {content.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    No Content Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You need to create some content before you can assign it.
                  </p>
                  <Button onClick={() => router.push('/teacher/content/new')}>
                    Create Content
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.classId || selectedContent.length === 0}
            >
              {loading ? 'Creating Assignment...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}