'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// During beta we sometimes need to manually confirm users in the Supabase Dashboard
// (Authentication → Users → ⋯ → Confirm user) if they were created while
// "Enable email confirmation" was still turned ON in the Supabase project settings.
// New signups after it is OFF should auto-login immediately.
export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    learningGoal: '',
    interests: ''
  })
  const [loading, setLoading] = useState(true)        // Initial auth check
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // Source of truth for autofill: browser dropdown may update the DOM without
  // always firing React onChange. We read emailRef on submit.
  const emailRef = useRef<HTMLInputElement>(null)

  // ONE stable Supabase client for the whole component lifetime.
  // This prevents the classic "new client every render" auth bugs.
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  /** Live email from DOM (autofill-safe), trimmed + lower-cased. */
  const getLiveEmail = () => {
    const fromDom = emailRef.current?.value
    const raw = (fromDom !== undefined && fromDom !== '' ? fromDom : formData.email) || ''
    return raw.trim().toLowerCase()
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value
    setFormData(prev => ({ ...prev, email: value }))
  }

  // Check if user is already signed in → redirect
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('User already signed in → redirecting')
        router.replace('/discover')
        return
      }
      
      setLoading(false)
    }

    checkSession()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    // Autofill-safe: prefer live DOM value over React state
    const email = getLiveEmail()
    const password = formData.password

    // Keep state in sync for any subsequent UI that reads formData.email
    if (email && email !== formData.email.trim().toLowerCase()) {
      setFormData(prev => ({ ...prev, email }))
    }

    // Email format validation removed for beta/dev testing.
    // Dummy addresses like a@a.com, abc@mail.com, abc@abc.com are now allowed.

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters long'
      setError(msg)
      toast.error(msg)
      setSubmitting(false)
      return
    }

    if (!formData.fullName.trim()) {
      setError('Please enter your full name')
      setSubmitting(false)
      return
    }

    if (!formData.learningGoal.trim()) {
      setError('Please tell us what you would like to learn or study for')
      setSubmitting(false)
      return
    }

    try {
      // Beta mode: We auto sign-in the user right after signup.
      // This only works reliably because email confirmation is turned OFF in Supabase.
      // After signUp we check for an immediate session. If not present we do an
      // explicit signInWithPassword (works when confirmation disabled).
      // Goal: User is logged in + on /discover within 1-2 seconds. No extra login page step.
      const { data: signUpData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: 'student',
            onboarding_completed: false,
            grade: '1',
            learning_goal: formData.learningGoal.trim(),
            interests: formData.interests.trim()
          }
          // emailRedirectTo removed for beta
        }
      })

      if (signupError) throw signupError

      // If signUp gave us a session (common when email confirmation is disabled), use it immediately.
      if (signUpData?.session) {
        toast.success('Account created and you are now logged in!')
        router.push('/discover')
        return
      }

      // Fallback: explicitly sign in (this path is the key for beta without confirmation)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        const msg = `Account created successfully, but sign-in failed with: ${signInError.message}. Please go to /auth/login and try the exact same credentials you just used (copy-pasted from the form).`
        setError(msg)
        toast.error('Signup ok, but login test failed – see details and console.')
        setFormData({ email: '', password: '', fullName: '', learningGoal: '', interests: '' })
        setTimeout(() => router.push('/auth/login'), 3000)
        return
      }

      // Fully successful – user is now authenticated
      toast.success('Account created and you are now logged in!')
      router.push('/discover')

    } catch (error: any) {
      console.error('Signup error (raw from Supabase):', error)

      let message = error?.message || 'Signup failed. Please try again.'

      // Friendly overrides for common cases (keep for good UX)
      if (error?.message?.toLowerCase().includes('rate limit')) {
        message = 'Email rate limit exceeded. Please wait a minute before trying again.'
        toast.error(message)
      } else if (error?.message?.includes('User already registered') || error?.message?.includes('already exists')) {
        message = 'An account with this email already exists. Please login instead.'
      } else if (error?.message?.includes('Password should be at least')) {
        message = 'Password must be at least 6 characters long.'
      } else if (error?.message?.toLowerCase().includes('is invalid') || error?.message?.includes('Unable to validate email')) {
        // Special handling for Supabase rejecting the email (common with custom domains like @skillgain.dev that lack MX records)
        message = `Supabase rejected "${email}" as invalid.

This usually means:
• The domain (skillgain.dev) has no MX records set up for email delivery, or
• Supabase's deliverability check is failing for this address.

For dev/testing, use a real address from Gmail, Outlook, ProtonMail, etc.

Raw Supabase error: ${error?.message}`
        toast.error('Email address rejected by Supabase. See the error box for details.')
      } else {
        // Surface raw error for all other cases so we can debug easily in beta
        toast.error(`Signup failed: ${error?.message || 'Unknown error'}`)
      }

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* HERO IMAGE */}
      <div className="lg:w-1/2 relative h-80 lg:h-auto flex items-end">
        <img
          src="/images/auth/register-hero.jpg"
          alt="Skill Gain Register"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-transparent" />
        
        <div className="absolute bottom-12 left-12 text-white z-10 max-w-xs">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Join Skill Gain</h2>
          <p className="mt-4 text-lg lg:text-xl text-white/90">Start your learning journey today</p>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-zinc-950">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Student Registration</CardTitle>
            <CardDescription>
              Create your student account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  ref={emailRef}
                  value={formData.email}
                  onChange={handleEmailChange}
                  onInput={handleEmailChange}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">What are your interests? (Optional)</Label>
                <textarea
                  id="interests"
                  placeholder="e.g. Coding, Soccer, Music, Space exploration, History..."
                  value={formData.interests}
                  onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                  disabled={submitting}
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-y"
                />
              </div>

              {/* Privacy Notice */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Privacy & Data Protection</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <p><strong>Your privacy matters to us.</strong> We comply with POPI Act and GDPR regulations.</p>
                  <p>• Your real name is never displayed publicly</p>
                  <p>• You'll be assigned an anonymous ID (like "User_12345") for public display</p>
                  <p>• You can optionally choose a display name in your profile settings</p>
                  <p>• Students under 18 require parent/guardian consent for display names</p>
                  <p className="text-xs mt-2">By creating an account, you agree to our privacy policy and data protection practices.</p>
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

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
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
