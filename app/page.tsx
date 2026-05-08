// Server component for authentication checking
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LandingPage from './components/LandingPage'
import HomeDashboard from './components/HomeDashboard'

// Check authentication on server side
export default async function Home() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // If there's an auth error or no user, show landing page
  if (error || !user) {
    return <LandingPage />
  }

  // If user is authenticated, show personalized home dashboard
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, teacher_onboarding_completed, full_name, avatar')
      .eq('id', user.id)
      .single()

    // If profile fetch fails, show basic dashboard
    if (profileError) {
      return <HomeDashboard user={user} profile={null} />
    }

    // Show personalized home dashboard for all authenticated users
    return <HomeDashboard user={user} profile={profile} />
  } catch (error) {
    // If any error occurs, show basic dashboard as fallback
    return <HomeDashboard user={user} profile={null} />
  }
}
