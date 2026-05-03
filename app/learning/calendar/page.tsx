import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Flame, BookOpen, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function LearningCalendarPage() {
  // Mock data - in real app, this would come from database
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const calendarDays = [
    // Previous month days (grayed out)
    { day: 28, month: 'prev', activities: [] },
    { day: 29, month: 'prev', activities: [] },
    { day: 30, month: 'prev', activities: [] },
    { day: 31, month: 'prev', activities: [] },
    // Current month days
    { day: 1, month: 'current', activities: [{ type: 'learning', title: 'Completed "Photosynthesis Basics"' }] },
    { day: 2, month: 'current', activities: [{ type: 'streak', title: '5-day learning streak!' }] },
    { day: 3, month: 'current', activities: [{ type: 'achievement', title: 'Earned "Science Explorer" badge' }] },
    { day: 4, month: 'current', activities: [] },
    { day: 5, month: 'current', activities: [{ type: 'learning', title: 'Started "Ancient Rome History"' }] },
    { day: 6, month: 'current', activities: [] },
    { day: 7, month: 'current', activities: [] },
    { day: 8, month: 'current', activities: [] },
    { day: 9, month: 'current', activities: [] },
    { day: 10, month: 'current', activities: [] },
    { day: 11, month: 'current', activities: [] },
    { day: 12, month: 'current', activities: [] },
    { day: 13, month: 'current', activities: [] },
    { day: 14, month: 'current', activities: [] },
    { day: 15, month: 'current', activities: [] },
    { day: 16, month: 'current', activities: [] },
    { day: 17, month: 'current', activities: [] },
    { day: 18, month: 'current', activities: [] },
    { day: 19, month: 'current', activities: [] },
    { day: 20, month: 'current', activities: [] },
    { day: 21, month: 'current', activities: [] },
    { day: 22, month: 'current', activities: [] },
    { day: 23, month: 'current', activities: [] },
    { day: 24, month: 'current', activities: [] },
    { day: 25, month: 'current', activities: [] },
    { day: 26, month: 'current', activities: [] },
    { day: 27, month: 'current', activities: [] },
    { day: 28, month: 'current', activities: [] },
    { day: 29, month: 'current', activities: [] },
    { day: 30, month: 'current', activities: [] },
    { day: 31, month: 'current', activities: [] },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'learning':
        return <BookOpen className="h-3 w-3" />
      case 'streak':
        return <Flame className="h-3 w-3" />
      case 'achievement':
        return <Trophy className="h-3 w-3" />
      default:
        return <BookOpen className="h-3 w-3" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'learning':
        return 'bg-blue-100 text-blue-800'
      case 'streak':
        return 'bg-orange-100 text-orange-800'
      case 'achievement':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Learning Calendar</h1>
                  <p className="text-muted-foreground">
                    Track your daily learning activities and maintain your streak
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/learning">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Learning
                  </Link>
                </Button>
              </div>
            </div>

            {/* Calendar Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {currentMonth}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Calendar Grid */}
            <Card>
              <CardContent className="p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`min-h-[120px] border rounded-lg p-2 ${
                        day.month === 'prev' ? 'bg-gray-50 text-gray-400' : 'bg-white'
                      }`}
                    >
                      <div className="text-sm font-medium mb-2">{day.day}</div>
                      <div className="space-y-1">
                        {day.activities.map((activity, activityIndex) => (
                          <Badge
                            key={activityIndex}
                            variant="secondary"
                            className={`text-xs flex items-center gap-1 w-full justify-start ${getActivityColor(activity.type)}`}
                          >
                            {getActivityIcon(activity.type)}
                            <span className="truncate">{activity.title}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Activity Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Learning
                    </Badge>
                    <span className="text-sm text-muted-foreground">Completed learning modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800">
                      <Flame className="h-3 w-3 mr-1" />
                      Streak
                    </Badge>
                    <span className="text-sm text-muted-foreground">Consecutive learning days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Trophy className="h-3 w-3 mr-1" />
                      Achievement
                    </Badge>
                    <span className="text-sm text-muted-foreground">Unlocked badges and milestones</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}