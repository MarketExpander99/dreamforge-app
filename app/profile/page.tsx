"use client"

import { Edit, Save, Camera, Key, Loader2, Trophy, BookOpen, Settings, Calendar, Target, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  recentActivity?: Array<{
    id: string
    action: string
    title: string
    timestamp: string
  }>
  achievements?: Array<{
    id: string
    title: string
    description: string
    icon: string
    earnedAt: string
  }>
  categoryProgress?: Array<{
    category: string
    progress: number
    completed: number
    total: number
  }>
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
          fullName: data.fullName || '',
          bio: data.bio || '',
          gradeLevel: data.gradeLevel || '',
          interests: data.interests?.join(', ') || '',
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
        await fetchProfile()
      } else {
        alert('Failed to upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar')
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

  const hasAchievements = userProfile.achievements && userProfile.achievements.length > 0
  const hasRecentActivity = userProfile.recentActivity && userProfile.recentActivity.length > 0

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="py-8 px-5 md:px-8 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto">

          {/* Hero Header */}
          <div className="mb-8">
            <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl">
              <CardContent className="p-6 md:p-7">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                  <div className="relative group">
                    <Avatar className="h-28 w-28 border-[3px] border-white dark:border-zinc-800 shadow">
                      <AvatarImage src={userProfile.avatar} alt={userProfile.fullName} />
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-amber-400 to-emerald-500 text-white">
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
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {userProfile.fullName}
                          </h1>
                          <Badge variant="secondary" className="text-sm px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-0">
                            Level {userProfile.currentLevel ?? 1}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{userProfile.email}</p>
                      </div>
                      <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="gap-2 shrink-0">
                        <Edit className="h-4 w-4" />
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>

                    {/* Quick Stats - Real Data */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-center border border-zinc-100 dark:border-zinc-800">
                        <div className="text-2xl font-semibold text-emerald-600 tabular-nums">{userProfile.currentStreak}</div>
                        <p className="text-[10px] uppercase tracking-[1px] text-muted-foreground mt-0.5">Day Streak</p>
                      </div>
                      <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-center border border-zinc-100 dark:border-zinc-800">
                        <div className="text-2xl font-semibold text-blue-600 tabular-nums">
                          {Math.floor((userProfile.totalLearningTime || 0) / 60)}h
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
                <BookOpen className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Settings
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Achievements
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-8 space-y-8">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Bio & Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-muted-foreground">{userProfile.bio || 'No bio yet.'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Learning Goals</Label>
                    <p className="mt-2">{userProfile.learningGoals || 'No goals set yet.'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Interests</Label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {userProfile.interests?.map((interest, i) => (
                        <Badge key={i} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasRecentActivity ? (
                    <div className="space-y-3">
                      {userProfile.recentActivity!.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between border border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-3">
                          <div className="font-medium text-sm">{activity.action} · {activity.title}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">{activity.timestamp}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No recent activity yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="mt-8 space-y-8">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} disabled={!isEditing} />
                    </div>
                    <div>
                      <Label>Grade Level</Label>
                      <Input value={formData.gradeLevel} onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })} disabled={!isEditing} />
                    </div>
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} disabled={!isEditing} />
                  </div>

                  <div>
                    <Label>Interests (comma separated)</Label>
                    <Input value={formData.interests} onChange={(e) => setFormData({ ...formData, interests: e.target.value })} disabled={!isEditing} />
                  </div>

                  <div>
                    <Label>Learning Goals</Label>
                    <Textarea value={formData.learningGoals} onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })} disabled={!isEditing} />
                  </div>

                  {isEditing && (
                    <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input type="password" placeholder="Current password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                  <Input type="password" placeholder="New password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                  <Input type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                  <Button onClick={handleChangePassword} disabled={changingPassword}>
                    {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements */}
            <TabsContent value="achievements" className="mt-8">
              <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                  <CardDescription>
                    {userProfile.achievementsCount} earned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasAchievements ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {userProfile.achievements!.map((ach) => (
                        <div key={ach.id} className="flex gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                          <div className="text-3xl mt-1">{ach.icon || '🏆'}</div>
                          <div>
                            <h4 className="font-semibold">{ach.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{ach.description}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2 font-medium">Earned {ach.earnedAt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      Complete lessons and challenges to earn your first achievement.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}