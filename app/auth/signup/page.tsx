'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    grade: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
            full_name: formData.fullName,
            role: 'student',
            onboarding_completed: false,
            grade: formData.grade
          }
        }
      })

      if (error) throw error

      // Send branded confirmation email
      try {
        const confirmationUrl = `${window.location.origin}/auth/confirm?email=${encodeURIComponent(formData.email)}`

        const response = await fetch('/api/auth/send-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            confirmationUrl
          }),
        })

        if (!response.ok) {
          console.error('Failed to send branded confirmation email')
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
      }

      alert('Account created successfully! Please check your email and click the confirmation link to activate your account.')

      // Reset form
      setFormData({
        email: '',
        password: '',
        fullName: '',
        grade: ''
      })
      router.push('/discover')
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

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/images/auth/register-hero.jpg"
          alt="Skill Gain Register"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-transparent" />
        
        <div className="absolute bottom-12 left-12 text-white z-10">
          <h2 className="text-5xl font-bold tracking-tight">Join Skill Gain</h2>
          <p className="mt-4 text-xl text-white/90">Start your learning journey today</p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-zinc-950">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Student Registration</CardTitle>
            <CardDescription>
              Create your student account
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

              <div className="space-y-2">
                <Label htmlFor="grade">CAPS Grade</Label>
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select your grade</option>
                  <option value="R">Grade R</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Privacy & Data Protection</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p>
                    <strong>Your privacy matters to us.</strong> We comply with POPI Act and GDPR regulations.
                  </p>
                  <p>• Your real name is never displayed publicly</p>
                  <p>• You'll be assigned an anonymous ID (like "User_12345") for public display</p>
                  <p>• You can optionally choose a display name in your profile settings</p>
                  <p>• Students under 18 require parent/guardian consent for display names</p>
                  <p className="text-xs mt-2">
                    By creating an account, you agree to our privacy policy and data protection practices.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}