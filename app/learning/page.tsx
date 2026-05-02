import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { getUserProgress, getUserBookmarks, getUserAchievements, getUserStats, getContentItems, UserProgress, UserBookmark, UserAchievement } from '@/lib/data'
import { createClient } from '@/lib/supabase-server'
import { BookOpen, Bookmark, Trophy, TrendingUp, Clock, Target, Calendar, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { redirect } from 'next/navigation'

interface LearningPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function LearningPage({ searchParams }: LearningPageProps) {
  // Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user data from database
  const [userProgress, userBookmarks, userAchievements, userStats] = await Promise.all([
    getUserProgress(user.id),
    getUserBookmarks(user.id),
    getUserAchievements(user.id),
    getUserStats(user.id)
  ])

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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="progress">My Progress</TabsTrigger>
                <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
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
                              {item.progress === 100 ? 'Review' : 'Continue'}
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
                        <Button className="mt-4" variant="outline">
                          View Full Calendar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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