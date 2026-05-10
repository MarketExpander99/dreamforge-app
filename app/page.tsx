// Server component for authentication checking and dashboard routing
import { createClient } from '@/lib/supabase-server'
import LandingPage from './components/LandingPage'
import HomeDashboard from './components/HomeDashboard'

// Check authentication on server side and show appropriate dashboard
export default async function Home() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  // If there's an auth error or no user, show landing page
  if (error || !user) {
    return <LandingPage />
  }

  // User is authenticated - show home dashboard
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, teacher_onboarding_completed, full_name')
      .eq('id', user.id)
      .single()

    // If profile fetch fails, show dashboard with default profile
    const userProfile = profileError ? null : profile

    return <HomeDashboard user={user} profile={userProfile} />
  } catch (error) {
    // If any error occurs, show dashboard with null profile
    return <HomeDashboard user={user} profile={null} />
  }
}
