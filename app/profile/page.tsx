import { Navigation } from '@/components/navigation'
import { User, Settings, BookOpen, Trophy, Calendar, Edit, Save, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

export default function ProfilePage() {
  // Mock user data - in real app this would come from database
  const userProfile = {
    id: '1',
    fullName: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: '',
    bio: 'Passionate learner exploring the wonders of science and history. Always curious about how things work!',
    gradeLevel: '8th Grade',
    interests: ['Science', 'History', 'Technology'],
    learningGoals: 'To master advanced mathematics and explore computer programming',
    joinDate: 'January 2024',
    totalLearningTime: 240,
    completedModules: 12,
    currentStreak: 5,
    achievements: 3
  }

  const recentActivity = [
    { id: '1', action: 'Completed', title: 'How Photosynthesis Works', timestamp: '2 hours ago' },
    { id: '2', action: 'Started', title: 'Ancient Rome Quiz', timestamp: '1 day ago' },
    { id: '3', action: 'Bookmarked', title: 'Geography: Understanding Maps', timestamp: '3 days ago' },
  ]

  const achievements = [
    { id: '1', title: 'First Steps', description: 'Completed your first learning module', icon: '🎯', earnedAt: '2 weeks ago' },
    { id: '2', title: 'Knowledge Seeker', description: 'Read 10 different topics', icon: '📚', earnedAt: '1 week ago' },
    { id: '3', title: 'Quiz Master', description: 'Scored 100% on 5 quizzes', icon: '🏆', earnedAt: '3 days ago' },
  ]

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
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
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
                  <div className="text-2xl font-bold">{userProfile.achievements}</div>
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
                        {recentActivity.map((activity) => (
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
                        <Input id="fullName" defaultValue={userProfile.fullName} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={userProfile.email} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        defaultValue={userProfile.bio}
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="gradeLevel">Grade Level</Label>
                        <Input id="gradeLevel" defaultValue={userProfile.gradeLevel} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interests">Interests</Label>
                        <Input id="interests" defaultValue={userProfile.interests.join(', ')} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="learningGoals">Learning Goals</Label>
                      <Textarea
                        id="learningGoals"
                        placeholder="What do you want to learn?"
                        defaultValue={userProfile.learningGoals}
                        rows={2}
                      />
                    </div>

                    <Button>
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
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">Receive updates about your learning progress</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Privacy Settings</h4>
                        <p className="text-sm text-muted-foreground">Control who can see your profile and activity</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
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
                    {achievements.map((achievement) => (
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