'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Flame, TrendingUp, Send, Clock, BookOpen, GraduationCap, Route, Target } from 'lucide-react'
import { useNotifications } from '@/lib/notification-context'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/user-context'

interface Child {
  id: string
  full_name: string
  avatar_url?: string
  grade_level?: string
  created_at: string
}

interface ActivityItem {
  id: string
  type: 'achievement' | 'progress'
  childId: string
  childName: string
  title: string
  description: string
  icon: string
  timestamp: string
}

interface CurriculumProgress {
  subject: string
  completed: number
  total: number
  percentage: number
  grade: string
}

interface FamilyDashboardProps {
  children: Child[]
  activityFeed: ActivityItem[]
}

function calculateStreak(childId: string, activityFeed: ActivityItem[]): number {
  // This is a simplified streak calculation
  // In a real implementation, you'd want to track daily activity
  const childActivities = activityFeed.filter(item => item.childId === childId)
  const recentActivities = childActivities
    .filter(item => {
      const activityDate = new Date(item.timestamp)
      const now = new Date()
      const daysDiff = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 7 // Activities in the last 7 days
    })
    .length

  return Math.min(recentActivities, 7) // Cap at 7 for display
}

function calculateOverallProgress(childId: string, activityFeed: ActivityItem[]): number {
  const childActivities = activityFeed.filter(item => item.childId === childId)
  const completedItems = childActivities.filter(item => item.type === 'progress').length

  // Estimate based on completed items (this is simplified)
  return Math.min(completedItems * 10, 100) // Rough estimate
}

function getRecentActivity(childId: string, activityFeed: ActivityItem[]): ActivityItem[] {
  return activityFeed
    .filter(item => item.childId === childId)
    .slice(0, 3) // Last 3 activities
}

export function FamilyDashboard({ children, activityFeed }: FamilyDashboardProps) {
  const { user } = useAuth()
  const { showNotification } = useNotifications()
  const [nudgeDialogOpen, setNudgeDialogOpen] = useState(false)
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [nudgeMessage, setNudgeMessage] = useState('')
  const [sendingNudge, setSendingNudge] = useState(false)

  const handleSendNudge = async () => {
    if (!selectedChild || !nudgeMessage.trim() || !user) return

    setSendingNudge(true)
    try {
      const supabase = createBrowserSupabaseClient()

      // Send nudge as a broadcast message (you might want to create a nudges table for this)
      // For now, we'll use the notification system
      showNotification({
        type: 'nudge',
        title: `Message from ${user.email?.split('@')[0] || 'Parent'}`,
        message: nudgeMessage,
        userId: selectedChild.id
      })

      setNudgeMessage('')
      setNudgeDialogOpen(false)
      setSelectedChild(null)
    } catch (error) {
      console.error('Error sending nudge:', error)
    } finally {
      setSendingNudge(false)
    }
  }

  const openNudgeDialog = (child: Child) => {
    setSelectedChild(child)
    setNudgeDialogOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-gray-900 dark:text-white"
        >
          Family Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 dark:text-gray-300 mt-2"
        >
          Track your children's learning progress and stay connected with their achievements.
        </motion.p>
      </div>

      {/* Children Cards */}
      {children.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Children Linked Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Link student accounts to start tracking their progress and achievements.
          </p>
          <Button
            onClick={() => {
              // For now, show an alert with instructions
              // In a real implementation, this would open a dialog or navigate to a child linking flow
              alert('To add a child account:\n\n1. Have your child create a student account\n2. Ask them to share their account details with you\n3. Contact support to link the accounts\n\nThis feature will be available in the next update.')
            }}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
          >
            <GraduationCap className="h-5 w-5 mr-2" />
            Add Child Account
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {children.map((child, index) => {
            const streak = calculateStreak(child.id, activityFeed)
            const overallProgress = calculateOverallProgress(child.id, activityFeed)
            const recentActivity = getRecentActivity(child.id, activityFeed)

            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -4 }}
                className="transition-shadow duration-200"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={child.avatar_url || ""} />
                        <AvatarFallback>
                          {child.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{child.full_name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {child.grade_level || 'Grade Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Streak */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Current Streak</span>
                      </div>
                      <Badge variant={streak > 0 ? "default" : "secondary"}>
                        {streak} days
                      </Badge>
                    </div>

                    {/* Overall Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {overallProgress}%
                        </span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recent Activity</h4>
                      {recentActivity.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No recent activity
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-2 text-xs">
                              <span className="text-lg">{activity.icon}</span>
                              <div className="flex-1 truncate">
                                <span className="font-medium">{activity.title}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  • {new Date(activity.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Nudge Button */}
                    <Button
                      onClick={() => openNudgeDialog(child)}
                      className="w-full"
                      variant="outline"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Nudge
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Curriculum Progress Section */}
      {children.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Curriculum Progress
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Track your children's progress through CAPS curriculum subjects
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {children.map((child) => (
                  <div key={child.id} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={child.avatar_url || ""} />
                        <AvatarFallback className="text-xs">
                          {child.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{child.full_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {child.grade_level || 'Grade Unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Curriculum subjects would be loaded from database */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-11">
                      {/* Placeholder curriculum subjects - in real implementation, load from database */}
                      {['Mathematics', 'English', 'Natural Sciences', 'Social Sciences'].map((subject) => {
                        const progress = Math.floor(Math.random() * 100) // Placeholder
                        return (
                          <div key={subject} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{subject}</span>
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Assessment & Learning Paths Section */}
      {children.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Assessment Results & Learning Paths
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View your children's grade assessments and personalized learning journeys
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {children.map((child) => (
                  <div key={child.id} className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={child.avatar_url || ""} />
                        <AvatarFallback className="text-xs">
                          {child.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{child.full_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Assessment Status
                        </p>
                      </div>
                    </div>

                    {/* Assessment Status */}
                    <div className="ml-11 space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Target className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Grade Assessment</p>
                            <p className="text-xs text-muted-foreground">
                              {child.grade_level ? `Completed - Recommended: ${child.grade_level}` : 'Not completed yet'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={child.grade_level ? "default" : "secondary"}>
                          {child.grade_level ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>

                      {/* Learning Paths */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium flex items-center">
                          <Route className="h-4 w-4 mr-2" />
                          Active Learning Paths
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Placeholder learning paths - in real implementation, load from database */}
                          {['Mathematics', 'English', 'Natural Sciences'].map((subject) => {
                            const progress = Math.floor(Math.random() * 100)
                            return (
                              <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">
                                    {subject === 'Mathematics' ? '🔢' :
                                     subject === 'English' ? '📚' : '🧬'}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium">{subject}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {child.grade_level || 'Grade Unknown'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{progress}%</p>
                                  <Progress value={progress} className="w-16 h-1" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Activity Feed */}
      {activityFeed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Family Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityFeed.slice(0, 10).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{activity.childName}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {activity.description}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Nudge Dialog */}
      <Dialog open={nudgeDialogOpen} onOpenChange={setNudgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Send a nudge to {selectedChild?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Write an encouraging message..."
              value={nudgeMessage}
              onChange={(e) => setNudgeMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setNudgeDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendNudge}
                disabled={!nudgeMessage.trim() || sendingNudge}
              >
                {sendingNudge ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Nudge
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}