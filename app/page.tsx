// Server component for authentication checking
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LandingPage from './components/LandingPage'

// Check authentication on server side
export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated, redirect to appropriate dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, teacher_onboarding_completed')
      .eq('id', user.id)
      .single()

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
  }

  // Show landing page for unauthenticated users
  return <LandingPage />
}
