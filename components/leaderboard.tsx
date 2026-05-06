'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Clock, BookOpen, Flame } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/user-context'
import { getLeaderboard, getFamilyLeaderboard } from '@/lib/data'

interface LeaderboardEntry {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  total_time: number
  total_completed: number
  current_streak: number
  role?: string
}

export function Leaderboard() {
  const { user, profile } = useAuth()
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([])
  const [familyLeaderboard, setFamilyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('global')

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setLoading(true)
      try {
        // Fetch global leaderboard
        const globalData = await getLeaderboard(10)
        setGlobalLeaderboard(globalData)

        // Fetch family leaderboard for parents
        if (profile?.role === 'parent' && user) {
          const familyData = await getFamilyLeaderboard(user.id, 10)
          setFamilyLeaderboard(familyData)
        }
      } catch (error) {
        console.error('Error fetching leaderboards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboards()
  }, [user, profile])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 2:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      case 3:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Leaderboards
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          See how you rank among fellow learners
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">Global Rankings</TabsTrigger>
          {profile?.role === 'parent' && (
            <TabsTrigger value="family">Family Rankings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          {globalLeaderboard.length > 0 ? (
            <div className="space-y-3">
              {globalLeaderboard.map((entry, index) => {
                const rank = index + 1
                const isCurrentUser = entry.user_id === user?.id

                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`transition-all duration-200 ${isCurrentUser ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10">
                            {getRankIcon(rank)}
                          </div>

                          <Avatar className="h-10 w-10">
                            <AvatarImage src={entry.avatar_url || ''} />
                            <AvatarFallback>
                              {entry.full_name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {entry.full_name || 'Anonymous Learner'}
                              </h3>
                              {isCurrentUser && (
                                <Badge variant="secondary" className="text-xs">You</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {entry.total_completed} completed
                              </div>
                              {entry.current_streak > 0 && (
                                <div className="flex items-center gap-1">
                                  <Flame className="h-3 w-3 text-orange-500" />
                                  {entry.current_streak} streak
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {formatTime(entry.total_time)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              total time
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Rankings Yet</h3>
                <p className="text-muted-foreground">
                  Leaderboards will appear once students start learning and completing content.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {profile?.role === 'parent' && (
          <TabsContent value="family" className="space-y-4">
            {familyLeaderboard.length > 0 ? (
              <div className="space-y-3">
                {familyLeaderboard.map((entry, index) => {
                  const rank = index + 1
                  const isCurrentUser = entry.user_id === user?.id

                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`transition-all duration-200 ${isCurrentUser ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10">
                              {getRankIcon(rank)}
                            </div>

                            <Avatar className="h-10 w-10">
                              <AvatarImage src={entry.avatar_url || ''} />
                              <AvatarFallback>
                                {entry.full_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {entry.full_name || 'Anonymous'}
                                </h3>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {entry.role}
                                </Badge>
                                {isCurrentUser && (
                                  <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {entry.total_completed} completed
                                </div>
                                {entry.role === 'student' && entry.current_streak > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Flame className="h-3 w-3 text-orange-500" />
                                    {entry.current_streak} streak
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-lg font-bold text-primary">
                                {formatTime(entry.total_time)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                total time
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Family Rankings Yet</h3>
                  <p className="text-muted-foreground">
                    Family leaderboards will appear once family members start learning.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  )
}