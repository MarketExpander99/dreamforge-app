'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import {
  type AwardableXpSource,
  type UserGamificationRow,
  type AchievementDefinition,
  XP_REWARDS,
  PHASE6_ACHIEVEMENTS,
  levelFromTotalXp,
  computeLevelProgress,
  utcDateString,
  applyStreakOnActivity,
} from '@/lib/gamification'

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface NewAchievementResult {
  type: string
  title: string
  description: string
  icon: string
  xpBonus: number
}

export interface AwardXpResult {
  success: boolean
  error?: string
  /** True when any XP was granted or achievements unlocked. */
  awarded?: boolean
  skipped?: boolean
  skipReason?: string
  xpGained?: number
  newTotalXp?: number
  newLevel?: number
  leveledUp?: boolean
  previousLevel?: number
  currentStreak?: number
  longestStreak?: number
  dailyLoginAwarded?: boolean
  newAchievements?: NewAchievementResult[]
}

export interface GetGamificationResult {
  success: boolean
  error?: string
  stats?: UserGamificationRow | null
  progress?: ReturnType<typeof computeLevelProgress>
  achievements?: Array<{
    type: string
    title: string
    description: string
    icon: string
    earnedAt: string | null
    unlocked: boolean
    xpBonus: number
  }>
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emptyGamification(userId: string): UserGamificationRow {
  return {
    user_id: userId,
    total_xp: 0,
    current_level: 1,
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    paths_generated_count: 0,
    lessons_completed_count: 0,
  }
}

/**
 * Ensures a user_gamification row exists (legacy users). Idempotent.
 */
async function ensureGamificationRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<{ row: UserGamificationRow; error?: string }> {
  const { data: existing, error: selectErr } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (selectErr) {
    console.error('ensureGamificationRow select:', selectErr)
    const missingTable =
      selectErr.code === '42P01' ||
      String(selectErr.message || '').includes('relation') ||
      String(selectErr.message || '').includes('does not exist')
    return {
      row: emptyGamification(userId),
      error: missingTable
        ? 'Gamification tables not found. Run scripts/2026-07-09-add-gamification.sql in Supabase SQL Editor.'
        : selectErr.message || 'Failed to load gamification stats',
    }
  }

  if (existing) {
    return { row: existing as UserGamificationRow }
  }

  const seed = emptyGamification(userId)
  const { data: inserted, error: insertErr } = await supabase
    .from('user_gamification')
    .insert(seed)
    .select('*')
    .single()

  if (insertErr) {
    // Race: another request may have inserted first
    const { data: retry } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (retry) return { row: retry as UserGamificationRow }

    console.error('ensureGamificationRow insert:', insertErr)
    return {
      row: seed,
      error: insertErr.message || 'Failed to create gamification row',
    }
  }

  return { row: (inserted || seed) as UserGamificationRow }
}

async function hasExistingTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  source: string,
  referenceId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('xp_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('source', source)
    .eq('reference_id', referenceId)
    .maybeSingle()

  return Boolean(data)
}

/**
 * Inserts an XP transaction. Returns duplicate=true on unique conflict.
 */
async function insertXpTransaction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  amount: number,
  source: string,
  referenceId: string | null
): Promise<{ ok: boolean; duplicate: boolean; error?: string }> {
  const { error } = await supabase.from('xp_transactions').insert({
    user_id: userId,
    amount,
    source,
    reference_id: referenceId,
  })

  if (error) {
    if (error.code === '23505') {
      return { ok: false, duplicate: true }
    }
    console.error('insertXpTransaction:', error)
    return { ok: false, duplicate: false, error: error.message }
  }

  return { ok: true, duplicate: false }
}

async function countSourceToday(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  source: string,
  today: string
): Promise<number> {
  const dayStart = `${today}T00:00:00.000Z`
  const dayEnd = `${today}T23:59:59.999Z`
  const { count } = await supabase
    .from('xp_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', source)
    .gt('amount', 0) // only count real awards toward daily cap
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd)

  return count || 0
}

/**
 * Checks Phase 6 achievement rules against updated stats.
 * Awards unlocks + bonus XP inline (no recursive awardXP).
 */
