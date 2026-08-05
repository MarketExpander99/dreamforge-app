/**
 * Phase 6 — Gamification constants & pure helpers.
 * Shared by server actions and UI components.
 * XP numbers and daily caps are tunable after seeing real usage.
 *
 * Streaks and daily caps use **UTC calendar days** (server day).
 * Documented for users: consistent worldwide, may not match local midnight.
 */

export const LEVEL_XP_BASE = 150

/** XP awarded per core action (before achievement bonuses). */
export const XP_REWARDS = {
  path_generated: 50,
  lesson_completed: 15, // aligned with existing feed complete messaging
  daily_login: 20,
} as const

/**
 * Simple anti-farm daily caps (count of awards with amount > 0 per UTC day).
 * path: 1 high-value award/day
 * lesson: generous study day
 * daily_login: once (also enforced by reference_id = UTC date)
 */
export const DAILY_CAPS: Record<'path_generated' | 'lesson_completed' | 'daily_login', number> = {
  path_generated: 1,
  lesson_completed: 50,
  daily_login: 1,
}

export type XpSource =
  | 'path_generated'
  | 'lesson_completed'
  | 'daily_login'
  | 'achievement_unlock'

/** Core earning sources that callers pass to awardXP (not achievement_unlock). */
export type AwardableXpSource = Exclude<XpSource, 'achievement_unlock'>

export type AwardSkipReason =
  | 'already_awarded'
  | 'daily_cap'
  | 'missing_reference'
  | 'invalid_source'

export type AwardErrorCode =
  | 'unauthenticated'
  | 'invalid_source'
  | 'missing_reference'
  | 'missing_migration'
  | 'db_error'
  | 'unknown'

export interface LevelProgress {
  level: number
  totalXp: number
  xpForCurrentLevel: number
  xpIntoLevel: number
  xpToNextLevel: number
  progressPercent: number
}

/**
 * Level formula (simple & motivating):
 * Level 1: 0–149 XP, Level 2: 150–299, Level 3: 300–449, …
 */
export function computeLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp || 0))
  const level = 1 + Math.floor(safeXp / LEVEL_XP_BASE)
  const xpForCurrentLevel = (level - 1) * LEVEL_XP_BASE
  const xpIntoLevel = safeXp - xpForCurrentLevel
  const xpToNextLevel = LEVEL_XP_BASE
  const progressPercent = Math.min(
    100,
    Math.floor((xpIntoLevel / LEVEL_XP_BASE) * 100)
  )

  return {
    level,
    totalXp: safeXp,
    xpForCurrentLevel,
    xpIntoLevel,
    xpToNextLevel,
    progressPercent,
  }
}

export function levelFromTotalXp(totalXp: number): number {
  return computeLevelProgress(totalXp).level
}

/** Phase 6 starter achievements — stored in user_achievements.achievement_type */
export interface AchievementDefinition {
  type: string
  title: string
  description: string
  icon: string
  xpBonus: number
}

export const PHASE6_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    type: 'first_path',
    title: 'First Steps',
    description: 'Generate your first learning path',
    icon: '🛤️',
    xpBonus: 100,
  },
  {
    type: 'path_pioneer',
    title: 'Path Pioneer',
    description: 'Generate 5 learning paths',
    icon: '🗺️',
    xpBonus: 150,
  },
  {
    type: 'seven_day_streak',
    title: 'Consistent Learner',
    description: 'Maintain a 7-day study streak',
    icon: '🔥',
    xpBonus: 200,
  },
  {
    type: 'lesson_lover',
    title: 'Knowledge Seeker',
    description: 'Complete 10 lessons',
    icon: '📚',
    xpBonus: 120,
  },
  {
    type: 'level_five',
    title: 'Rising Star',
    description: 'Reach Level 5',
    icon: '⭐',
    xpBonus: 250,
  },
]

export function getAchievementByType(
  type: string
): AchievementDefinition | undefined {
  return PHASE6_ACHIEVEMENTS.find((a) => a.type === type)
}

