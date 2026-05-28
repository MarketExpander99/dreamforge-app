"use client"

import { User, Settings, BookOpen, Trophy, Calendar, Edit, Save, Camera, Key, Loader2, CreditCard, History, Sparkles } from 'lucide-react'
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
  achievementsCount: number
  recentActivity: Array<{
    id: string
    action: string
    title: string
    timestamp: string
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    earnedAt: string
  }>
  categoryProgress: Array<{
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

  // Mock credits data (safe - no schema change)
  const [creditsData] = useState({
    freeCreditsRemaining: 5,
    paidCredits: 42,
    dailyFreeReset: 'tomorrow'
  })

  const [purchaseHistory] = useState([
    {
      id: '1',
      date: '2025-05-20',
      type: 'Paid Credits',
      amount: 100,
      price: '$9.99'
    },
    {
      id: '2',
      date: '2025-05-10',
      type: 'Free Daily',
      amount: 10,
      price: 'Free'
    }
  ])

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
          {/* Gorgeous Header */}
          <div className="mb-10">
            <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
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

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                          {userProfile.fullName}
                          <Sparkles className="h-6 w-6 text-amber-500" />
                        </h1>
                        <p className="text-muted-foreground">{userProfile.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-6 mt-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600">{userProfile.currentStreak}</div>
                        <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-600">{userProfile.completedModules}</div>
                        <p className="text-xs text-muted-foreground">Modules Completed</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{userProfile.achievementsCount}</div>
                        <p className="text-xs text-muted-foreground">Achievements</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-zinc-900 border-0 shadow-sm">
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
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credits
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

              {/* Category Progress */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Subject Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userProfile.categoryProgress.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{cat.category}</span>
                        <span className="font-medium">{cat.progress}%</span>
                      </div>
                      <Progress value={cat.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{cat.completed}/{cat.total} completed</p>
                    </div>
                  ))}
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

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-8">
              <div className="grid gap-6 md:grid-cols-2">
                {userProfile.achievements.map((ach) => (
                  <Card key={ach.id} className="border-0 shadow-sm">
                    <CardContent className="p-6 flex gap-4">
                      <Trophy className="h-10 w-10 text-amber-500 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{ach.title}</h4>
                        <p className="text-sm text-muted-foreground">{ach.description}</p>
                        <p className="text-xs mt-2 text-emerald-600">Earned {ach.earnedAt}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits" className="mt-8">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Credits &amp; History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <p className="text-sm text-muted-foreground">Free Credits Remaining</p>
                      <p className="text-5xl font-bold text-emerald-600">{creditsData.freeCreditsRemaining}</p>
                      <p className="text-xs">Resets {creditsData.dailyFreeReset}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Credits</p>
                      <p className="text-5xl font-bold">{creditsData.paidCredits}</p>
                    </div>
                  </div>
                  <h4 className="font-medium mb-4 flex items-center gap-2"><History className="h-4 w-4" />Purchase History</h4>
                  <div className="space-y-4">
                    {purchaseHistory.map(item => (
                      <div key={item.id} className="flex justify-between border-b pb-4">
                        <div>
                          <p className="font-medium">{item.type}</p>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">+{item.amount}</p>
                          <p className="text-xs text-muted-foreground">{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}