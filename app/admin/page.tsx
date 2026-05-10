"use client"

import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProminentTabs, ProminentTabsContent, ProminentTabsList, ProminentTabsTrigger } from '@/components/ui/prominent-tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Shield,
  Sparkles,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function AdminDashboard() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<{
    success: boolean
    message: string
    count?: number
  } | null>(null)
  const [formData, setFormData] = useState({
    gradeLevel: '',
    subject: '',
    count: '5'
  })

  // Mock data - in real app, this would come from database
  const stats = {
    totalUsers: 156,
    activeUsers: 89,
    totalContent: 24,
    publishedContent: 18,
    draftContent: 6,
    categories: 8,
    systemHealth: 'Healthy',
    serverLoad: 34
  }

  const recentActivity = [
    { id: 1, type: 'user', message: 'New user registered: john.doe@example.com', time: '2 hours ago' },
    { id: 2, type: 'content', message: 'Content published: "Photosynthesis Explained"', time: '4 hours ago' },
    { id: 3, type: 'system', message: 'Database backup completed successfully', time: '1 day ago' },
    { id: 4, type: 'user', message: 'User role updated: mary.smith@example.com → Content Creator', time: '2 days ago' },
  ]

  const contentTypeIcons = {
    text: FileText,
    'text-image': Image,
    video: Video,
    audio: Headphones,
    quiz: HelpCircle
  }

  const handleGenerateContent = async () => {
    if (!formData.gradeLevel || !formData.subject) {
      setGenerationResult({
        success: false,
        message: 'Please fill in all required fields'
      })
      return
    }

    setIsGenerating(true)
    setGenerationResult(null)

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gradeLevel: formData.gradeLevel,
          subject: formData.subject,
          count: parseInt(formData.count)
        })
      })

      const data = await response.json()

      if (response.ok) {
        setGenerationResult({
          success: true,
          message: data.message,
          count: data.count
        })
        // Clear form on success
        setFormData({
          gradeLevel: '',
          subject: '',
          count: '5'
        })
      } else {
        setGenerationResult({
          success: false,
          message: data.error || 'Failed to generate content'
        })
      }
    } catch (error) {
      setGenerationResult({
        success: false,
        message: 'Network error occurred'
      })
    } finally {
      setIsGenerating(false)
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
                  <h1 className="text-3xl font-bold mb-2">System Administration</h1>
                  <p className="text-muted-foreground">
                    Monitor platform health, manage users, and oversee system operations
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Security
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
            <ProminentTabs defaultValue="overview" className="space-y-6">
              <ProminentTabsList className="grid w-full grid-cols-4">
                <ProminentTabsTrigger value="overview">Overview</ProminentTabsTrigger>
                <ProminentTabsTrigger value="content">Content</ProminentTabsTrigger>
                <ProminentTabsTrigger value="users">Users</ProminentTabsTrigger>
                <ProminentTabsTrigger value="analytics">Analytics</ProminentTabsTrigger>
              </ProminentTabsList>

              {/* Overview Tab */}
              <ProminentTabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/admin/content/new'}>
                         <Plus className="h-4 w-4 mr-2" />
                         Create New Content
                       </Button>
                       <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/admin/categories'}>
                         <BarChart3 className="h-4 w-4 mr-2" />
                         Manage Categories
                       </Button>
                       <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/admin/content'}>
                         <BookOpen className="h-4 w-4 mr-2" />
                         View All Content
                       </Button>
                       <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/admin/users'}>
                         <Users className="h-4 w-4 mr-2" />
                         User Management
                       </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest platform activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.map((item) => (
                          <div key={item.id} className="flex items-start gap-3">
                            <div className="p-2 bg-muted rounded-md">
                              {item.type === 'user' && <Users className="h-4 w-4" />}
                              {item.type === 'content' && <BookOpen className="h-4 w-4" />}
                              {item.type === 'system' && <Shield className="h-4 w-4" />}
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
              </ProminentTabsContent>

              {/* Content Tab */}
              <ProminentTabsContent value="content" className="space-y-6">
                {/* AI Content Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      AI Content Generator
                    </CardTitle>
                    <CardDescription>
                      Generate personalized learning content using Grok AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gradeLevel">Grade Level</Label>
                        <Select
                          value={formData.gradeLevel}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, gradeLevel: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1st">1st Grade</SelectItem>
                            <SelectItem value="2nd">2nd Grade</SelectItem>
                            <SelectItem value="3rd">3rd Grade</SelectItem>
                            <SelectItem value="4th">4th Grade</SelectItem>
                            <SelectItem value="5th">5th Grade</SelectItem>
                            <SelectItem value="6th">6th Grade</SelectItem>
                            <SelectItem value="7th">7th Grade</SelectItem>
                            <SelectItem value="8th">8th Grade</SelectItem>
                            <SelectItem value="9th">9th Grade</SelectItem>
                            <SelectItem value="10th">10th Grade</SelectItem>
                            <SelectItem value="11th">11th Grade</SelectItem>
                            <SelectItem value="12th">12th Grade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Select
                          value={formData.subject}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Science">Science</SelectItem>
                            <SelectItem value="History">History</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Geography">Geography</SelectItem>
                            <SelectItem value="Art">Art</SelectItem>
                            <SelectItem value="Music">Music</SelectItem>
                            <SelectItem value="Physical Education">Physical Education</SelectItem>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="count">Number of Items</Label>
                        <Select
                          value={formData.count}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, count: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 items</SelectItem>
                            <SelectItem value="5">5 items</SelectItem>
                            <SelectItem value="7">7 items</SelectItem>
                            <SelectItem value="10">10 items</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateContent}
                      disabled={isGenerating}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Content...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>

                    {generationResult && (
                      <div className={`p-4 rounded-lg ${
                        generationResult.success
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        <p className="font-medium">
                          {generationResult.success ? '✅ Success!' : '❌ Error'}
                        </p>
                        <p className="text-sm mt-1">{generationResult.message}</p>
                        {generationResult.count && (
                          <p className="text-sm mt-1 font-medium">
                            Generated {generationResult.count} content items
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Content Management */}
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
                      <Button onClick={() => window.location.href = '/admin/content'}>
                        Go to Content Manager
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ProminentTabsContent>

              {/* Users Tab */}
              <ProminentTabsContent value="users" className="space-y-6">
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
                      <Button onClick={() => window.location.href = '/admin/users'}>
                        Go to User Manager
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ProminentTabsContent>

              {/* Analytics Tab */}
              <ProminentTabsContent value="analytics" className="space-y-6">
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
                      <Button onClick={() => window.location.href = '/admin/analytics'}>
                        View Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ProminentTabsContent>
            </ProminentTabs>
          </div>
        </main>
      </div>
    </div>
  )
}