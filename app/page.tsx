// Server component for authentication checking and dashboard routing
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LandingPage from './components/LandingPage'

// Check authentication on server side and redirect to appropriate dashboard
export default async function Home() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // If there's an auth error or no user, show landing page
  if (error || !user) {
    return <LandingPage />
  }

  // User is authenticated - redirect to their appropriate dashboard
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, teacher_onboarding_completed')
      .eq('id', user.id)
      .single()

    // If profile fetch fails, default to student dashboard
    if (profileError) {
      redirect('/learning')
    }

    // Redirect based on user role
    const userRole = profile?.role
    const userEmail = user.email

    // Special admin email always gets teacher access
    if (userEmail === 'eben.combrinck@proton.me') {
      redirect('/teacher')
    }

    // Route based on role
    switch (userRole) {
      case 'teacher':
        redirect('/teacher')
      case 'parent':
        redirect('/family')
      case 'student':
      default:
        redirect('/learning')
    }
  } catch (error) {
    // If any error occurs, default to student dashboard
    redirect('/learning')
  }
}
