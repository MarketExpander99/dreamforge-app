'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import {
  type AwardableXpSource,
  type UserGamificationRow,
  type AchievementDefinition,
  type AwardSkipReason,
  type AwardErrorCode,
  XP_REWARDS,
  DAILY_CAPS,
  PHASE6_ACHIEVEMENTS,
  levelFromTotalXp,
  computeLevelProgress,
  utcDateString,
  applyStreakOnActivity,
  resolvePrimaryXpAmount,
  requiresReferenceId,
  formatAwardFeedback,
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
  errorCode?: AwardErrorCode
  /** True when any XP was granted or achievements unlocked. */
  awarded?: boolean
  skipped?: boolean
  skipReason?: AwardSkipReason
  xpGained?: number
  /** Primary action XP only (before daily bonus + achievement bonuses). */
  primaryXp?: number
  dailyXp?: number
  achievementBonusXp?: number
  newTotalXp?: number
  newLevel?: number
  leveledUp?: boolean
  previousLevel?: number
  currentStreak?: number
  longestStreak?: number
  dailyLoginAwarded?: boolean
  newAchievements?: NewAchievementResult[]
  /** Ready-to-show toast / inline message */
  message?: string
}

export interface GetGamificationResult {
  success: boolean
  error?: string
  errorCode?: AwardErrorCode
  stats?: UserGamificationRow | null
  progress?: ReturnType<typeof computeLevelProgress>
  /** True when last_activity_date is today (UTC) — streak is "alive" for the day. */
  streakActiveToday?: boolean
  /** True when daily_login XP already earned for today (UTC). */
  dailyBonusClaimedToday?: boolean
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

function isMissingTableError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false
  const msg = String(err.message || '')
  return (
    err.code === '42P01' ||
    msg.includes('relation') ||
    msg.includes('does not exist') ||
    msg.includes('Could not find the table') ||
    msg.toLowerCase().includes('schema cache')
  )
}

/**
 * Ensures a user_gamification row exists (legacy users). Idempotent.
 * Fail-closed: any error is returned so callers do not overwrite real stats with zeros.
 */
