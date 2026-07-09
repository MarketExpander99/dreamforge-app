/**
 * Phase 6 — Gamification constants & pure helpers.
 * Shared by server actions and (later) UI components.
 * XP numbers are tunable after seeing real usage.
 */

export const LEVEL_XP_BASE = 150

/** XP awarded per core action (before achievement bonuses). */
export const XP_REWARDS = {
  path_generated: 50,
  lesson_completed: 15, // aligned with existing feed complete messaging
  daily_login: 20,
} as const

export type XpSource =
  | 'path_generated'
  | 'lesson_completed'
  | 'daily_login'
  | 'achievement_unlock'

/** Core earning sources that callers pass to awardXP (not achievement_unlock). */
export type AwardableXpSource = Exclude<XpSource, 'achievement_unlock'>

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

/** UTC calendar date YYYY-MM-DD (server-day streaks — documented in Phase 6 spec). */
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
      current_streak: row.current_streak,
      longest_streak: row.longest_streak,
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
