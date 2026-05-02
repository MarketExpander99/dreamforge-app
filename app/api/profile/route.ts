import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/profile - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user stats (learning time, completed modules, etc.)
    const { data: progressStats, error: progressError } = await supabase
      .from('user_progress')
      .select('status, progress_percentage, time_spent')
      .eq('user_id', user.id)

    if (progressError) {
      console.error('Error fetching progress stats:', progressError)
    }

    // Calculate stats
    const totalLearningTime = progressStats?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0
    const completedModules = progressStats?.filter(p => p.status === 'completed').length || 0
    const currentStreak = 0 // TODO: Implement streak calculation

    // Get achievements count
    const { count: achievementsCount, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (achievementsError) {
      console.error('Error fetching achievements count:', achievementsError)
    }

    // Get recent activity (last 5 progress entries)
    const { data: recentActivity, error: activityError } = await supabase
      .from('user_progress')
      .select(`
        id,
        status,
        progress_percentage,
        time_spent,
        last_accessed_at,
        content_items (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .order('last_accessed_at', { ascending: false })
      .limit(5)

    if (activityError) {
      console.error('Error fetching recent activity:', activityError)
    }

    // Format recent activity
    const formattedActivity = recentActivity?.map(activity => ({
      id: activity.id,
      action: activity.status === 'completed' ? 'Completed' : activity.status === 'in_progress' ? 'Started' : 'Viewed',
      title: (activity.content_items as any)?.title || 'Unknown Content',
      timestamp: activity.last_accessed_at ? new Date(activity.last_accessed_at).toLocaleDateString() : 'Recently'
    })) || []

    // Get achievements
    const { data: achievements, error: achievementsListError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    if (achievementsListError) {
      console.error('Error fetching achievements:', achievementsListError)
    }

    const formattedAchievements = achievements?.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      earnedAt: achievement.earned_at ? new Date(achievement.earned_at).toLocaleDateString() : 'Recently'
    })) || []

    // Get learning progress by category
    const { data: categoryProgress, error: categoryError } = await supabase
      .rpc('get_user_category_progress', { user_id_param: user.id })

    if (categoryError) {
      console.error('Error fetching category progress:', categoryError)
    }

    const response = {
      id: profile.id,
      fullName: profile.full_name || user.email?.split('@')[0] || 'User',
      email: user.email,
      avatar: profile.avatar_url,
      bio: profile.bio,
      gradeLevel: profile.grade_level || 'Not specified',
      interests: profile.interests || [],
      learningGoals: profile.learning_goals,
      joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
      totalLearningTime,
      completedModules,
      currentStreak,
      achievementsCount: achievementsCount || 0,
      recentActivity: formattedActivity,
      achievements: formattedAchievements,
      categoryProgress: categoryProgress || []
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, bio, gradeLevel, interests, learningGoals } = body

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio,
        grade_level: gradeLevel,
        interests: Array.isArray(interests) ? interests : interests?.split(',').map((i: string) => i.trim()) || [],
        learning_goals: learningGoals,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}