async function checkAndUnlockAchievements(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  stats: UserGamificationRow
): Promise<{
  newAchievements: NewAchievementResult[]
  bonusXp: number
  stats: UserGamificationRow
}> {
  const { data: earnedRows } = await supabase
    .from('user_achievements')
    .select('achievement_type')
    .eq('user_id', userId)

  const earned = new Set(
    (earnedRows || []).map(
      (r: { achievement_type: string }) => r.achievement_type
    )
  )

  const candidates: AchievementDefinition[] = []

  for (const def of PHASE6_ACHIEVEMENTS) {
    if (earned.has(def.type)) continue

    let met = false
    switch (def.type) {
      case 'first_path':
        met = stats.paths_generated_count >= 1
        break
      case 'path_pioneer':
        met = stats.paths_generated_count >= 5
        break
      case 'seven_day_streak':
        met = stats.current_streak >= 7 || stats.longest_streak >= 7
        break
      case 'lesson_lover':
        met = stats.lessons_completed_count >= 10
        break
      case 'level_five':
        met = stats.current_level >= 5
        break
      default:
        met = false
    }

    if (met) candidates.push(def)
  }

  const newAchievements: NewAchievementResult[] = []
  let bonusXp = 0
  let working = { ...stats }

  for (const def of candidates) {
    const { error: achErr } = await supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_type: def.type,
      title: def.title,
      description: def.description,
      icon: def.icon,
    })

    if (achErr) {
      if (achErr.code !== '23505') {
        console.error('achievement insert failed:', def.type, achErr)
      }
      continue
    }

    if (def.xpBonus > 0) {
      const tx = await insertXpTransaction(
        supabase,
        userId,
        def.xpBonus,
        'achievement_unlock',
        def.type
      )
      if (tx.ok) {
        bonusXp += def.xpBonus
        working.total_xp = (working.total_xp || 0) + def.xpBonus
        working.current_level = levelFromTotalXp(working.total_xp)
      }
    }

    newAchievements.push({
      type: def.type,
      title: def.title,
      description: def.description,
      icon: def.icon,
      xpBonus: def.xpBonus,
    })
  }

  return { newAchievements, bonusXp, stats: working }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Single source of truth for XP, level, streak, and Phase 6 achievements.
 *
 * @param source - path_generated | lesson_completed | daily_login
 * @param referenceId - path id, card/lesson id; daily_login uses UTC date automatically
 *
 * Never throws to the client — always returns a structured result.
 */
