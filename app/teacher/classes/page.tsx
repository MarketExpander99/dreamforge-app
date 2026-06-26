"use client";

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Users, BookOpen, Eye, Share2, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

interface ClassData {
  id: string
  name: string
  subject: string
  grade_level: string
  class_code: string
  description: string | null
  max_students: number
  is_active: boolean
  created_at: string
  students: Array<{
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    joined_at: string
  }>
}

export default function TeacherClassesPage() {
  const supabase = createBrowserSupabaseClient()
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in.')
        return
      }

      const { data: classData, error: classError } = await supabase
        .from('teacher_classes')
        .select(`
          id, name, subject, grade_level, class_code, description, max_students, is_active, created_at,
          class_students!inner(*, profiles!class_students_student_id_fkey(id, full_name, email, avatar_url))
        `)
        .eq('teacher_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (classError) throw classError

      const classesWithStudents = (classData || []).map((cls: any) => ({
        ...cls,
        students: (cls.class_students || []).map((student: any) => ({
          id: student.profiles.id,
          full_name: student.profiles.full_name,
          email: student.profiles.email,
          avatar_url: student.profiles.avatar_url,
          joined_at: student.created_at
        })).sort((a: any, b: any) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
      }))

      setClasses(classesWithStudents)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('teacher-classes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'class_students' }, 
        () => loadClasses()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navigation />
        <div className="md:pl-64">
          <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading classes...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Classes</h1>
                <p className="text-muted-foreground">Manage your classes and view enrolled students</p>
              </div>
              <Button asChild>
                <Link href="/teacher/classes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Class
                </Link>
              </Button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {classes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Classes Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first class to get started.</p>
                  <Button asChild>
                    <Link href="/teacher/classes/new">Create Class</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {classes.map((cls) => (
                  <Card key={cls.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-xl">{cls.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{cls.subject.replace('-', ' ')}</span>
                            <Badge variant="outline">{cls.grade_level.replace('grade-', 'Grade ')}</Badge>
                            <Badge variant="secondary">{cls.class_code}</Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={cls.is_active ? 'default' : 'secondary'}>
                          {cls.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/teacher/classes/${cls.id}`}>View Details</Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${cls.class_code}`)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {cls.description && (
                        <p className="text-sm text-muted-foreground mb-4">{cls.description}</p>
                      )}
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Enrolled Students ({cls.students.length}/{cls.max_students})
                          </h3>
                          {cls.students.length === 0 ? (
                            <p className="text-muted-foreground">No students enrolled yet.</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Student</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Joined</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {cls.students.slice(0, 5).map((student) => (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                      {student.full_name}
                                      {student.avatar_url && (
                                        <img src={student.avatar_url} alt="" className="w-6 h-6 rounded-full ml-2 inline" />
                                      )}
                                    </TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {new Date(student.joined_at).toLocaleDateString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {cls.students.length > 5 && (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                                      and {cls.students.length - 5} more...
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Class Code</span>
                            <Badge variant="outline" className="font-mono">{cls.class_code}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Created</span>
                            <span className="text-sm">{new Date(cls.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="pt-4 border-t">
                            <Button variant="outline" size="sm" asChild className="w-full">
                              <Link href={`/teacher/classes/${cls.id}/students`}>View All Students</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}