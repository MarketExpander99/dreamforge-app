import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { FamilyDashboard } from '@/components/family-dashboard'
import { Skeleton } from '@/components/ui/skeleton'

async function getFamilyData(userId: string) {
  const supabase = await createClient()

  // Get all children linked to this parent
  const { data: children, error: childrenError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      grade_level,
      created_at
    `)
    .eq('parent_id', userId)
    .eq('role', 'student')

  if (childrenError) {
    console.error('Error fetching children:', childrenError)
    return { children: [], activityFeed: [] }
  }

  // Get progress data for all children
  const childrenIds = children?.map(child => child.id) || []
  let allProgress = []
  let allAchievements = []

  if (childrenIds.length > 0) {
    // Get progress for all children
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select(`
        *,
        content:content_items(title, type)
      `)
      .in('user_id', childrenIds)
      .order('completed_at', { ascending: false })

    if (!progressError && progressData) {
      allProgress = progressData
    }

    // Get achievements for all children
    const { data: achievementsData, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .in('user_id', childrenIds)
      .order('earned_at', { ascending: false })

    if (!achievementsError && achievementsData) {
      allAchievements = achievementsData
    }
  }

  // Create activity feed from achievements and completed progress
  const activityFeed = [
    ...allAchievements.map(achievement => ({
      id: `achievement-${achievement.id}`,
      type: 'achievement' as const,
      childId: achievement.user_id,
      childName: children?.find(c => c.id === achievement.user_id)?.full_name || 'Unknown',
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      timestamp: achievement.earned_at
    })),
    ...allProgress
      .filter(p => p.status === 'completed' && p.completed_at)
      .map(progress => ({
        id: `progress-${progress.id}`,
        type: 'progress' as const,
        childId: progress.user_id,
        childName: children?.find(c => c.id === progress.user_id)?.full_name || 'Unknown',
        title: `Completed ${progress.content?.type || 'content'}`,
        description: progress.content?.title || 'Unknown content',
        icon: '✅',
        timestamp: progress.completed_at
      }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return {
    children: children || [],
    activityFeed: activityFeed.slice(0, 20) // Limit to 20 most recent activities
  }
}

export default async function FamilyPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/login')
  }

  // Check if user is a parent
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'parent') {
    redirect('/profile') // Redirect non-parents to profile
  }

  const familyData = await getFamilyData(user.id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<FamilyDashboardSkeleton />}>
          <FamilyDashboard
            children={familyData.children}
            activityFeed={familyData.activityFeed}
          />
        </Suspense>
      </div>
    </div>
  )
}

function FamilyDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}