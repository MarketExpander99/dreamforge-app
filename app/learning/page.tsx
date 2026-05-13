'use client'

import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { getUserProgress, getUserBookmarks, getUserAchievements, getUserStats, getNextRecommendedContent, UserProgress, UserBookmark, UserAchievement } from '@/lib/data'
import { BookOpen, Bookmark, Trophy, Clock, Target, Calendar, Star, GraduationCap, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ProminentTabs, ProminentTabsContent, ProminentTabsList, ProminentTabsTrigger } from '@/components/ui/prominent-tabs'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/user-context'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Leaderboard } from '@/components/leaderboard'
import { AnalyticsDashboard } from '@/components/analytics-dashboard'

interface UserStats {
  totalCompleted: number
  currentStreak: number
  totalTime: number
  achievements: number
}

export default function LearningPage() {
  const router = useRouter()
  const { user, profile, authLoading } = useAuth()
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [userBookmarks, setUserBookmarks] = useState<UserBookmark[]>([])
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [userStats, setUserStats] = useState<UserStats>({ totalCompleted: 0, currentStreak: 0, totalTime: 0, achievements: 0 })
  const [recommendedContent, setRecommendedContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [navigationError, setNavigationError] = useState<string | null>(null)

  const hasGradeLevel = profile?.grade_level !== null

  // Handle navigation with proper loading state management
  const handleNavigation = useCallback(async (contentId: string) => {
    setNavigatingTo(contentId)
    setNavigationError(null)

    try {
      // Set a timeout to prevent infinite loading (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Navigation timeout')), 10000)
      })

      // Attempt navigation
      const navigationPromise = router.push(`/content/${contentId}`)

      // Race between navigation and timeout
      await Promise.race([navigationPromise, timeoutPromise])

      // Clear loading state on successful navigation
      setNavigatingTo(null)
    } catch (error) {
      console.error('Navigation failed:', error)
      setNavigationError(`Failed to load content. Please try again.`)
      setNavigatingTo(null)

      // Clear error after 5 seconds
      setTimeout(() => setNavigationError(null), 5000)
    }
  }, [router])

  const fetchUserData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const results = await Promise.allSettled([
        getUserProgress(user.id),
        getUserBookmarks(user.id),
        getUserAchievements(user.id),
        getUserStats(user.id)
      ])

      setUserProgress(results[0].status === 'fulfilled' ? results[0].value : [])
      setUserBookmarks(results[1].status === 'fulfilled' ? results[1].value : [])
      setUserAchievements(results[2].status === 'fulfilled' ? results[2].value : [])
      setUserStats(results[3].status === 'fulfilled' ? results[3].value : { totalCompleted: 0, currentStreak: 0, totalTime: 0, achievements: 0 })
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Continue with fallback data
      setUserProgress([])
      setUserBookmarks([])
      setUserAchievements([])
      setUserStats({ totalCompleted: 0, currentStreak: 0, totalTime: 0, achievements: 0 })
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch recommended content using adaptive engine
  const fetchRecommendedContent = useCallback(async () => {
    if (!user) return

    try {
      const recommended = await getNextRecommendedContent(user.id, 5)
      setRecommendedContent(recommended || [])
    } catch (error) {
      console.error('Error fetching recommended content:', error)
      setRecommendedContent([])
    }
  }, [user])

  // Check authentication and fetch user profile data
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.push('/auth/login')
        return
      }
      // User is authenticated, fetch profile and recommended content
      fetchUserData()
      fetchRecommendedContent()
    }
  }, [user, authLoading, router, fetchUserData, fetchRecommendedContent])

  // Format achievements for display
  const formattedAchievements = userAchievements.map(achievement => ({
    id: achievement.id,
    title: achievement.title || 'Achievement',
    description: achievement.description || 'Achievement unlocked',
    icon: achievement.icon || '🏆',
    earnedAt: achievement.earned_at ? new Date(achievement.earned_at).toLocaleDateString() : 'Recently'
  }))

  // Format progress for display
  const formattedProgress = userProgress.slice(0, 5).map(progress => ({
    id: progress.id,
    title: progress.content?.title || 'Unknown Content',
    progress: progress.progress_percentage,
    category: progress.content?.category?.name || 'General',
    lastAccessed: progress.last_accessed_at ? new Date(progress.last_accessed_at).toLocaleDateString() : 'Recently'
  }))

  // Format bookmarks for display
  const formattedBookmarks = userBookmarks
    .filter(bookmark => bookmark.content !== null)
    .map(bookmark => ({
      id: bookmark.content!.id,
      type: bookmark.content!.type,
      title: bookmark.content!.title,
      content: bookmark.content!.content,
      imageUrl: bookmark.content!.image_url || undefined,
      videoUrl: bookmark.content!.video_url || undefined,
      audioUrl: bookmark.content!.audio_url || undefined,
      quiz: bookmark.content!.quiz || undefined,
      category: bookmark.content!.category?.name || 'General',
      readTime: bookmark.content!.read_time,
      likes: bookmark.content!.likes,
      comments: 0 // Not implemented yet
    }))

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your learning data...</p>
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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">My Learning</h1>
              <p className="text-muted-foreground">
                Track your progress and continue your learning journey
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalCompleted}</div>
                  <p className="text-xs text-muted-foreground">learning modules</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.currentStreak}</div>
                  <p className="text-xs text-muted-foreground">days in a row</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalTime}</div>
                  <p className="text-xs text-muted-foreground">minutes learning</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.achievements}</div>
                  <p className="text-xs text-muted-foreground">unlocked</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <ProminentTabs defaultValue="progress" className="space-y-6">
              <ProminentTabsList className="grid w-full grid-cols-6 h-12">
                <ProminentTabsTrigger value="progress" className="text-sm font-medium">My Progress</ProminentTabsTrigger>
                <ProminentTabsTrigger value="analytics" className="text-sm font-medium">Analytics</ProminentTabsTrigger>
                <ProminentTabsTrigger value="leaderboard" className="text-sm font-medium">Leaderboard</ProminentTabsTrigger>
                <ProminentTabsTrigger value="curriculum" className="text-sm font-medium">Curriculum</ProminentTabsTrigger>
                <ProminentTabsTrigger value="bookmarks" className="text-sm font-medium">Bookmarks</ProminentTabsTrigger>
                <ProminentTabsTrigger value="achievements" className="text-sm font-medium">Achievements</ProminentTabsTrigger>
              </ProminentTabsList>

              {/* Progress Tab */}
              <ProminentTabsContent value="progress" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
                  {navigationError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {navigationError}
                    </div>
                  )}
                  {recommendedContent.length > 0 ? (
                    <div className="space-y-4">
                      {recommendedContent.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold">{item.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="secondary" className="text-xs">{item.category?.name || 'General'}</Badge>
                                  <span>•</span>
                                  <span>{item.difficulty || 'Beginner'}</span>
                                  <span>•</span>
                                  <span>{item.read_time || 5} min read</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">Recommended</div>
                                <div className="text-xs text-muted-foreground">Next in your path</div>
                              </div>
                            </div>
                            {item.content && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {item.content.substring(0, 150)}...
                              </p>
                            )}
                            <Button
                              size="sm"
                              disabled={navigatingTo === item.id}
                              onClick={() => handleNavigation(item.id)}
                            >
                              {navigatingTo === item.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2"></div>
                                  Loading...
                                </>
                              ) : (
                                'Start Learning'
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : formattedProgress.length > 0 ? (
                    <div className="space-y-4">
                      {formattedProgress.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold">{item.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                                  <span>•</span>
                                  <span>{item.lastAccessed}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{item.progress}%</div>
                                <div className="text-xs text-muted-foreground">complete</div>
                              </div>
                            </div>
                             <Progress value={item.progress} className="mb-4" />
                              <Button
                                size="sm"
                                disabled={navigatingTo === item.id}
                                onClick={() => handleNavigation(item.id)}
                              >
                                {navigatingTo === item.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2"></div>
                                    Loading...
                                  </>
                                ) : (
                                  item.progress === 0 ? 'Start' : item.progress === 100 ? 'Review' : 'Continue'
                                )}
                              </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Ready to Start Learning?</h3>
                        <p className="text-muted-foreground mb-4">
                          Take our quick assessment to get personalized learning recommendations.
                        </p>
                        <Button onClick={() => window.location.href = '/assessment'}>
                          Take Assessment
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Learning Activity</h2>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Learning Calendar</h3>
                        <p className="text-muted-foreground text-sm">
                          Track your daily learning activity and maintain your streak
                        </p>
                        <Button className="mt-4" variant="outline" onClick={() => window.location.href = '/learning/calendar'}>
                          View Full Calendar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ProminentTabsContent>

              {/* Analytics Tab */}
              <ProminentTabsContent value="analytics" className="space-y-6">
                <AnalyticsDashboard />
              </ProminentTabsContent>

              {/* Leaderboard Tab */}
              <ProminentTabsContent value="leaderboard" className="space-y-6">
                <Leaderboard />
              </ProminentTabsContent>

              {/* Curriculum Tab */}
              <ProminentTabsContent value="curriculum" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <GraduationCap className="h-5 w-5 text-green-500" />
                    <h2 className="text-xl font-semibold">Curriculum & Lesson Planning</h2>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">📝</div>
                        <h3 className="font-semibold mb-1">Grade Assessment</h3>
                        <p className="text-sm text-muted-foreground mb-3">Determine your child's grade level</p>
                        <Button size="sm" onClick={() => window.location.href = '/assessment'}>
                          Take Assessment
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">📚</div>
                        <h3 className="font-semibold mb-1">Browse Curriculum</h3>
                        <p className="text-sm text-muted-foreground mb-3">Explore CAPS curriculum</p>
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/learning/curriculum'}>
                          View Curriculum
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <h3 className="font-semibold mb-1">Lesson Plans</h3>
                        <p className="text-sm text-muted-foreground mb-3">Structured learning sequences</p>
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/learning/curriculum?tab=lessons'}>
                          View Plans
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Current Learning Path */}
                  {hasGradeLevel ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Current Learning Path
                        </CardTitle>
                        <CardDescription>
                          Your personalized curriculum progress
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                {profile?.interests?.[0] || 'General Studies'} - Grade {profile?.grade_level}
                              </h3>
                              <p className="text-sm text-muted-foreground">CAPS Curriculum</p>
                            </div>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Overall Progress</span>
                              <span>{userStats.totalCompleted > 0 ? Math.round((userStats.totalCompleted / (userStats.totalCompleted + userProgress.length)) * 100) : 0}%</span>
                            </div>
                            <Progress value={userStats.totalCompleted > 0 ? Math.round((userStats.totalCompleted / (userStats.totalCompleted + userProgress.length)) * 100) : 0} className="w-full" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Continue your personalized learning journey
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          Unlock Your Learning Path
                        </CardTitle>
                        <CardDescription>
                          Complete your grade assessment to get a personalized curriculum
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Personalized Curriculum</h3>
                              <p className="text-sm text-blue-700 dark:text-blue-300">Tailored to your grade level and interests</p>
                            </div>
                            <Badge variant="outline" className="border-blue-300 text-blue-700">Locked</Badge>
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            Take the quick assessment to unlock your personalized learning path
                          </div>
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => window.location.href = '/learning/curriculum'}
                          >
                            Take Grade Assessment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Available Subjects */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Available Subjects</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { name: 'Mathematics', icon: '🔢', color: 'red' },
                        { name: 'English', icon: '📚', color: 'blue' },
                        { name: 'Science', icon: '🔬', color: 'green' },
                        { name: 'Social Sciences', icon: '🌍', color: 'orange' },
                        { name: 'Life Skills', icon: '🎨', color: 'purple' }
                      ].map((subject) => (
                        <Card key={subject.name} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl mb-2">{subject.icon}</div>
                            <h4 className="font-medium text-sm">{subject.name}</h4>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ProminentTabsContent>

              {/* Bookmarks Tab */}
              <ProminentTabsContent value="bookmarks" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Bookmark className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold">Bookmarked Content</h2>
                  </div>

                  {formattedBookmarks.length > 0 ? (
                    <div className="space-y-6">
                      {formattedBookmarks.map((card) => (
                        <FeedCard key={card.id} card={card} />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No Bookmarks Yet</h3>
                        <p className="text-muted-foreground">
                          Bookmark content to save it for later.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ProminentTabsContent>

              {/* Achievements Tab */}
              <ProminentTabsContent value="achievements" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-xl font-semibold">Achievements</h2>
                  </div>

                  {formattedAchievements.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {formattedAchievements.map((achievement) => (
                        <Card key={achievement.id} className="relative">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{achievement.icon}</div>
                              <div>
                                <CardTitle className="text-lg">{achievement.title}</CardTitle>
                                <CardDescription>{achievement.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star className="h-4 w-4" />
                              <span>Earned {achievement.earnedAt}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No Achievements Yet</h3>
                        <p className="text-muted-foreground">
                          Complete learning modules to unlock achievements.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ProminentTabsContent>
            </ProminentTabs>
          </div>
        </main>
      </div>
    </div>
  )
}