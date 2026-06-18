"use client"

import { User, Settings, BookOpen, Trophy, Calendar, Edit, Save, Camera, Key, Loader2, Sparkles, Lock, Lightbulb, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/user-context'

interface UserProfile {
  id: string
  fullName: string
  email: string
  avatar: string
  bio: string
  gradeLevel: string
  interests: string[]
  learningGoals: string
  joinDate: string
  totalLearningTime: number
  completedModules: number
  currentStreak: number
  totalXP?: number
  currentLevel?: number
  achievementsCount: number
  recentActivity: Array<{
    id: string
    action: string
    title: string
    timestamp: string
  }>
  achievements: Array<{
    id: string
    type?: string
    title: string
    description: string
    icon: string
    earnedAt: string
  }>
  achievementDefinitions?: Array<{
    type: string
    title: string
    description: string
    icon: string
  }>
  categoryProgress: Array<{
    category: string
    progress: number
    completed: number
    total: number
  }>
  activeLearningPath?: {
    id?: string
    title: string
    description?: string
    steps?: Array<{
      title: string
      description?: string
      estimatedTime?: string
    }>
    updatedAt?: string
  } | null
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, authLoading } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    gradeLevel: '',
    interests: '',
    learningGoals: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSaveProfile = async () => {
    if (!userProfile) return
    setSaving(true)
    try {
      const { createBrowserSupabaseClient } = await import('@/lib/supabase-client')
      const supabase = createBrowserSupabaseClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          bio: formData.bio,
          grade_level: formData.gradeLevel,
          interests: formData.interests ? formData.interests.split(',').map(i => i.trim()) : null,
          learning_goals: formData.learningGoals,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)

      if (error) throw error

      setUserProfile(prev => prev ? {
        ...prev,
        fullName: formData.fullName,
        bio: formData.bio,
        gradeLevel: formData.gradeLevel,
        interests: formData.interests ? formData.interests.split(',').map(i => i.trim()) : [],
        learningGoals: formData.learningGoals
      } : null)

      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
        setFormData({
          fullName: data.fullName,
          bio: data.bio || '',
          gradeLevel: data.gradeLevel,
          interests: data.interests.join(', '),
          learningGoals: data.learningGoals || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login')
        return
      }
      fetchProfile()
    }
  }, [user, authLoading])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('avatar', file)
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formDataUpload,
      })
      if (response.ok) {
        // Refresh profile to show new avatar immediately
        await fetchProfile()
      } else {
        const errorText = await response.text()
        alert(`Failed to upload avatar: ${errorText}`)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })
      if (response.ok) {
        alert('Password changed successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        alert('Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Please try logging in again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="py-8 px-4 md:px-8 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Header — real data, premium calm feel ("I am growing") */}
          <div className="mb-10">
            <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                  {/* Avatar with upload overlay */}
                  <div className="relative group">
                    <Avatar className="h-32 w-32 border-4 border-white dark:border-zinc-800 shadow-xl">
                      <AvatarImage src={userProfile.avatar} alt={userProfile.fullName} />
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-amber-400 to-emerald-500 text-white">
                        {userProfile.fullName?.[0] || '👤'}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 h-8 w-8 rounded-full p-0 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {userProfile.fullName}
                          </h1>
                          {/* Real level from data */}
                          <Badge variant="secondary" className="text-sm px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-0">
                            Level {userProfile.currentLevel ?? 1}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{userProfile.email}</p>
                        {userProfile.gradeLevel && userProfile.gradeLevel !== 'Not specified' && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Grade {userProfile.gradeLevel}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                        className="gap-2 shrink-0"
                      >
                        <Edit className="h-4 w-4" />
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>

                    {/* XP progress indicator (derived from real activity) */}
                    {(userProfile.totalXP ?? 0) > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <span className="text-amber-600 dark:text-amber-400 font-medium tabular-nums">{userProfile.totalXP} XP</span>
                        <span className="text-xs text-muted-foreground">• Growing steadily</span>
                      </div>
                    )}

                    {/* Quick Stats — all real data, elegant presentation */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-center border border-zinc-100 dark:border-zinc-800">
                        <div className="text-2xl font-semibold text-emerald-600 tabular-nums">{userProfile.currentStreak}</div>
                        <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground mt-0.5">Day Streak</p>
                      </div>
                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-center border border-zinc-100 dark:border-zinc-800">
                        <div className="text-2xl font-semibold text-blue-600 tabular-nums">
                          {Math.floor(userProfile.totalLearningTime / 60)}
                          <span className="text-base align-super text-blue-500">h</span>
                          {userProfile.totalLearningTime % 60 > 0 && (
                            <span className="text-lg align-super text-blue-500/70"> {userProfile.totalLearningTime % 60}m</span>
                          )}
                        </div>
                        <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground mt-0.5">Time Invested</p>
                      </div>
                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-center border border-zinc-100 dark:border-zinc-800">
                        <div className="text-2xl font-semibold text-amber-600 tabular-nums">{userProfile.completedModules}</div>
                        <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground mt-0.5">Modules Completed</p>
                      </div>
                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-center border border-zinc-100 dark:border-zinc-800">
                        <div className="text-2xl font-semibold text-purple-600 tabular-nums">{userProfile.achievementsCount}</div>
                        <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground mt-0.5">Achievements</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-zinc-900 border-0 shadow-sm">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-8 space-y-8">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Bio &amp; Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-muted-foreground">{userProfile.bio || 'No bio yet. Tell us a little about yourself!'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Learning Goals</Label>
                    <p className="mt-2">{userProfile.learningGoals || 'No goals set yet.'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Interests</Label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {userProfile.interests.map((interest, i) => (
                        <Badge key={i} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity — real data from user_progress (previously defined in type + API but never rendered) */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest learning actions pulled directly from your progress records.</CardDescription>
                </CardHeader>
                <CardContent>
                  {userProfile.recentActivity && userProfile.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {userProfile.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{activity.action} · {activity.title}</div>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0 tabular-nums ml-3">
                            {activity.timestamp}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No recent activity yet. Start exploring or completing lessons to see your history here.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Learning Path Snapshot — strictly real data from learning_paths table or clean placeholder */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                      <Lightbulb className="h-5 w-5" />
                      Learning Path
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/learning')}
                      className="gap-1.5"
                    >
                      View Full <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <CardDescription>
                    Your current personalized path from Discover activity. Real data only.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProfile.activeLearningPath && userProfile.activeLearningPath.title ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {userProfile.activeLearningPath.title}
                        </h4>
                        {userProfile.activeLearningPath.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {userProfile.activeLearningPath.description}
                          </p>
                        )}
                      </div>

                      {userProfile.activeLearningPath.steps && userProfile.activeLearningPath.steps.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          {userProfile.activeLearningPath.steps.map((step, index) => (
                            <div
                              key={index}
                              className="flex gap-3 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 transition-all hover:border-zinc-200 dark:hover:border-zinc-700"
                            >
                              <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">
                                {index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                                  {step.title}
                                </div>
                                {step.estimatedTime && (
                                  <Badge variant="outline" className="text-[10px] mt-1.5 px-1.5 py-0 h-4">
                                    {step.estimatedTime}
                                  </Badge>
                                )}
                                {step.description && (
                                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{step.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Path steps will appear here when generated.</p>
                      )}

                      {userProfile.activeLearningPath.updatedAt && (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                          Updated {new Date(userProfile.activeLearningPath.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        No learning path yet. Generate one from your saved searches on the Learning page.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => router.push('/learning')}>
                        Go to Learning
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subject / Category Progress — real from RPC on user_progress + content. Guarded for empty. */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Subject Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userProfile.categoryProgress && userProfile.categoryProgress.length > 0 ? (
                    userProfile.categoryProgress.map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                          <span>{cat.category}</span>
                          <span className="font-medium">{cat.progress}%</span>
                        </div>
                        <Progress value={cat.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{cat.completed}/{cat.total} completed</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      Subject progress will appear here as you complete lessons across categories.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-8">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing && (
                    <>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                        </div>
                        <div>
                          <Label htmlFor="gradeLevel">Grade Level</Label>
                          <Input id="gradeLevel" value={formData.gradeLevel} onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="interests">Interests (comma separated)</Label>
                        <Input id="interests" value={formData.interests} onChange={(e) => setFormData({...formData, interests: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="goals">Learning Goals</Label>
                        <Textarea id="goals" value={formData.learningGoals} onChange={(e) => setFormData({...formData, learningGoals: e.target.value})} />
                      </div>
                      <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 w-full md:w-auto">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card className="border-0 shadow-sm mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input type="password" placeholder="Current password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                  <Input type="password" placeholder="New password" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                  <Input type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                  <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full md:w-auto">
                    {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab — real earned records from user_achievements joined with definitions for full wall view (locked shown as coming goals) */}
            <TabsContent value="achievements" className="mt-8">
              {(() => {
                const definitions = userProfile.achievementDefinitions || []
                const earnedList = userProfile.achievements || []

                // Build earned map for quick lookup (prefer type, fallback to title for legacy data)
                const earnedMap = new Map<string, { earnedAt: string; icon?: string }>()
                earnedList.forEach((ach) => {
                  const key = ach.type || ach.title
                  if (key) earnedMap.set(key, { earnedAt: ach.earnedAt, icon: ach.icon })
                })

                const total = definitions.length || earnedList.length
                const earnedCount = earnedList.length

                if (definitions.length === 0 && earnedList.length === 0) {
                  return (
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                      <CardContent className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                        Complete lessons and challenges to unlock achievements. Your wall will grow here.
                      </CardContent>
                    </Card>
                  )
                }

                const allItems = definitions.length > 0
                  ? definitions.map((def) => {
                      const earned = earnedMap.get(def.type) || earnedMap.get(def.title)
                      return {
                        ...def,
                        isEarned: !!earned,
                        earnedAt: earned?.earnedAt,
                        displayIcon: earned?.icon || def.icon,
                      }
                    })
                  : earnedList.map((ach) => ({
                      type: ach.type || ach.title,
                      title: ach.title,
                      description: ach.description,
                      icon: ach.icon,
                      isEarned: true,
                      earnedAt: ach.earnedAt,
                      displayIcon: ach.icon,
                    }))

                // Sort: earned first, then locked (maintain definition order otherwise)
                const sortedItems = [...allItems].sort((a, b) => {
                  if (a.isEarned && !b.isEarned) return -1
                  if (!a.isEarned && b.isEarned) return 1
                  return 0
                })

                return (
                  <>
                    {/* Wall header with progress */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Achievements Wall</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {earnedCount} of {total} unlocked • Real milestones from your journey
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <Badge variant="secondary" className="text-xs px-3 py-1">
                          {earnedCount}/{total}
                        </Badge>
                      </div>
                    </div>

                    {/* Beautiful grid with subtle motion */}
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {sortedItems.map((item, idx) => {
                        const key = item.type || item.title || idx
                        const isEarned = item.isEarned

                        return (
                          <div
                            key={key}
                            className={[
                              'group rounded-3xl border p-5 transition-all',
                              isEarned
                                ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-200 dark:hover:border-amber-900/50 hover:shadow-sm'
                                : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 hover:border-zinc-200 dark:hover:border-zinc-700',
                            ].join(' ')}
                          >
                            <div className="flex items-start gap-4">
                              {/* Icon area — emoji for personality or fallback */}
                              <div
                                className={[
                                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-105',
                                  isEarned
                                    ? 'bg-amber-100/70 dark:bg-amber-950/60'
                                    : 'bg-zinc-200/60 dark:bg-zinc-800/60 grayscale-[0.6]',
                                ].join(' ')}
                              >
                                {item.displayIcon || (isEarned ? '🏆' : '🔒')}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={['font-semibold truncate', isEarned ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'].join(' ')}>
                                    {item.title}
                                  </h4>
                                  {isEarned ? (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-px bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0">
                                      Earned
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-px text-zinc-500 border-zinc-300 dark:border-zinc-700">
                                      <Lock className="h-3 w-3 mr-1" /> Locked
                                    </Badge>
                                  )}
                                </div>

                                <p className={['text-sm mt-1 leading-snug', isEarned ? 'text-muted-foreground' : 'text-muted-foreground/70'].join(' ')}>
                                  {item.description}
                                </p>

                                {isEarned && item.earnedAt && (
                                  <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-500 font-medium">
                                    Earned {item.earnedAt}
                                  </p>
                                )}
                                {!isEarned && (
                                  <p className="text-xs mt-2 text-zinc-400 dark:text-zinc-500 italic">
                                    Keep learning to unlock
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {earnedCount === 0 && (
                      <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-6">
                        Start completing modules in the Learning section to earn your first achievement.
                      </p>
                    )}
                  </>
                )
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}