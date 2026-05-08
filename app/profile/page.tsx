"use client"

import { Navigation } from '@/components/navigation'
import { User, Settings, BookOpen, Trophy, Calendar, Edit, Save, Camera, Key, Mail, Loader2, Bell, BellOff } from 'lucide-react'
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
import { usePushNotifications, getNotificationPreferences, updateNotificationPreferences } from '@/lib/push-notifications'

interface UserProfile {
  id: string
  fullName: string
  publicName: string
  displayName: string | null
  anonymousId: string
  email: string
  avatar: string
  bio: string
  gradeLevel: string
  interests: string[]
  learningGoals: string
  role: string
  parentConsentGiven: boolean
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
  const [changingEmail, setChangingEmail] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
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

  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: ''
  })

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    achievements: true,
    progress: true,
    streaks: true,
    nudges: true,
    familyUpdates: true
  })
  const [savingNotifications, setSavingNotifications] = useState(false)

  // Display name state
  const [displayNameData, setDisplayNameData] = useState({
    displayName: '',
    parentEmail: ''
  })
  const [savingDisplayName, setSavingDisplayName] = useState(false)
  const [parentConsentGiven, setParentConsentGiven] = useState(false)

  // Handle profile save
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

      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        fullName: formData.fullName,
        bio: formData.bio,
        gradeLevel: formData.gradeLevel,
        interests: formData.interests ? formData.interests.split(',').map(i => i.trim()) : [],
        learningGoals: formData.learningGoals
      } : null)

      setIsEditing(false)
      // Could add a success toast here
    } catch (error) {
      console.error('Error saving profile:', error)
      // Could add an error toast here
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
          email: data.email,
          bio: data.bio || '',
          gradeLevel: data.gradeLevel,
          interests: data.interests.join(', '),
          learningGoals: data.learningGoals || ''
        })
      } else {
        console.error('Failed to load profile')
        // Create fallback profile data
        const fallbackProfile: UserProfile = {
          id: user?.id || '',
          fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          publicName: 'Anonymous User',
          displayName: null,
          anonymousId: 'User_00000',
          email: user?.email || '',
          avatar: user?.user_metadata?.avatar_url || '',
          bio: 'Welcome to Skill Gain! Start your learning journey today.',
          gradeLevel: 'Not specified',
          interests: [],
          learningGoals: 'Explore and learn new skills',
          role: 'student',
          parentConsentGiven: false,
          joinDate: new Date().toLocaleDateString(),
          totalLearningTime: 0,
          completedModules: 0,
          currentStreak: 0,
          achievementsCount: 0,
          recentActivity: [],
          achievements: [],
          categoryProgress: []
        }
        setUserProfile(fallbackProfile)
        setFormData({
          fullName: fallbackProfile.fullName,
          email: fallbackProfile.email,
          bio: fallbackProfile.bio,
          gradeLevel: fallbackProfile.gradeLevel,
          interests: '',
          learningGoals: fallbackProfile.learningGoals
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Create fallback profile data
      const fallbackProfile: UserProfile = {
        id: user?.id || '',
        fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
        publicName: 'Anonymous User',
        displayName: null,
        anonymousId: 'User_00000',
        email: user?.email || '',
        avatar: user?.user_metadata?.avatar_url || '',
        bio: 'Welcome to Skill Gain! Start your learning journey today.',
        gradeLevel: 'Not specified',
        interests: [],
        learningGoals: 'Explore and learn new skills',
        role: 'student',
        parentConsentGiven: false,
        joinDate: new Date().toLocaleDateString(),
        totalLearningTime: 0,
        completedModules: 0,
        currentStreak: 0,
        achievementsCount: 0,
        recentActivity: [],
        achievements: [],
        categoryProgress: []
      }
      setUserProfile(fallbackProfile)
      setFormData({
        fullName: fallbackProfile.fullName,
        email: fallbackProfile.email,
        bio: fallbackProfile.bio,
        gradeLevel: fallbackProfile.gradeLevel,
        interests: '',
        learningGoals: fallbackProfile.learningGoals
      })
    } finally {
      setLoading(false)
    }
  }

  // Check authentication and fetch user profile data
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.push('/auth/login')
        return
      }
      // User is authenticated, fetch profile
      fetchProfile()

      // Fetch notification preferences
      getNotificationPreferences(user.id).then((prefs) => {
        setNotificationPrefs(prefs)
      }).catch((error) => {
        console.error('Failed to load notification preferences:', error)
      })
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
        const data = await response.json()
        alert('Avatar updated successfully')
        fetchProfile() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload avatar')
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (response.ok) {
        alert('Password changed successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleChangeEmail = async () => {
    setChangingEmail(true)
    try {
      const response = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        setEmailData({ newEmail: '', password: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to change email')
      }
    } catch (error) {
      console.error('Error changing email:', error)
      alert('Failed to change email')
    } finally {
      setChangingEmail(false)
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

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
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
                        {uploadingAvatar ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
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
                      <h1 className="text-2xl font-bold mb-2">{userProfile.fullName}</h1>
                      <p className="text-muted-foreground mb-3">{userProfile.email}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">{userProfile.gradeLevel}</Badge>
                        {userProfile.interests.map((interest) => (
                          <Badge key={interest} variant="outline">{interest}</Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Member since {userProfile.joinDate}
                      </p>
                    </div>

                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Learning Time</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userProfile.totalLearningTime}</div>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userProfile.completedModules}</div>
                  <p className="text-xs text-muted-foreground">modules</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userProfile.currentStreak}</div>
                  <p className="text-xs text-muted-foreground">days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userProfile.achievementsCount}</div>
                  <p className="text-xs text-muted-foreground">unlocked</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Bio Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>About Me</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{userProfile.bio}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Learning Goals:</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{userProfile.learningGoals}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your latest learning activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userProfile.recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center gap-3">
                            <div className="h-2 w-2 bg-primary rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">{activity.action}</span> {activity.title}
                              </p>
                              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Learning Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Progress</CardTitle>
                    <CardDescription>Track your progress across different subjects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { subject: 'Science', progress: 75, completed: 8, total: 12 },
                        { subject: 'History', progress: 60, completed: 6, total: 10 },
                        { subject: 'Geography', progress: 40, completed: 4, total: 8 },
                        { subject: 'Mathematics', progress: 25, completed: 2, total: 8 },
                      ].map((subject) => (
                        <div key={subject.subject} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{subject.subject}</span>
                            <span className="text-muted-foreground">
                              {subject.completed}/{subject.total} completed
                            </span>
                          </div>
                          <Progress value={subject.progress} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="gradeLevel">Grade Level</Label>
                        <Input
                          id="gradeLevel"
                          value={formData.gradeLevel}
                          onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interests">Interests</Label>
                        <Input
                          id="interests"
                          value={formData.interests}
                          onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="learningGoals">Learning Goals</Label>
                      <Textarea
                        id="learningGoals"
                        placeholder="What do you want to learn?"
                        value={formData.learningGoals}
                        onChange={(e) => setFormData(prev => ({ ...prev, learningGoals: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <Button onClick={handleSaveProfile} loading={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Push Notifications */}
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Push Notifications
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Achievement Unlocks</p>
                            <p className="text-xs text-muted-foreground">Get notified when you earn new achievements</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotificationPrefs(prev => ({ ...prev, achievements: !prev.achievements }))}
                          >
                            {notificationPrefs.achievements ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Progress Milestones</p>
                            <p className="text-xs text-muted-foreground">Notifications for completed lessons and modules</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotificationPrefs(prev => ({ ...prev, progress: !prev.progress }))}
                          >
                            {notificationPrefs.progress ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Streak Reminders</p>
                            <p className="text-xs text-muted-foreground">Daily reminders to maintain your learning streak</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotificationPrefs(prev => ({ ...prev, streaks: !prev.streaks }))}
                          >
                            {notificationPrefs.streaks ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Learning Nudges</p>
                            <p className="text-xs text-muted-foreground">Gentle reminders when you haven't learned for a few days</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotificationPrefs(prev => ({ ...prev, nudges: !prev.nudges }))}
                          >
                            {notificationPrefs.nudges ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Family Updates</p>
                            <p className="text-xs text-muted-foreground">Notifications about family member progress (for parents)</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotificationPrefs(prev => ({ ...prev, familyUpdates: !prev.familyUpdates }))}
                          >
                            {notificationPrefs.familyUpdates ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={async () => {
                          if (!user?.id) return
                          setSavingNotifications(true)
                          try {
                            await updateNotificationPreferences(user.id, notificationPrefs)
                            alert('Notification preferences saved!')
                          } catch (error) {
                            console.error('Failed to save notification preferences:', error)
                            alert('Failed to save preferences')
                          } finally {
                            setSavingNotifications(false)
                          }
                        }}
                        loading={savingNotifications}
                        className="mt-4"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Email Notifications</h4>
                          <p className="text-sm text-muted-foreground">Receive updates about your learning progress</p>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Privacy & Display Name
                      </h4>

                      {/* Current Public Name Display */}
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Public Name</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{userProfile.publicName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          This is how you appear to other users in comments, leaderboards, and activity feeds.
                        </p>
                      </div>

                      {/* Display Name Input */}
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="displayName">Display Name (Optional)</Label>
                          <Input
                            id="displayName"
                            placeholder="Choose how you want to be known publicly"
                            value={displayNameData.displayName}
                            onChange={(e) => setDisplayNameData(prev => ({ ...prev, displayName: e.target.value }))}
                            maxLength={50}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Choose a display name or leave blank to use your anonymous ID. Display names are public.
                          </p>
                        </div>

                        {/* Parent Consent for Students */}
                        {userProfile.role === 'student' && !userProfile.parentConsentGiven && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                              Parent/Guardian Consent Required
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                              As a student, you need parent or guardian consent to set a display name.
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
                              <Input
                                id="parentEmail"
                                type="email"
                                placeholder="parent@example.com"
                                value={displayNameData.parentEmail}
                                onChange={(e) => setDisplayNameData(prev => ({ ...prev, parentEmail: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (!displayNameData.parentEmail) {
                                    alert('Please enter a parent email address');
                                    return;
                                  }
                                  try {
                                    const response = await fetch('/api/profile/display-name', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        consentGiven: true,
                                        parentEmail: displayNameData.parentEmail
                                      })
                                    });
                                    if (response.ok) {
                                      setParentConsentGiven(true);
                                      setUserProfile(prev => prev ? { ...prev, parentConsentGiven: true } : null);
                                      alert('Consent request sent! Please ask your parent to approve.');
                                    } else {
                                      const error = await response.json();
                                      alert(error.error || 'Failed to send consent request');
                                    }
                                  } catch (error) {
                                    console.error('Error sending consent:', error);
                                    alert('Failed to send consent request');
                                  }
                                }}
                              >
                                Request Parent Consent
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Save Display Name Button */}
                        <Button
                          onClick={async () => {
                            setSavingDisplayName(true);
                            try {
                              const response = await fetch('/api/profile/display-name', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ displayName: displayNameData.displayName || null })
                              });

                              if (response.ok) {
                                const data = await response.json();
                                setUserProfile(prev => prev ? {
                                  ...prev,
                                  displayName: data.displayName,
                                  publicName: data.publicName
                                } : null);
                                alert('Display name updated successfully!');
                              } else {
                                const error = await response.json();
                                alert(error.error || 'Failed to update display name');
                              }
                            } catch (error) {
                              console.error('Error updating display name:', error);
                              alert('Failed to update display name');
                            } finally {
                              setSavingDisplayName(false);
                            }
                          }}
                          loading={savingDisplayName}
                          disabled={userProfile.role === 'student' && !userProfile.parentConsentGiven}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Update Display Name
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Change Password</h4>
                        <p className="text-sm text-muted-foreground">Update your account password</p>
                      </div>
                      <Button variant="outline" size="sm">Change</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-xl font-semibold">Your Achievements</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userProfile.achievements.map((achievement) => (
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
                            <Trophy className="h-4 w-4" />
                            <span>Earned {achievement.earnedAt}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}