/** UTC calendar date YYYY-MM-DD (server-day streaks). */
export function utcDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/** Yesterday's UTC date string relative to `today` (YYYY-MM-DD). */
export function utcYesterdayString(today: string): string {
  const d = new Date(`${today}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export interface UserGamificationRow {
  user_id: string
  total_xp: number
  current_level: number
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  paths_generated_count: number
  lessons_completed_count: number
  updated_at?: string
}

/**
 * Pure streak update for a qualifying activity on `today` (UTC date string).
 * Returns next streak fields; does not mutate input.
 */
export function applyStreakOnActivity(
  row: Pick<
    UserGamificationRow,
    'current_streak' | 'longest_streak' | 'last_activity_date'
  >,
  today: string
): {
  current_streak: number
  longest_streak: number
  last_activity_date: string
  isNewDay: boolean
} {
  const last = row.last_activity_date
    ? String(row.last_activity_date).slice(0, 10)
    : null

  // Already active today — streak unchanged
  if (last === today) {
    return {
      current_streak: Math.max(0, row.current_streak || 0),
      longest_streak: Math.max(0, row.longest_streak || 0),
      last_activity_date: today,
      isNewDay: false,
    }
  }

  const yesterday = utcYesterdayString(today)
  let current_streak: number

  if (last === yesterday) {
    current_streak = (row.current_streak || 0) + 1
  } else {
    // null, gap, or future anomaly → reset
    current_streak = 1
  }

  const longest_streak = Math.max(row.longest_streak || 0, current_streak)

  return {
    current_streak,
    longest_streak,
    last_activity_date: today,
    isNewDay: true,
  }
}

/**
 * Decide primary XP amount under daily cap.
 * Returns 0 amount when capped (caller may still write a marker row for idempotency).
 */
export function resolvePrimaryXpAmount(
  source: AwardableXpSource,
  baseAmount: number,
  awardsWithPositiveXpToday: number
): { amount: number; capped: boolean } {
  const cap = DAILY_CAPS[source]
  if (typeof cap === 'number' && awardsWithPositiveXpToday >= cap) {
    return { amount: 0, capped: true }
  }
  return { amount: Math.max(0, baseAmount), capped: false }
}

/** path_generated and lesson_completed require a stable reference for idempotency. */
export function requiresReferenceId(source: AwardableXpSource): boolean {
  return source === 'path_generated' || source === 'lesson_completed'
}

export interface AwardFeedbackInput {
  success?: boolean
  awarded?: boolean
  skipped?: boolean
  skipReason?: string
  xpGained?: number
  leveledUp?: boolean
  dailyLoginAwarded?: boolean
  newAchievements?: Array<{ title: string; icon?: string }>
  error?: string
  errorCode?: string
}

/**
 * Build a short, human-friendly line for toasts / inline messages.
 * Pure — safe on client and server.
 */
export function formatAwardFeedback(
  input: AwardFeedbackInput,
  fallbackSuccess = 'Done!'
): string {
  if (input.error) {
    if (input.errorCode === 'missing_migration') {
      return 'Progress saved. XP tracking is not set up yet.'
    }
    if (input.errorCode === 'unauthenticated') {
      return 'Sign in to earn XP.'
    }
    return input.error
  }

  if (input.skipped && input.skipReason === 'already_awarded') {
    return 'Already counted — no extra XP.'
  }

  if (input.skipped && input.skipReason === 'daily_cap') {
    return 'Daily XP limit for this action reached. Come back tomorrow!'
  }

  const parts: string[] = []
  const xp = input.xpGained ?? 0

  if (xp > 0) {
    parts.push(`+${xp} XP`)
  }

  if (input.dailyLoginAwarded && xp > 0) {
    // Daily bonus is included in xpGained; subtle tag for delight
    parts.push('daily bonus')
  }

  if (input.leveledUp) {
    parts.push('Level up!')
  }

  if (input.newAchievements && input.newAchievements.length > 0) {
    const a = input.newAchievements[0]
    parts.push(`${a.icon ? a.icon + ' ' : ''}${a.title}`)
  }

  if (parts.length === 0) {
    return fallbackSuccess
  }

  return parts.join(' · ')
}