async function ensureGamificationRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<{ row: UserGamificationRow | null; error?: string; errorCode?: AwardErrorCode }> {
  const { data: existing, error: selectErr } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (selectErr) {
    console.error('ensureGamificationRow select:', selectErr)
    if (isMissingTableError(selectErr)) {
      return {
        row: null,
        error:
          'Gamification tables not found. Run scripts/2026-07-09-add-gamification.sql in Supabase SQL Editor.',
        errorCode: 'missing_migration',
      }
    }
    return {
      row: null,
      error: selectErr.message || 'Failed to load gamification stats',
      errorCode: 'db_error',
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
    const { data: retry, error: retryErr } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (retry) return { row: retry as UserGamificationRow }

    console.error('ensureGamificationRow insert:', insertErr, retryErr)
    if (isMissingTableError(insertErr)) {
      return {
        row: null,
        error:
          'Gamification tables not found. Run scripts/2026-07-09-add-gamification.sql in Supabase SQL Editor.',
        errorCode: 'missing_migration',
      }
    }
    return {
      row: null,
      error: insertErr.message || 'Failed to create gamification row',
      errorCode: 'db_error',
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
): Promise<{ ok: boolean; duplicate: boolean; error?: string; errorCode?: AwardErrorCode }> {
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
    if (isMissingTableError(error)) {
      return {
        ok: false,
        duplicate: false,
        error:
          'Gamification tables not found. Run scripts/2026-07-09-add-gamification.sql in Supabase SQL Editor.',
        errorCode: 'missing_migration',
      }
    }
    return { ok: false, duplicate: false, error: error.message, errorCode: 'db_error' }
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
  const { count, error } = await supabase
    .from('xp_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', source)
    .gt('amount', 0) // only count real awards toward daily cap
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd)

  if (error) {
    console.error('countSourceToday:', error)
    return 0
  }

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

function skippedResult(
  stats: UserGamificationRow,
  previousLevel: number,
  skipReason: AwardSkipReason
): AwardXpResult {
  const base: AwardXpResult = {
    success: true,
    awarded: false,
    skipped: true,
    skipReason,
    xpGained: 0,
    primaryXp: 0,
    dailyXp: 0,
    achievementBonusXp: 0,
    newTotalXp: stats.total_xp,
    newLevel: stats.current_level,
    leveledUp: false,
    previousLevel,
    currentStreak: stats.current_streak,
    longestStreak: stats.longest_streak,
    dailyLoginAwarded: false,
    newAchievements: [],
  }
  base.message = formatAwardFeedback(base)
  return base
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Single source of truth for XP, level, streak, and Phase 6 achievements.
 *
 * Guards (Slice 3):
 * - Auth required
 * - Stable referenceId required for path_generated / lesson_completed
 * - Idempotent per (user, source, reference_id)
 * - Per-source daily caps (UTC)
 * - daily_login once per UTC day (lazy on first action, or explicit call)
 * - Fail-closed if migration missing (never zeros out real stats)
 * - Never throws to the client
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
      const result: AwardXpResult = {
        success: false,
        error: 'Invalid XP source',
        errorCode: 'invalid_source',
      }
      result.message = formatAwardFeedback(result)
      return result
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const result: AwardXpResult = {
        success: false,
        error: 'You must be signed in to earn XP',
        errorCode: 'unauthenticated',
      }
      result.message = formatAwardFeedback(result)
      return result
    }

    const today = utcDateString()
    const baseAmount: number = XP_REWARDS[source]

    // Idempotency: require stable refs for path/lesson (no silent random awards)
    const trimmedRef = referenceId?.trim() || ''
    if (requiresReferenceId(source) && !trimmedRef) {
      const result: AwardXpResult = {
        success: false,
        error: 'A stable reference id is required to award XP for this action',
        errorCode: 'missing_reference',
      }
      result.message = formatAwardFeedback(result)
      return result
    }

    const effectiveRef =
      source === 'daily_login' ? today : trimmedRef || today

    const ensured = await ensureGamificationRow(supabase, user.id)
    if (!ensured.row) {
      const result: AwardXpResult = {
        success: false,
        error: ensured.error || 'Failed to load gamification stats',
        errorCode: ensured.errorCode || 'db_error',
      }
      result.message = formatAwardFeedback(result)
      return result
    }

    let stats = { ...ensured.row }
    const previousLevel = stats.current_level || 1

    // Idempotency: same event already recorded
    if (await hasExistingTransaction(supabase, user.id, source, effectiveRef)) {
      return skippedResult(stats, previousLevel, 'already_awarded')
    }

    // Daily cap (positive XP awards only)
    const awardsToday = await countSourceToday(supabase, user.id, source, today)
    const resolved = resolvePrimaryXpAmount(source, baseAmount, awardsToday)
    const primaryXp = resolved.amount
    let skipReason: AwardSkipReason | undefined = resolved.capped
      ? 'daily_cap'
      : undefined

    // Primary transaction (amount 0 allowed when daily-capped — keeps idempotency)
    const primaryTx = await insertXpTransaction(
      supabase,
      user.id,
      primaryXp,
      source,
      effectiveRef
    )
    if (primaryTx.duplicate) {
      return skippedResult(stats, previousLevel, 'already_awarded')
    }
    if (!primaryTx.ok) {
      const result: AwardXpResult = {
        success: false,
        error: primaryTx.error || 'Failed to record XP transaction',
        errorCode: primaryTx.errorCode || 'db_error',
      }
      result.message = formatAwardFeedback(result)
      return result
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

    // Daily login bonus: once per UTC day (independent of isNewDay for recovery safety)
    let dailyLoginAwarded = false
    let dailyXp = 0
    if (source !== 'daily_login') {
      const alreadyDaily = await hasExistingTransaction(
        supabase,
        user.id,
        'daily_login',
        today
      )
      if (!alreadyDaily) {
        // Respect daily_login cap (should always be free if no row)
        const dailyCount = await countSourceToday(
          supabase,
          user.id,
          'daily_login',
          today
        )
        const dailyResolved = resolvePrimaryXpAmount(
          'daily_login',
          XP_REWARDS.daily_login,
          dailyCount
        )
        if (dailyResolved.amount > 0) {
          const dailyTx = await insertXpTransaction(
            supabase,
            user.id,
            dailyResolved.amount,
            'daily_login',
            today
          )
          if (dailyTx.ok) {
            dailyXp = dailyResolved.amount
            dailyLoginAwarded = true
          }
        }
      }
    } else if (primaryXp > 0) {
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
      const result: AwardXpResult = {
        success: false,
        error: updateErr.message || 'Failed to update gamification stats',
        errorCode: isMissingTableError(updateErr) ? 'missing_migration' : 'db_error',
      }
      result.message = formatAwardFeedback(result)
      return result
    }

    try {
      revalidatePath('/profile')
    } catch {
      // ignore outside request context
    }

    // Pure daily-cap skip (no XP at all this call)
    const fullySkippedForCap =
      primaryXp === 0 &&
      skipReason === 'daily_cap' &&
      totalXpGained === 0 &&
      achResult.newAchievements.length === 0

    const result: AwardXpResult = {
      success: true,
      awarded: totalXpGained > 0 || achResult.newAchievements.length > 0,
      skipped: fullySkippedForCap || (primaryXp === 0 && skipReason === 'daily_cap' && dailyXp === 0 && achResult.bonusXp === 0),
      skipReason: primaryXp === 0 && skipReason === 'daily_cap' ? 'daily_cap' : undefined,
      xpGained: totalXpGained,
      primaryXp,
      dailyXp,
      achievementBonusXp: achResult.bonusXp,
      newTotalXp: stats.total_xp,
      newLevel,
      leveledUp,
      previousLevel,
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak,
      dailyLoginAwarded,
      newAchievements: achResult.newAchievements,
    }
    result.message = formatAwardFeedback(result, 'Activity recorded')
    return result
  } catch (err) {
    console.error('awardXP exception:', err)
    const result: AwardXpResult = {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error awarding XP',
      errorCode: 'unknown',
    }
    result.message = formatAwardFeedback(result)
    return result
  }
}

/**
 * Lightweight explicit daily activity claim (optional).
 * Prefer relying on lazy daily bonus inside awardXP from path/lesson actions.
 * Safe to call on app open for authenticated users; fully idempotent per UTC day.
 */
export async function claimDailyActivity(): Promise<AwardXpResult> {
  return awardXP('daily_login')
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
      return { success: false, error: 'Unauthorized', errorCode: 'unauthenticated' }
    }

    const ensured = await ensureGamificationRow(supabase, user.id)
    if (!ensured.row) {
      return {
        success: false,
        error: ensured.error || 'Failed to load stats',
        errorCode: ensured.errorCode || 'db_error',
        stats: null,
      }
    }

    const stats = ensured.row
    const progress = computeLevelProgress(stats.total_xp || 0)
    const today = utcDateString()
    const last = stats.last_activity_date
      ? String(stats.last_activity_date).slice(0, 10)
      : null
    const streakActiveToday = last === today
    const dailyBonusClaimedToday = await hasExistingTransaction(
      supabase,
      user.id,
      'daily_login',
      today
    )

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
      streakActiveToday,
      dailyBonusClaimedToday,
      achievements,
    }
  } catch (err) {
    console.error('getUserGamification exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
      errorCode: 'unknown',
    }
  }
}

