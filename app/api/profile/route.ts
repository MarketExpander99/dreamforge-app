import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Pure server-side streak calculator (uses existing user_progress data only)
function calculateCurrentStreak(progressRows: any[]): number {
  if (!progressRows || progressRows.length === 0) return 0

  const dayKeys = new Set<string>()

  for (const row of progressRows) {
    // Prioritize completed_at (true learning completion). Fallback to last_accessed_at for engagement.
    const ts = row.completed_at || row.last_accessed_at
    if (!ts) continue
    const d = new Date(ts)
    if (isNaN(d.getTime())) continue
    // Use local date key for "calendar day" feel (consistent with user expectations)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dayKeys.add(key)
  }

  if (dayKeys.size === 0) return 0

  const sortedDays = Array.from(dayKeys).sort((a, b) => b.localeCompare(a)) // newest first

  const mostRecentKey = sortedDays[0]
  const mostRecentDate = new Date(mostRecentKey + 'T00:00:00')

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayDate = new Date(todayKey + 'T00:00:00')

  const diffDays = Math.floor((todayDate.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))
  // Allow today (0) or yesterday (1). Anything older = streak broken.
  if (diffDays > 1) return 0

  // Count consecutive days starting from the most recent activity day (fixes streak=0 when last activity = yesterday)
  let streak = 1
  let cursor = new Date(mostRecentDate)

  for (let i = 1; i < sortedDays.length; i++) {
    cursor.setDate(cursor.getDate() - 1)
    const expectedKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    if (sortedDays[i] === expectedKey) {
      streak += 1
    } else {
      break
    }
  }

  return streak
}

// Static achievement definitions for display (matches lib/achievements.ts definitions; used to show locked state)
// Real earned data always comes from user_achievements table.
const ACHIEVEMENT_DEFINITIONS = [
  { type: 'first_steps', title: 'First Steps', description: 'Completed your first learning module', icon: '🎯' },
  { type: 'science_explorer', title: 'Science Explorer', description: 'Completed 3 science modules', icon: '🔬' },
  { type: 'math_whiz', title: 'Math Whiz', description: 'Mastered multiplication basics', icon: '🧮' },
  { type: 'quiz_master', title: 'Quiz Master', description: 'Scored 100% on 5 quizzes', icon: '🏆' },
  { type: 'knowledge_seeker', title: 'Knowledge Seeker', description: 'Read 10 different topics', icon: '📚' },
  { type: 'streak_master', title: 'Streak Master', description: 'Maintained a 7-day learning streak', icon: '🔥' },
] as const

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

    // Get user stats including date fields for accurate streak (real data from user_progress)
    const { data: progressStats, error: progressError } = await supabase
      .from('user_progress')
      .select('status, progress_percentage, time_spent, completed_at, last_accessed_at')
      .eq('user_id', user.id)

    if (progressError) {
      console.error('Error fetching progress stats:', progressError)
    }

    // Calculate stats from real data
    const totalLearningTime = progressStats?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0
    const completedModules = progressStats?.filter(p => p.status === 'completed').length || 0
    const currentStreak = calculateCurrentStreak(progressStats || [])

    // Derived growth signals (based strictly on existing tables — no new columns)
    const totalXP = completedModules * 35 + Math.floor(totalLearningTime * 1.2)
    const currentLevel = Math.max(1, Math.floor(totalXP / 120) + 1)

    // Get achievements count
    const { count: achievementsCount, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (achievementsError) {
      console.error('Error fetching achievements count:', achievementsError)
    }

    // Get recent activity safely without relying on FK relationship (avoids PGRST200 "no relationship" error)
    // We fetch progress first, then titles separately. Works even if schema cache/FK is not registered.
    let recentActivity: any[] = []
    try {
      const { data: progressRows, error: progressErr } = await supabase
        .from('user_progress')
        .select('id, status, progress_percentage, time_spent, last_accessed_at, content_id')
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false })
        .limit(5)

      if (progressErr) {
        console.error('Error fetching recent progress rows:', progressErr)
      } else if (progressRows && progressRows.length > 0) {
        const contentIds = Array.from(new Set(progressRows.map((r: any) => r.content_id).filter(Boolean))) as string[]

        let titlesMap: Record<string, string> = {}
        if (contentIds.length > 0) {
          const { data: contents } = await supabase
            .from('content_items')
            .select('id, title')
            .in('id', contentIds)
          if (contents) {
            titlesMap = Object.fromEntries(contents.map((c: any) => [c.id, c.title || 'Untitled']))
          }
        }

        recentActivity = progressRows.map((activity: any) => ({
          id: activity.id,
          status: activity.status,
          progress_percentage: activity.progress_percentage,
          time_spent: activity.time_spent,
          last_accessed_at: activity.last_accessed_at,
          content_items: activity.content_id ? { title: titlesMap[activity.content_id] || null } : null
        }))
      }
    } catch (err) {
      console.error('Error fetching recent activity:', err)
    }

    // Format recent activity
    const formattedActivity = recentActivity.map(activity => ({
      id: activity.id,
      action: activity.status === 'completed' ? 'Completed' : activity.status === 'in_progress' ? 'Started' : 'Viewed',
      title: (activity.content_items as any)?.title || 'Unknown Content',
      timestamp: activity.last_accessed_at ? new Date(activity.last_accessed_at).toLocaleDateString() : 'Recently'
    }))

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
      type: achievement.achievement_type,
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

    // Active Learning Path Snapshot - real data from learning_paths table (existing)
    // Conservative: latest path + first 3 steps only for a clean profile snapshot
    let activeLearningPath: any = null
    try {
      // Exclude 'Learning Journey' cache rows managed by the dedicated Learning page
      const { data: pathRow } = await supabase
        .from('learning_paths')
        .select('id, title, description, modules, created_at')
        .eq('user_id', user.id)
        .neq('title', 'Learning Journey')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (pathRow) {
        const rawModules = Array.isArray(pathRow.modules) ? pathRow.modules : []
        const steps = rawModules.slice(0, 3).map((m: any) => ({
          title: m.title || m.label || 'Next step',
          description: m.description || m.short_description || '',
          estimatedTime: m.estimatedTime || m.estimated_time || ''
        }))

        activeLearningPath = {
          id: pathRow.id,
          title: pathRow.title,
          description: pathRow.description,
          steps,
          updatedAt: pathRow.created_at
        }
      }
    } catch (pathErr) {
      // Optional feature — fail silently so profile still loads
      console.error('Error fetching active learning path snapshot:', pathErr)
    }

    // Use display_name if set, otherwise fall back to anonymous_id for privacy
    const publicName = profile.display_name || profile.anonymous_id || 'Anonymous User';

    const response = {
      id: profile.id,
      fullName: profile.full_name || user.email?.split('@')[0] || 'User', // Keep for backward compatibility in private views
      publicName, // New privacy-first public name
      displayName: profile.display_name, // User's chosen display name
      anonymousId: profile.anonymous_id, // Anonymous identifier
      email: user.email,
      avatar: profile.avatar_url,
      bio: profile.bio,
      gradeLevel: profile.grade_level || 'Not specified',
      interests: profile.interests || [],
      learningGoals: profile.learning_goals,
      role: profile.role,
      parentConsentGiven: profile.parent_consent_given,
      joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently',
      totalLearningTime,
      completedModules,
      currentStreak,
      totalXP,
      currentLevel,
      achievementsCount: achievementsCount || 0,
      recentActivity: formattedActivity,
      achievements: formattedAchievements,
      achievementDefinitions: ACHIEVEMENT_DEFINITIONS,
      categoryProgress: categoryProgress || [],
      activeLearningPath
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