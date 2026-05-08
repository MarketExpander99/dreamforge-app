"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import {
  Users,
  Save,
  ArrowLeft,
  Copy,
  Share2,
  QrCode,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

export default function TeacherClassCreation() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    gradeLevel: '',
    description: '',
    maxStudents: 30,
    learningGoals: '',
    settings: {
      allowSelfEnrollment: true,
      sendProgressReports: true,
      enableGamification: true,
      requireParentApproval: false
    }
  })

  // Generate unique class code
  const generateClassCode = () => {
    const subjectCode = formData.subject ? formData.subject.substring(0, 3).toUpperCase() : 'CLS'
    const gradeCode = formData.gradeLevel ? formData.gradeLevel.replace('grade-', '') : 'X'
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${subjectCode}${gradeCode}-${randomPart}`
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Regenerate class code when subject or grade changes
    if (field === 'subject' || field === 'gradeLevel') {
      setClassCode(generateClassCode())
    }
  }

  const handleSettingChange = (setting: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.subject || !formData.gradeLevel) {
        throw new Error('Please fill in all required fields')
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('You must be logged in to create a class')
      }

      // Generate final class code
      const finalClassCode = classCode || generateClassCode()

      // Prepare learning goals array
      const learningGoals = formData.learningGoals
        .split('\n')
        .map(goal => goal.trim())
        .filter(goal => goal.length > 0)

      // Create class
      const { data, error: createError } = await supabase
        .from('teacher_classes')
        .insert({
          teacher_id: user.id,
          name: formData.name,
          subject: formData.subject,
          grade_level: formData.gradeLevel,
          class_code: finalClassCode,
          description: formData.description || null,
          max_students: formData.maxStudents,
          settings: formData.settings,
          learning_goals: learningGoals.length > 0 ? learningGoals : null
        })
        .select()
        .single()

      if (createError) {
        throw new Error(createError.message)
      }

      setSuccess(true)
      setClassCode(finalClassCode)

      // Redirect to teacher dashboard after a short delay
      setTimeout(() => {
        router.push('/teacher')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to create class')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const getShareUrl = () => {
    return `${window.location.origin}/join/${classCode}`
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
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/teacher'}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Create New Class</h1>
                <p className="text-muted-foreground">
                  Set up a class and generate an invite code for students to join
                </p>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800">
                  Class created successfully! Class code: <code className="bg-green-100 px-2 py-1 rounded font-mono">{classCode}</code>
                </p>
              </div>
            )}

            <form className="space-y-6">
              {/* Class Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Information</CardTitle>
                  <CardDescription>Basic details about your class</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="class-name">Class Name *</Label>
                      <Input
                        id="class-name"
                        placeholder="e.g., Grade 4 Mathematics"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="natural-sciences">Natural Sciences</SelectItem>
                          <SelectItem value="english-home-language">English Home Language</SelectItem>
                          <SelectItem value="english-first-additional">English First Additional</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="economic-management">Economic & Management Sciences</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="grade-level">Grade Level *</Label>
                      <Select value={formData.gradeLevel} onValueChange={(value) => handleInputChange('gradeLevel', value)}>
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
                      <Label htmlFor="max-students">Maximum Students</Label>
                      <Input
                        id="max-students"
                        type="number"
                        placeholder="30"
                        min="1"
                        max="100"
                        value={formData.maxStudents}
                        onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 30)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Class Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what students will learn in this class..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="learning-goals">Learning Goals</Label>
                    <Textarea
                      id="learning-goals"
                      placeholder="What should students achieve by the end of this class? (one per line)"
                      rows={4}
                      value={formData.learningGoals}
                      onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter each learning goal on a new line.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Class Code Generation */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Invite Code</CardTitle>
                  <CardDescription>Generated code for students to join your class</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-1 block">Class Code</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono bg-background px-3 py-1 rounded border">
                          {classCode}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(classCode)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Share Options</Label>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => copyToClipboard(getShareUrl())}
                          disabled={!classCode}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Copy Share Link
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            // For now, just copy the URL - QR code generation would require additional library
                            copyToClipboard(getShareUrl())
                          }}
                          disabled={!classCode}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Copy Join URL
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Instructions for Students</Label>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Students can join using:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>The class code: <code className="bg-muted px-1 rounded text-xs">{classCode}</code></li>
                          <li>QR code scanning</li>
                          <li>Direct invite link</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Class Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Settings</CardTitle>
                  <CardDescription>Configure how your class operates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Self-Enrollment</Label>
                        <p className="text-sm text-muted-foreground">
                          Students can join using the class code without approval
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.settings.allowSelfEnrollment}
                        onChange={(e) => handleSettingChange('allowSelfEnrollment', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Send Progress Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically send weekly progress reports to parents
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.settings.sendProgressReports}
                        onChange={(e) => handleSettingChange('sendProgressReports', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Gamification</Label>
                        <p className="text-sm text-muted-foreground">
                          Award points and badges for completed activities
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.settings.enableGamification}
                        onChange={(e) => handleSettingChange('enableGamification', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Parent Approval</Label>
                        <p className="text-sm text-muted-foreground">
                          Parents must approve before students can join
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.settings.requireParentApproval}
                        onChange={(e) => handleSettingChange('requireParentApproval', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Class...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Class
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => window.location.href = '/teacher'} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}