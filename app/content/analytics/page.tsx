"use client"

import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Clock,
  BookOpen,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Download
} from 'lucide-react'
import Link from 'next/link'

export default function ContentAnalyticsPage() {
  // Mock analytics data - in real app, this would come from database
  const analyticsData = {
    overview: {
      totalViews: 15420,
      totalEngagement: 87,
      avgTimeSpent: '8m 32s',
      completionRate: 73,
      topContent: [
        { title: 'Photosynthesis Explained', views: 245, engagement: 92, completions: 89 },
        { title: 'Water Cycle Video', views: 189, engagement: 95, completions: 91 },
        { title: 'Algebra Fundamentals', views: 156, engagement: 88, completions: 76 },
        { title: 'Ancient Rome Quiz', views: 98, engagement: 85, completions: 82 },
        { title: 'Climate Change Audio', views: 87, engagement: 91, completions: 88 }
      ]
    },
    performance: {
      weeklyViews: [120, 145, 98, 167, 134, 189, 156],
      engagementTrend: [85, 87, 82, 91, 89, 93, 87],
      subjectBreakdown: [
        { subject: 'Mathematics', views: 3420, percentage: 22 },
        { subject: 'Science', views: 4156, percentage: 27 },
        { subject: 'History', views: 2890, percentage: 19 },
        { subject: 'English', views: 2345, percentage: 15 },
        { subject: 'Geography', views: 2609, percentage: 17 }
      ]
    },
    audience: {
      gradeDistribution: [
        { grade: 'Grade 7', students: 245, percentage: 18 },
        { grade: 'Grade 8', students: 312, percentage: 23 },
        { grade: 'Grade 9', students: 289, percentage: 21 },
        { grade: 'Grade 10', students: 267, percentage: 20 },
        { grade: 'Grade 11', students: 198, percentage: 15 },
        { grade: 'Grade 12', students: 67, percentage: 3 }
      ],
      deviceTypes: [
        { device: 'Mobile', users: 892, percentage: 65 },
        { device: 'Desktop', users: 345, percentage: 25 },
        { device: 'Tablet', users: 143, percentage: 10 }
      ]
    }
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatPercentage = (num: number) => {
    return `${num}%`
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
                  <h1 className="text-3xl font-bold mb-2">Content Analytics</h1>
                  <p className="text-muted-foreground">
                    Track performance, engagement, and insights for your educational content
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Last 30 Days
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalViews)}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(analyticsData.overview.totalEngagement)}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +5% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Time Spent</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.overview.avgTimeSpent}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +2m from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(analyticsData.overview.completionRate)}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    -2% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Top Performing Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Content</CardTitle>
                      <CardDescription>Your most viewed and engaged content this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.overview.topContent.map((content, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{content.title}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{content.views} views</span>
                                <span>{content.engagement}% engagement</span>
                                <span>{content.completions}% completion</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="ml-2">
                              #{index + 1}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest engagement and interactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">New view on "Photosynthesis Explained"</p>
                            <p className="text-xs text-muted-foreground">2 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Award className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Student completed "Water Cycle Video"</p>
                            <p className="text-xs text-muted-foreground">15 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <BookOpen className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">High engagement on "Algebra Fundamentals"</p>
                            <p className="text-xs text-muted-foreground">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Weekly Views Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Views Trend</CardTitle>
                      <CardDescription>Content views over the past 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-end justify-between gap-2">
                        {analyticsData.performance.weeklyViews.map((views, index) => (
                          <div key={index} className="flex flex-col items-center gap-2">
                            <div
                              className="w-8 bg-blue-500 rounded-t"
                              style={{ height: `${(views / 200) * 200}px` }}
                            ></div>
                            <span className="text-xs text-muted-foreground">
                              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subject Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Views by Subject</CardTitle>
                      <CardDescription>Distribution of content views across subjects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.performance.subjectBreakdown.map((subject, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-sm font-medium">{subject.subject}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatNumber(subject.views)}</p>
                              <p className="text-xs text-muted-foreground">{subject.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Audience Tab */}
              <TabsContent value="audience" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Grade Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Distribution by Grade</CardTitle>
                      <CardDescription>Which grades are engaging with your content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.audience.gradeDistribution.map((grade, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{grade.grade}</span>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${grade.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground w-12">
                                {grade.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Device Types */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Device Usage</CardTitle>
                      <CardDescription>How students access your content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.audience.deviceTypes.map((device, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{device.device}</span>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${device.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground w-12">
                                {device.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Performance Details</CardTitle>
                    <CardDescription>Detailed analytics for individual content pieces</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Detailed Content Analytics</h3>
                      <p className="text-muted-foreground mb-4">
                        View comprehensive performance metrics, engagement patterns, and student feedback for each content piece.
                      </p>
                      <Button onClick={() => window.location.href = '/content/manage'}>
                        View Content Library
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