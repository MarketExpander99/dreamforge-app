import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { getUserProgress, getUserBookmarks, getUserAchievements, getUserStats, getContentItems, UserProgress, UserBookmark, UserAchievement } from '@/lib/data'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { BookOpen, Bookmark, Trophy, TrendingUp, Clock, Target, Calendar, Star, GraduationCap, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface LearningPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LearningPage({ searchParams }: LearningPageProps) {
  const resolvedSearchParams = await searchParams
  // Get current user with timeout
  let user: any = null
  try {
    const supabase = createBrowserSupabaseClient()
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 3000)
    )

    const { data: { user: authUser } } = await Promise.race([authPromise, timeoutPromise]) as any
    user = authUser
  } catch (error) {
    console.error('Authentication error:', error)
  }

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user data from database with error handling
  let userProgress: UserProgress[] = []
  let userBookmarks: UserBookmark[] = []
  let userAchievements: UserAchievement[] = []
  let userStats: any = { totalCompleted: 0, currentStreak: 0, totalTime: 0, achievements: 0 }

  try {
    const results = await Promise.allSettled([
      getUserProgress(user.id),
      getUserBookmarks(user.id),
      getUserAchievements(user.id),
      getUserStats(user.id)
    ])

    userProgress = results[0].status === 'fulfilled' ? results[0].value : []
    userBookmarks = results[1].status === 'fulfilled' ? results[1].value : []
    userAchievements = results[2].status === 'fulfilled' ? results[2].value : []
    userStats = results[3].status === 'fulfilled' ? results[3].value : { totalCompleted: 0, currentStreak: 0, totalTime: 0, achievements: 0 }
  } catch (error) {
    console.error('Error fetching user data:', error)
    // Continue with empty data
  }

  // Get all content for fallback display
  const allContent = await getContentItems({ limit: 10 })

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
            <Tabs defaultValue="progress" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="progress" className="text-sm font-medium">My Progress</TabsTrigger>
                <TabsTrigger value="curriculum" className="text-sm font-medium">Curriculum</TabsTrigger>
                <TabsTrigger value="bookmarks" className="text-sm font-medium">Bookmarks</TabsTrigger>
                <TabsTrigger value="achievements" className="text-sm font-medium">Achievements</TabsTrigger>
              </TabsList>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Continue Learning</h2>
                  {formattedProgress.length > 0 ? (
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
                             <Button size="sm">
                               {item.progress === 0 ? 'Start' : item.progress === 100 ? 'Review' : 'Continue'}
                             </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No Progress Yet</h3>
                        <p className="text-muted-foreground">
                          Start learning to see your progress here.
                        </p>
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
                        <Button className="mt-4" variant="outline" asChild>
                          <Link href="/learning/calendar">
                            View Full Calendar
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="space-y-6">
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
                        <Button size="sm" asChild>
                          <Link href="/assessment">Take Assessment</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">📚</div>
                        <h3 className="font-semibold mb-1">Browse Curriculum</h3>
                        <p className="text-sm text-muted-foreground mb-3">Explore CAPS curriculum</p>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/learning/curriculum">View Curriculum</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">🎯</div>
                        <h3 className="font-semibold mb-1">Lesson Plans</h3>
                        <p className="text-sm text-muted-foreground mb-3">Structured learning sequences</p>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/learning/curriculum?tab=lessons">View Plans</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Current Learning Path */}
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
                            <h3 className="font-semibold">Mathematics - Grade 3</h3>
                            <p className="text-sm text-muted-foreground">CAPS Curriculum</p>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Overall Progress</span>
                            <span>0%</span>
                          </div>
                          <Progress value={0} className="w-full" />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Complete assessment to unlock personalized curriculum
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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
              </TabsContent>

              {/* Bookmarks Tab */}
              <TabsContent value="bookmarks" className="space-y-6">
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
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-6">
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
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}