// Achievement system utilities
import { useCallback } from 'react'
import { createBrowserSupabaseClient } from './supabase-client'

// Client-side helper functions
async function getUserProgress(userId: string) {
  const supabase = createBrowserSupabaseClient()
  const { data, error } = await supabase
    .from('user_progress')
    .select(`
      *,
      content:content_items(*, category:categories(*))
    `)
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false })

  if (error) {
    console.warn('Database not available for user progress, using fallback data:', error.message)
    return []
  }

  return data || []
}

async function getUserAchievements(userId: string) {
  const supabase = createBrowserSupabaseClient()
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) {
    console.warn('Database not available for user achievements, using fallback data:', error.message)
    return []
  }

  return data || []
}

export interface AchievementDefinition {
  type: string
  title: string
  description: string
  icon: string
  condition: (userId: string) => Promise<boolean>
}

export const achievementDefinitions: AchievementDefinition[] = [
  {
    type: 'first_steps',
    title: 'First Steps',
    description: 'Completed your first learning module',
    icon: '🎯',
    condition: async (userId: string) => {
      const progress = await getUserProgress(userId)
      return progress.some(p => p.status === 'completed')
    }
  },
  {
    type: 'science_explorer',
    title: 'Science Explorer',
    description: 'Completed 3 science modules',
    icon: '🔬',
    condition: async (userId: string) => {
      const progress = await getUserProgress(userId)
      const scienceCompleted = progress.filter(p =>
        p.status === 'completed' && p.content?.category?.name === 'Science'
      ).length
      return scienceCompleted >= 3
    }
  },
  {
    type: 'math_whiz',
    title: 'Math Whiz',
    description: 'Mastered multiplication basics',
    icon: '🧮',
    condition: async (userId: string) => {
      const progress = await getUserProgress(userId)
      return progress.some(p =>
        p.status === 'completed' && p.content_id === 'multiplication-basics'
      )
    }
  },
  {
    type: 'quiz_master',
    title: 'Quiz Master',
    description: 'Scored 100% on 5 quizzes',
    icon: '🏆',
    condition: async (userId: string) => {
      const progress = await getUserProgress(userId)
      const perfectQuizzes = progress.filter(p =>
        p.status === 'completed' &&
        p.content?.type === 'quiz' &&
        p.progress_percentage === 100
      ).length
      return perfectQuizzes >= 5
    }
  },
  {
    type: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Read 10 different topics',
    icon: '📚',
    condition: async (userId: string) => {
      const progress = await getUserProgress(userId)
      const uniqueTopics = new Set(progress.map(p => p.content_id))
      return uniqueTopics.size >= 10
    }
  },
  {
    type: 'streak_master',
    title: 'Streak Master',
    description: 'Maintained a 7-day learning streak',
    icon: '🔥',
    condition: async (userId: string) => {
      // This would require more complex streak calculation
      // For now, return false - would need daily activity tracking
      return false
    }
  }
]

export const achievementUtils = {
  async checkAndAwardAchievements(userId: string): Promise<{
    success: boolean
    newAchievements: Array<{ type: string; title: string; description: string; icon: string }>
    error?: string
  }> {
    try {
      const supabase = createBrowserSupabaseClient()

      // Get current user achievements
      const currentAchievements = await getUserAchievements(userId)
      const earnedTypes = new Set(currentAchievements.map(a => a.achievement_type))

      const newAchievements = []

      // Check each achievement
      for (const achievement of achievementDefinitions) {
        if (!earnedTypes.has(achievement.type)) {
          const conditionMet = await achievement.condition(userId)
          if (conditionMet) {
            // Award the achievement
            const { error } = await supabase
              .from('user_achievements')
              .insert({
                user_id: userId,
                achievement_type: achievement.type,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon
              })

            if (!error) {
              newAchievements.push({
                type: achievement.type,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon
              })
            }
          }
        }
      }

      return {
        success: true,
        newAchievements
      }
    } catch (error) {
      console.error('Achievement check error:', error)
      return {
        success: false,
        newAchievements: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },

  async getAchievementDefinitions(): Promise<AchievementDefinition[]> {
    return achievementDefinitions
  }
}

// Hook for React components to manage achievements
export function useAchievements() {
  const checkAchievements = useCallback(async (userId: string) => {
    return await achievementUtils.checkAndAwardAchievements(userId)
  }, [])

  const getDefinitions = useCallback(async () => {
    return await achievementUtils.getAchievementDefinitions()
  }, [])

  return {
    checkAchievements,
    getDefinitions
  }
}
