'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Target, Clock, Trophy, Flame, Calendar, Download, Users, BookOpen, Award } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getUserAnalytics, UserAnalytics, getUserProfile } from '@/lib/data'
import { useAuth } from '@/lib/user-context'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

interface AnalyticsDashboardProps {
  selectedChildId?: string
  onChildChange?: (childId: string) => void
}

const SUBJECT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export function AnalyticsDashboard({ selectedChildId, onChildChange }: AnalyticsDashboardProps) {
  const { user, profile } = useAuth()
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('me')
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonChildren, setComparisonChildren] = useState<string[]>([])
  const [comparisonAnalytics, setComparisonAnalytics] = useState<{[key: string]: UserAnalytics}>({})

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      setLoading(true)
      try {
        let targetUserId = user.id

        // If parent is viewing child's analytics
        if (profile?.role === 'parent' && selectedChildId && selectedChildId !== 'me') {
          targetUserId = selectedChildId
        }

        const analyticsData = await getUserAnalytics(targetUserId)
        setAnalytics(analyticsData)

        // Fetch children for parent view
        if (profile?.role === 'parent') {
          const supabase = createBrowserSupabaseClient()
          const { data: childrenData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, grade_level')
            .eq('parent_id', user.id)
            .eq('role', 'student')

          setChildren(childrenData || [])
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, profile, selectedChildId])

  const handleChildChange = (childId: string) => {
    setSelectedChild(childId)
    onChildChange?.(childId)
  }

  const exportAnalytics = () => {
    if (!analytics) return

    // Create a printable HTML summary
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const userName = selectedChild === 'me' ? 'Me' : children.find(c => c.id === selectedChild)?.full_name || 'Student'
    const exportDate = new Date().toLocaleDateString()

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Learning Analytics - ${userName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .metric { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
            .metric h3 { margin: 0 0 8px 0; color: #1e293b; }
            .metric p { margin: 0; color: #64748b; }
            .charts { margin: 30px 0; }
            .chart-placeholder { background: #f1f5f9; padding: 40px; text-align: center; border-radius: 8px; margin: 20px 0; color: #64748b; }
            .insights { margin-top: 30px; }
            .insight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #f59e0b; }
            .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 14px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Learning Analytics Report</h1>
            <h2>${userName}</h2>
            <p>Generated on ${exportDate}</p>
          </div>

          <div class="metrics">
            <div class="metric">
              <h3>Current Streak</h3>
              <p>${analytics.currentStreak} days</p>
            </div>
            <div class="metric">
              <h3>Completed Modules</h3>
              <p>${analytics.totalCompleted} modules</p>
            </div>
            <div class="metric">
              <h3>Time Spent</h3>
              <p>${Math.round(analytics.totalTimeSpent / 60 * 10) / 10} hours</p>
            </div>
            <div class="metric">
              <h3>Completion Rate</h3>
              <p>${Math.round(analytics.completionRate)}%</p>
            </div>
          </div>

          <div class="charts">
            <h3>Weekly Learning Activity</h3>
            <div class="chart-placeholder">
              [Weekly Learning Hours Chart - View in dashboard for interactive version]
            </div>

            <h3>Subject Progress</h3>
            <div class="chart-placeholder">
              [Subject Progress Chart - View in dashboard for interactive version]
            </div>
          </div>

          <div class="insights">
            <h3>Key Insights</h3>
            ${analytics.insights.map(insight => `
              <div class="insight">
                <strong>${insight.title}</strong><br>
                ${insight.description}
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>Generated by Skill Gain - Transforming Education Through Analytics</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Analytics Data Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Start learning to see your progress analytics and insights.
        </p>
      </div>
    )
  }

  // Comparison View
  if (comparisonMode && profile?.role === 'parent' && children.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Children Comparison
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Compare learning progress across your children
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setComparisonMode(false)}
              variant="outline"
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Single View
            </Button>

            <Button onClick={exportAnalytics} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">👤</div>
                    <div>
                      <CardTitle className="text-lg">{child.full_name}</CardTitle>
                      <CardDescription>{child.grade_level || 'Grade not set'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">0</div>
                      <div className="text-xs text-muted-foreground">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">0</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">0h</div>
                      <div className="text-xs text-muted-foreground">Time Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">0%</div>
                      <div className="text-xs text-muted-foreground">Completion</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedChild(child.id)
                      setComparisonMode(false)
                      onChildChange?.(child.id)
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Hours Comparison</CardTitle>
              <CardDescription>Weekly learning hours by child</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-muted-foreground">Charts will show comparative data once children have learning activity</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subject Progress Comparison</CardTitle>
              <CardDescription>Completion rates across subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📈</div>
                <p className="text-muted-foreground">Subject comparison charts will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header with Child Selector and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Learning Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Track your progress and discover insights about your learning journey
          </p>
        </div>

        <div className="flex items-center gap-4">
          {profile?.role === 'parent' && children.length > 1 && (
            <Button
              onClick={() => setComparisonMode(!comparisonMode)}
              variant={comparisonMode ? "default" : "outline"}
              size="sm"
            >
              <Users className="h-4 w-4 mr-2" />
              {comparisonMode ? 'Single View' : 'Compare Children'}
            </Button>
          )}

          {profile?.role === 'parent' && children.length > 0 && !comparisonMode && (
            <Select value={selectedChild} onValueChange={handleChildChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">My Analytics</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={exportAnalytics} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.currentStreak}</div>
              <p className="text-xs text-muted-foreground">days in a row</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCompleted}</div>
              <p className="text-xs text-muted-foreground">learning modules</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(analytics.totalTimeSpent / 60 * 10) / 10}</div>
              <p className="text-xs text-muted-foreground">hours learning</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(analytics.completionRate)}%</div>
              <p className="text-xs text-muted-foreground">of started content</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Learning Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Weekly Learning Hours
              </CardTitle>
              <CardDescription>Last 4 weeks of learning activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.weeklyHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => [`${value}h`, 'Hours']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subject Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Subject Progress
              </CardTitle>
              <CardDescription>Completion rate by subject area</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.subjectProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => [`${Math.round(value)}%`, 'Completion']}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personalized Insights */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Personalized Insights
              </CardTitle>
              <CardDescription>AI-powered insights about your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.insights.length > 0 ? (
                <div className="space-y-4">
                  {analytics.insights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                    >
                      <div className="text-2xl">{insight.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">💡</div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Complete more lessons to unlock personalized insights!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning Velocity & Streaks */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Learning Velocity
              </CardTitle>
              <CardDescription>This week vs last week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {analytics.learningVelocity.change > 0 ? '+' : ''}{analytics.learningVelocity.change}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  {analytics.learningVelocity.changePercent > 0 ? '+' : ''}{analytics.learningVelocity.changePercent}% change
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{analytics.learningVelocity.thisWeek}</div>
                    <div className="text-muted-foreground">This week</div>
                  </div>
                  <div>
                    <div className="font-medium">{analytics.learningVelocity.lastWeek}</div>
                    <div className="text-muted-foreground">Last week</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Flame className="h-4 w-4 mr-2 text-orange-500" />
                  Streaks
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current</span>
                    <Badge variant={analytics.currentStreak > 0 ? "default" : "secondary"}>
                      {analytics.currentStreak} days
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Longest</span>
                    <Badge variant="outline">
                      {analytics.longestStreak} days
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Learning Activity Heatmap
            </CardTitle>
            <CardDescription>Last 30 days of learning activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {analytics.activityHeatmap.map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0 + index * 0.01 }}
                  className={`aspect-square rounded-sm flex items-center justify-center text-xs font-medium ${
                    day.count === 0
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                      : day.count === 1
                      ? 'bg-green-200 dark:bg-green-800 text-green-800'
                      : day.count === 2
                      ? 'bg-green-300 dark:bg-green-700 text-green-900'
                      : 'bg-green-400 dark:bg-green-600 text-white'
                  }`}
                  title={`${day.date}: ${day.count} activities`}
                >
                  {day.count > 0 ? day.count : ''}
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 dark:bg-green-800 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-300 dark:bg-green-700 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded-sm"></div>
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}