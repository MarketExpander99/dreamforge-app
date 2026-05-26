"use client"

import { Navigation } from '@/components/navigation'
import { User, Settings, Trophy, Edit, Save, Camera, Key, Loader2 } from 'lucide-react'
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
        alert('Avatar updated successfully')
        fetchProfile()
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-8 px-4 md:px-8 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <Card className="overflow-hidden border-0 shadow-sm bg-white dark:bg-zinc-900">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-28 w-28 ring-2 ring-zinc-100 dark:ring-zinc-800">
                        <AvatarImage src={userProfile.avatar} />
                        <AvatarFallback className="text-3xl font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {userProfile.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full p-0 shadow-sm hover:shadow"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h1 className="text-3xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-100 mb-1">{userProfile.fullName}</h1>
                      <p className="text-zinc-500 dark:text-zinc-400 mb-4 text-base">{userProfile.email}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="font-medium px-3 py-1 text-sm">{userProfile.gradeLevel}</Badge>
                        {userProfile.interests.map((interest) => (
                          <Badge key={interest} variant="outline" className="font-medium px-3 py-1 text-sm">{interest}</Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(!isEditing)}
                      className="shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <TabsTrigger value="overview" className="rounded-xl data-[state=active]:shadow-sm font-medium">Overview</TabsTrigger>
                <TabsTrigger value="achievements" className="rounded-xl data-[state=active]:shadow-sm font-medium">Achievements</TabsTrigger>
                <TabsTrigger value="settings" className="rounded-xl data-[state=active]:shadow-sm font-medium">Settings</TabsTrigger>
              </TabsList>

              {/* Overview Tab - fully connected */}
              <TabsContent value="overview" className="space-y-6">
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold tracking-tight">About Me</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {userProfile.bio || 'No bio yet. Tell the community a bit about yourself!'}
                    </p>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold tracking-tight">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userProfile.recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {userProfile.recentActivity.map((activity) => (
                          <div key={activity.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{activity.action} • {activity.title}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{activity.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 dark:text-zinc-400">No recent activity yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Category Progress */}
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold tracking-tight">Subject Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {userProfile.categoryProgress.map((cat) => (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{cat.category}</span>
                          <span className="text-zinc-500">{cat.completed}/{cat.total}</span>
                        </div>
                        <Progress value={cat.progress} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Tab - fully connected */}
              <TabsContent value="achievements" className="space-y-6">
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Your Achievements ({userProfile.achievementsCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userProfile.achievements.map((ach) => (
                        <div key={ach.id} className="text-center">
                          <div className="text-4xl mb-2">{ach.icon}</div>
                          <p className="font-semibold text-sm">{ach.title}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{ach.earnedAt}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold tracking-tight">Account Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Profile editing fields */}
                    <div className="space-y-3">
                      <Label>Display Name</Label>
                      <Input 
                        value={formData.fullName} 
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} 
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>Bio</Label>
                      <Textarea 
                        value={formData.bio} 
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} 
                      />
                    </div>
                    {/* Password change */}
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Change Password
                      </Label>
                      <Input type="password" placeholder="Current password" value={passwordData.currentPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))} />
                      <Input type="password" placeholder="New password" value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} />
                      <Input type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} />
                      <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full md:w-auto">
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {isEditing && (
              <div className="fixed bottom-8 right-8 z-50">
                <Button onClick={handleSaveProfile} disabled={saving} size="lg" className="shadow-lg hover:shadow-xl transition-shadow font-medium">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Changes
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}