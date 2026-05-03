'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Users, PenTool } from 'lucide-react'

export default function SignupPage() {
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [role, setRole] = useState<'parent' | 'student' | 'content-creator' | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    childName: '',
    childAge: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRoleSelect = (selectedRole: 'parent' | 'student' | 'content-creator') => {
    setRole(selectedRole)
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: role === 'parent' ? formData.childName : formData.fullName,
            role: role,
            ...(role === 'parent' && {
              child_name: formData.childName,
              child_age: formData.childAge
            })
          }
        }
      })

      if (error) throw error

      // Show success message for email confirmation
      alert('Account created successfully! Please check your email and click the confirmation link to activate your account.')

      // Reset form
      setFormData({
        email: '',
        password: '',
        fullName: '',
        childName: '',
        childAge: ''
      })
      setStep('role')
    } catch (error: any) {
      console.error('Signup error:', error)

      if (error.message?.includes('Supabase environment variables not configured')) {
        alert('Authentication is not configured yet. Please set up Supabase environment variables first.')
      } else if (error.message?.includes('User already registered')) {
        alert('An account with this email already exists. Please try logging in instead.')
      } else if (error.message?.includes('Password should be at least')) {
        alert('Password must be at least 6 characters long.')
      } else if (error.message?.includes('Unable to validate email address')) {
        alert('Please enter a valid email address.')
      } else if (error.message?.includes('signup is disabled')) {
        alert('New user registration is currently disabled. Please contact support.')
      } else {
        alert('Signup failed. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'role') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Join Skill Gain</CardTitle>
            <CardDescription>
              Choose your role to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleRoleSelect('parent')}
              className="w-full h-20 flex flex-col items-center gap-2"
              variant="outline"
            >
              <Users className="h-8 w-8" />
              <span>Parent registering a child</span>
            </Button>
            <Button
              onClick={() => handleRoleSelect('student')}
              className="w-full h-20 flex flex-col items-center gap-2"
              variant="outline"
            >
              <User className="h-8 w-8" />
              <span>Student (13+ years old)</span>
            </Button>
            <Button
              onClick={() => handleRoleSelect('content-creator')}
              className="w-full h-20 flex flex-col items-center gap-2"
              variant="outline"
            >
              <PenTool className="h-8 w-8" />
              <span>Content Creator</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {role === 'parent' ? 'Parent Registration' :
             role === 'content-creator' ? 'Content Creator Registration' :
             'Student Registration'}
          </CardTitle>
          <CardDescription>
            {role === 'parent'
              ? 'Create an account for your child'
              : role === 'content-creator'
              ? 'Create your content creator account'
              : 'Create your student account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            {role === 'parent' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Your Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childName">Child's Full Name</Label>
                  <Input
                    id="childName"
                    placeholder="Enter your child's full name"
                    value={formData.childName}
                    onChange={(e) => setFormData(prev => ({ ...prev, childName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childAge">Child's Age</Label>
                  <Input
                    id="childAge"
                    type="number"
                    placeholder="Enter your child's age"
                    value={formData.childAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, childAge: e.target.value }))}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setStep('role')}
              className="text-sm"
            >
              ← Back to role selection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}