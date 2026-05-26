"use client"

import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Search,
  Filter,
  UserCheck,
  Mail,
  Calendar,
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

export default function StudentsPage() {
  // Mock data - in real app, this would come from database
  const students = [
    {
      id: 1,
      name: 'Emma Johnson',
      email: 'emma.johnson@student.school.edu',
      grade: 'Grade 10',
      classes: ['Biology', 'Chemistry'],
      progress: 87,
      lastActive: '2 hours ago',
      status: 'active',
      assignmentsCompleted: 24,
      avgScore: 92
    },
    {
      id: 2,
      name: 'Liam Chen',
      email: 'liam.chen@student.school.edu',
      grade: 'Grade 9',
      classes: ['Mathematics', 'Physics'],
      progress: 94,
      lastActive: '1 day ago',
      status: 'active',
      assignmentsCompleted: 31,
      avgScore: 96
    },
    {
      id: 3,
      name: 'Sophia Rodriguez',
      email: 'sophia.rodriguez@student.school.edu',
      grade: 'Grade 11',
      classes: ['English Literature', 'History'],
      progress: 76,
      lastActive: '3 days ago',
      status: 'at-risk',
      assignmentsCompleted: 18,
      avgScore: 78
    },
    {
      id: 4,
      name: 'Noah Kim',
      email: 'noah.kim@student.school.edu',
      grade: 'Grade 8',
      classes: ['Geography', 'Computer Science'],
      progress: 91,
      lastActive: '5 hours ago',
      status: 'active',
      assignmentsCompleted: 27,
      avgScore: 89
    },
    {
      id: 5,
      name: 'Olivia Thompson',
      email: 'olivia.thompson@student.school.edu',
      grade: 'Grade 10',
      classes: ['Biology', 'Chemistry'],
      progress: 68,
      lastActive: '1 week ago',
      status: 'inactive',
      assignmentsCompleted: 15,
      avgScore: 72
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'at-risk':
        return <AlertCircle className="h-4 w-4" />
      case 'inactive':
        return <XCircle className="h-4 w-4" />
      default:
        return <UserCheck className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Student Management</h1>
                  <p className="text-muted-foreground">
                    Monitor student progress, engagement, and provide personalized support
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Message All
                  </Button>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students by name or email..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      <SelectItem value="grade-8">Grade 8</SelectItem>
                      <SelectItem value="grade-9">Grade 9</SelectItem>
                      <SelectItem value="grade-10">Grade 10</SelectItem>
                      <SelectItem value="grade-11">Grade 11</SelectItem>
                      <SelectItem value="grade-12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="at-risk">At Risk</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                      <SelectItem value="last-active">Last Active</SelectItem>
                      <SelectItem value="grade">Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Student Grid */}
            <div className="grid gap-6">
              {students.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-muted rounded-full">
                          <UserCheck className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg truncate">{student.name}</h3>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            <Badge className={getStatusColor(student.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(student.status)}
                                {student.status}
                              </span>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{student.progress}%</p>
                              <p className="text-xs text-muted-foreground">Progress</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{student.avgScore}%</p>
                              <p className="text-xs text-muted-foreground">Avg Score</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">{student.assignmentsCompleted}</p>
                              <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-orange-600">{student.classes.length}</p>
                              <p className="text-xs text-muted-foreground">Classes</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {student.grade}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Last active: {student.lastActive}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              Classes: {student.classes.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => window.location.href = `/teacher/students/${student.id}`}>
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {students.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No students found</h3>
                  <p className="text-muted-foreground mb-4">
                    Students will appear here once they enroll in your classes.
                  </p>
                  <Button onClick={() => window.location.href = '/teacher/classes'}>
                    View My Classes
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-muted-foreground">
                Showing {students.length} of {students.length} students
              </p>
              <div className="flex gap-2">
                <Button variant="outline" disabled>
                  Previous
                </Button>
                <Button variant="outline" disabled>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}