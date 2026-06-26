'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog'

// During beta we sometimes need to manually confirm users in the Supabase Dashboard
// (Authentication → Users → ⋯ → Confirm user) if they were created while
// "Enable email confirmation" was still turned ON in the Supabase project settings.
// New signups after it is OFF should not hit this.
export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)
  const router = useRouter()

  // ONE stable Supabase client for the component (from the singleton helper).
  // Prevents multiple client instances breaking the session.
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  const showPasswordResetModal = () => {
    setModalConfig({
      title: 'Reset Password',
      description: 'Invalid email or password. Would you like us to reset your password?',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/auth/send-password-reset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to send password reset email')
          }

          const result = await response.json()
          if (!result.success) {
            throw new Error(result.error || 'Failed to send password reset email')
          }

          toast.success('Password reset email sent! Please check your inbox.')
          setShowModal(false)
        } catch (error: unknown) {
          console.error('Password reset error:', error)
          toast.error('Failed to send password reset email. Please try again later.')
        }
      }
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const email = formData.email.trim()
    const password = formData.password

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // All logged-in users now go directly to Discover page
      router.push('/discover')

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Login error (full from Supabase):', error)

      let displayError = 'Login failed. Please try again.'

      if (errorMessage.includes('Email not confirmed')) {
        // Clear guidance instead of generic "Invalid login credentials"
        const resendConfirmation = confirm(
          'Your email address has not been confirmed yet. Would you like us to resend the confirmation email?'
        )

        if (resendConfirmation) {
          try {
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: formData.email
            })

            if (resendError) throw resendError

            toast.success('Confirmation email has been resent. Please check your inbox and spam folder.')
          } catch (resendError: unknown) {
            toast.error('Failed to resend confirmation email. Please try again later.')
          }
        }
        displayError = errorMessage
      } else if (errorMessage.includes('Supabase environment variables not configured')) {
        displayError = 'Authentication is not configured yet. Please set up Supabase environment variables first.'
        toast.error(displayError)
      } else if (errorMessage.includes('Invalid login credentials')) {
        // This can mean wrong password OR the user was created while email confirmation was ON.
        // During beta we keep confirmation OFF so this should mostly be "bad password".
        // We keep the existing reset modal flow for now.
        displayError = `Invalid login credentials for "${email}". Double-check the exact email and password you used during signup (copy-paste if possible, no extra spaces or case differences). If you just signed up, try waiting 5-10 seconds or use the "Forgot password?" option.`
        showPasswordResetModal()
        toast.error(displayError)
      } else if (errorMessage.includes('Too many requests')) {
        displayError = 'Too many login attempts. Please wait a few minutes before trying again.'
        toast.error(displayError)
      } else if (errorMessage.includes('Database error querying schema')) {
        displayError = 'Login failed due to a database schema error. This often happens with manually-created test users (missing auth.identities record or broken handle_new_user trigger). Delete the user in Supabase Auth UI and recreate using the Admin API script (scripts/create-groklet-payfast-users.js). Or run a repair for identities.'
        toast.error(displayError, { duration: 10000 })
      } else {
        displayError = errorMessage
        toast.error(`Login failed: ${errorMessage}`)
      }

      setError(displayError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - IMAGE / GRAPHIC */}
      {/* LEFT SIDE - IMAGE / GRAPHIC */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/images/auth/login-hero.jpg"     // ← Change this path to your actual image
          alt="Skill Gain Login"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-transparent" />
        
        <div className="absolute bottom-12 left-12 text-white z-10">
          <h2 className="text-5xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-4 text-xl text-white/90">Continue your learning journey with Skill Gain</p>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-zinc-950">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm mb-4">
                {error}
              </div>
            )}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={showPasswordResetModal}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Reset Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogOverlay className="fixed inset-0 z-50 bg-black data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalConfig?.title}</DialogTitle>
            <DialogDescription>{modalConfig?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={modalConfig?.onConfirm}>
              Reset Password Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
