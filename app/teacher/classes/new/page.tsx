import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Save,
  ArrowLeft,
  Copy,
  Share2,
  QrCode,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function TeacherClassCreation() {
  // Generate a random class code
  const classCode = 'MATH4-' + Math.random().toString(36).substring(2, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teacher">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Create New Class</h1>
                <p className="text-muted-foreground">
                  Set up a class and generate an invite code for students to join
                </p>
              </div>
            </div>

            <form className="space-y-6">
              {/* Class Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Information</CardTitle>
                  <CardDescription>Basic details about your class</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="class-name">Class Name *</Label>
                      <Input
                        id="class-name"
                        placeholder="e.g., Grade 4 Mathematics"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="natural-sciences">Natural Sciences</SelectItem>
                          <SelectItem value="english-home-language">English Home Language</SelectItem>
                          <SelectItem value="english-first-additional">English First Additional</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="economic-management">Economic & Management Sciences</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="grade-level">Grade Level *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grade-1">Grade 1</SelectItem>
                          <SelectItem value="grade-2">Grade 2</SelectItem>
                          <SelectItem value="grade-3">Grade 3</SelectItem>
                          <SelectItem value="grade-4">Grade 4</SelectItem>
                          <SelectItem value="grade-5">Grade 5</SelectItem>
                          <SelectItem value="grade-6">Grade 6</SelectItem>
                          <SelectItem value="grade-7">Grade 7</SelectItem>
                          <SelectItem value="grade-8">Grade 8</SelectItem>
                          <SelectItem value="grade-9">Grade 9</SelectItem>
                          <SelectItem value="grade-10">Grade 10</SelectItem>
                          <SelectItem value="grade-11">Grade 11</SelectItem>
                          <SelectItem value="grade-12">Grade 12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-students">Maximum Students</Label>
                      <Input
                        id="max-students"
                        type="number"
                        placeholder="30"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Class Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what students will learn in this class..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="learning-goals">Learning Goals</Label>
                    <Textarea
                      id="learning-goals"
                      placeholder="What should students achieve by the end of this class? (one per line)"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter each learning goal on a new line.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Class Code Generation */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Invite Code</CardTitle>
                  <CardDescription>Generated code for students to join your class</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-1 block">Class Code</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono bg-background px-3 py-1 rounded border">
                          {classCode}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(classCode)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Share Options</Label>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Share2 className="h-4 w-4 mr-2" />
                          Copy Share Link
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <QrCode className="h-4 w-4 mr-2" />
                          Generate QR Code
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Instructions for Students</Label>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Students can join using:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>The class code: <code className="bg-muted px-1 rounded text-xs">{classCode}</code></li>
                          <li>QR code scanning</li>
                          <li>Direct invite link</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Class Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Class Settings</CardTitle>
                  <CardDescription>Configure how your class operates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Self-Enrollment</Label>
                        <p className="text-sm text-muted-foreground">
                          Students can join using the class code without approval
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Send Progress Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically send weekly progress reports to parents
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Gamification</Label>
                        <p className="text-sm text-muted-foreground">
                          Award points and badges for completed activities
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-gray-300"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Parent Approval</Label>
                        <p className="text-sm text-muted-foreground">
                          Parents must approve before students can join
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Create Class
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/teacher">
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}