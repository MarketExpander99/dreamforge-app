"use client"

import { Navigation } from '@/components/navigation'
import { User, Settings, BookOpen, Trophy, Calendar, Edit, Save, Camera, Key, Loader2, CreditCard, History } from 'lucide-react'
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">Please try logging in again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={userProfile.avatar} />
                        <AvatarFallback className="text-2xl">
                          {userProfile.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
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

                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-1">{userProfile.fullName}</h1>
                      <p className="text-muted-foreground mb-4">{userProfile.email}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{userProfile.gradeLevel}</Badge>
                        {userProfile.interests.map((interest) => (
                          <Badge key={interest} variant="outline">{interest}</Badge>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
                <TabsTrigger value="credits">Credits</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{userProfile.bio || 'No bio yet.'}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Learning Path Tab */}
              <TabsContent value="learning-path" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Personalized Learning Path</CardTitle>
                    <CardDescription>Built from your saved queries and goals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Your learning path is dynamically generated based on saved queries, interests, and goals.
                      </p>
                      {/* Placeholder for future learning path builder integration */}
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm">📍 Next recommended module: Advanced React Patterns</p>
                        <p className="text-xs text-muted-foreground mt-1">Based on your recent queries</p>
                      </div>
                      <Progress value={65} className="h-3" />
                      <p className="text-xs text-muted-foreground">65% complete • 8 modules remaining</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Credits Tab */}
              <TabsContent value="credits" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Free Credits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-600">{creditsData.freeCreditsRemaining}</div>
                      <p className="text-sm text-muted-foreground">remaining today • resets {creditsData.dailyFreeReset}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Paid Credits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">{creditsData.paidCredits}</div>
                      <p className="text-sm text-muted-foreground">available • no expiry</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Purchase History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {purchaseHistory.map((purchase) => (
                        <div key={purchase.id} className="flex justify-between items-center border-b pb-3 last:border-none">
                          <div>
                            <p className="font-medium">{purchase.type}</p>
                            <p className="text-xs text-muted-foreground">{purchase.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">+{purchase.amount}</p>
                            <p className="text-xs text-muted-foreground">{purchase.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Username / Display Name */}
                    <div className="space-y-2">
                      <Label>Username / Display Name</Label>
                      <Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} />
                    </div>

                    {/* Password Change */}
                    <div className="space-y-4">
                      <Label className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Change Password
                      </Label>
                      <Input
                        type="password"
                        placeholder="Current password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                      <Input
                        type="password"
                        placeholder="New password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                      <Button onClick={handleChangePassword} disabled={changingPassword} className="w-full md:w-auto">
                        {changingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {isEditing && (
              <div className="fixed bottom-6 right-6">
                <Button onClick={handleSaveProfile} disabled={saving}>
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