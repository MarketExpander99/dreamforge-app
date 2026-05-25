'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Textarea } from 'lucide-react'  // Textarea is from shadcn, but using native for now

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    learningGoal: '',     // New: What would you like to learn or study for?
    interests: ''         // New: What are your interests?
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Client-side validation
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (!formData.fullName.trim()) {
      setError('Please enter your full name')
      setLoading(false)
      return
    }

    if (!formData.learningGoal.trim()) {
      setError('Please tell us what you would like to learn or study for')
      setLoading(false)
      return
    }

    try {
      const supabase = createBrowserSupabaseClient()
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: 'student',
            onboarding_completed: false,
            // Grade defaulted to 1 as requested
            grade: '1',
            learning_goal: formData.learningGoal.trim(),
            interests: formData.interests.trim()
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (signupError) throw signupError

      // Attempt to send branded confirmation (non-blocking)
      try {
        const confirmationUrl = `${window.location.origin}/auth/confirm?email=${encodeURIComponent(formData.email)}`
        
        await fetch('/api/auth/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            confirmationUrl
          }),
        })
      } catch (emailError) {
        console.warn('Branded confirmation email failed (this is non-blocking):', emailError)
      }

      setSuccess('Account created successfully! Please check your email for the confirmation link.')
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        fullName: '',
        learningGoal: '',
        interests: ''
      })

      // Optional: redirect after delay
      setTimeout(() => {
        router.push('/auth/login')
      }, 2500)

    } catch (error: any) {
      console.error('Signup error:', error)

      let message = 'Signup failed. Please try again.'

      if (error.message?.includes('invalid') || error.message?.includes('Unable to validate email')) {
        message = 'Please use a valid, deliverable email address (Gmail, Outlook, etc.). Test domains may be blocked by Supabase.'
      } else if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
        message = 'An account with this email already exists. Please login instead.'
      } else if (error.message?.includes('Password should be at least')) {
        message = 'Password must be at least 6 characters long.'
      } else if (error.message?.includes('signup is disabled')) {
        message = 'New registrations are temporarily disabled. Please contact support.'
      }

      setError(message)
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learningGoal">What would you like to learn or study for?</Label>
                <Input
                  id="learningGoal"
                  placeholder="e.g. Mathematics, Physical Science, Exam preparation"
                  value={formData.learningGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, learningGoal: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">What are your interests? (Optional)</Label>
                <textarea
                  id="interests"
                  placeholder="e.g. Coding, Soccer, Music, Space exploration..."
                  value={formData.interests}
                  onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                  disabled={loading}
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-y"
                />
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                  {success}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}