export async function awardXP(
  source: AwardableXpSource,
  referenceId?: string | null
): Promise<AwardXpResult> {
  try {
    if (
      source !== 'path_generated' &&
      source !== 'lesson_completed' &&
      source !== 'daily_login'
    ) {
      return { success: false, error: 'Invalid XP source' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be signed in to earn XP' }
    }

    const today = utcDateString()
    const baseAmount: number = XP_REWARDS[source]
    const effectiveRef =
      source === 'daily_login'
        ? today
        : referenceId?.trim() || `${source}-${today}-${user.id.slice(0, 8)}`

    const ensured = await ensureGamificationRow(supabase, user.id)
    if (ensured.error?.includes('not found')) {
      return { success: false, error: ensured.error }
    }

    let stats = { ...ensured.row }
    const previousLevel = stats.current_level || 1

    // Idempotency: same event already recorded
    if (await hasExistingTransaction(supabase, user.id, source, effectiveRef)) {
      return {
        success: true,
        awarded: false,
        skipped: true,
        skipReason: 'already_awarded',
        xpGained: 0,
        newTotalXp: stats.total_xp,
        newLevel: stats.current_level,
        leveledUp: false,
        previousLevel,
        currentStreak: stats.current_streak,
        longestStreak: stats.longest_streak,
        newAchievements: [],
      }
    }

    // Daily cap: max 1 path_generated award (amount > 0) per UTC day
    let primaryXp: number = baseAmount
    let skipReason: string | undefined
    if (source === 'path_generated') {
      const awardedToday = await countSourceToday(
        supabase,
        user.id,
        'path_generated',
        today
      )
      if (awardedToday >= 1) {
        primaryXp = 0 // marker row still written for idempotency + counter
        skipReason = 'daily_cap'
      }
    }

    // Primary transaction (amount 0 allowed when daily-capped)
    const primaryTx = await insertXpTransaction(
      supabase,
      user.id,
      primaryXp,
      source,
      effectiveRef
    )
    if (primaryTx.duplicate) {
      return {
        success: true,
        awarded: false,
        skipped: true,
        skipReason: 'already_awarded',
        xpGained: 0,
        newTotalXp: stats.total_xp,
        newLevel: stats.current_level,
        leveledUp: false,
        previousLevel,
        currentStreak: stats.current_streak,
        longestStreak: stats.longest_streak,
        newAchievements: [],
      }
    }
    if (!primaryTx.ok) {
      return {
        success: false,
        error: primaryTx.error || 'Failed to record XP transaction',
      }
    }

    // Counters (once per unique reference after idempotency)
    if (source === 'path_generated') {
      stats.paths_generated_count = (stats.paths_generated_count || 0) + 1
    }
    if (source === 'lesson_completed') {
      stats.lessons_completed_count = (stats.lessons_completed_count || 0) + 1
    }

    // Streak (all awardable sources count as activity)
    const streak = applyStreakOnActivity(stats, today)
    stats.current_streak = streak.current_streak
    stats.longest_streak = streak.longest_streak
    stats.last_activity_date = streak.last_activity_date

    // Daily login bonus: first qualifying action of the UTC day
    let dailyLoginAwarded = false
    let dailyXp = 0
    if (source !== 'daily_login' && streak.isNewDay) {
      const alreadyDaily = await hasExistingTransaction(
        supabase,
        user.id,
        'daily_login',
        today
      )
      if (!alreadyDaily) {
        const dailyTx = await insertXpTransaction(
          supabase,
          user.id,
          XP_REWARDS.daily_login,
          'daily_login',
          today
        )
        if (dailyTx.ok) {
          dailyXp = XP_REWARDS.daily_login
          dailyLoginAwarded = true
        }
      }
    } else if (source === 'daily_login' && primaryXp > 0) {
      dailyLoginAwarded = true
    }

    const xpGainedBeforeAchievements = primaryXp + dailyXp
    stats.total_xp = (stats.total_xp || 0) + xpGainedBeforeAchievements
    stats.current_level = levelFromTotalXp(stats.total_xp)

    // Achievements (bonus XP applied inline — no recursion)
    const achResult = await checkAndUnlockAchievements(supabase, user.id, stats)
    stats = achResult.stats
    const totalXpGained = xpGainedBeforeAchievements + achResult.bonusXp
    const newLevel = stats.current_level
    const leveledUp = newLevel > previousLevel

    const { error: updateErr } = await supabase
      .from('user_gamification')
      .update({
        total_xp: stats.total_xp,
        current_level: stats.current_level,
        current_streak: stats.current_streak,
        longest_streak: stats.longest_streak,
        last_activity_date: stats.last_activity_date,
        paths_generated_count: stats.paths_generated_count,
        lessons_completed_count: stats.lessons_completed_count,
      })
      .eq('user_id', user.id)

    if (updateErr) {
      console.error('user_gamification update failed:', updateErr)
      return {
        success: false,
        error: updateErr.message || 'Failed to update gamification stats',
      }
    }

    try {
      revalidatePath('/profile')
    } catch {
      // ignore outside request context
    }

    return {
      success: true,
      awarded: totalXpGained > 0 || achResult.newAchievements.length > 0,
      skipped: primaryXp === 0 && skipReason === 'daily_cap' && totalXpGained === 0,
      skipReason: primaryXp === 0 ? skipReason : undefined,
      xpGained: totalXpGained,
      newTotalXp: stats.total_xp,
      newLevel,
      leveledUp,
      previousLevel,
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak,
      dailyLoginAwarded,
      newAchievements: achResult.newAchievements,
    }
  } catch (err) {
    console.error('awardXP exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error awarding XP',
    }
  }
}

/**
 * Read current gamification snapshot + achievement unlock state for the signed-in user.
 * Safe for UI (Slice 4). Creates empty row if missing.
 */
export async function getUserGamification(): Promise<GetGamificationResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    const ensured = await ensureGamificationRow(supabase, user.id)
    if (ensured.error?.includes('not found')) {
      return { success: false, error: ensured.error, stats: null }
    }

    const stats = ensured.row
    const progress = computeLevelProgress(stats.total_xp || 0)

    const { data: earnedRows } = await supabase
      .from('user_achievements')
      .select('achievement_type, title, description, icon, earned_at')
      .eq('user_id', user.id)

    const earnedMap = new Map(
      (earnedRows || []).map(
        (r: {
          achievement_type: string
          title: string
          description: string
          icon: string
          earned_at: string
        }) => [r.achievement_type, r]
      )
    )

    const achievements = PHASE6_ACHIEVEMENTS.map((def) => {
      const row = earnedMap.get(def.type)
      return {
        type: def.type,
        title: def.title,
        description: def.description,
        icon: def.icon,
        xpBonus: def.xpBonus,
        unlocked: Boolean(row),
        earnedAt: row?.earned_at ?? null,
      }
    })

    return {
      success: true,
      stats,
      progress,
      achievements,
    }
  } catch (err) {
    console.error('getUserGamification exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}
