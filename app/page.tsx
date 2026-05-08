// Server component for authentication checking
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LandingPage from './components/LandingPage'

// Check authentication on server side
export default async function Home() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // If there's an auth error or no user, show landing page
  if (error || !user) {
    return <LandingPage />
  }

  // If user is authenticated, redirect to appropriate dashboard
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, teacher_onboarding_completed')
      .eq('id', user.id)
      .single()

    // If profile fetch fails, redirect to learning (assume student)
    if (profileError) {
      redirect('/learning')
    }

    // Check if user is teacher or admin
    const isTeacher = profile?.role === 'teacher'
    const isAdmin = user.email === 'eben.combrinck@proton.me'
    const needsOnboarding = !profile?.teacher_onboarding_completed

    // Redirect teachers who haven't completed onboarding
    if ((isTeacher || isAdmin) && needsOnboarding) {
      redirect('/teacher')
    }

    // Redirect teachers who have completed onboarding to teacher dashboard
    if (isTeacher || isAdmin) {
      redirect('/teacher')
    }

    // Redirect students to learning dashboard
    redirect('/learning')
  } catch (error) {
    // If any error occurs, redirect to learning as fallback
    redirect('/learning')
  }
}
