// Progress tracking utilities
import { createBrowserSupabaseClient } from './supabase-client'
import { getUserProgressForContent, updateUserProgress, getUserProgress } from './data'

export interface ProgressUpdate {
  contentId: string
  status?: 'not_started' | 'in_progress' | 'completed'
  progressPercentage?: number
  timeSpent?: number
}

export interface ProgressResult {
  success: boolean
  error?: string
  progress?: {
    id: string
    user_id: string
    content_id: string
    status: 'not_started' | 'in_progress' | 'completed'
    progress_percentage: number
    time_spent: number
    completed_at: string | null
    last_accessed_at: string
    created_at: string
  } | null
}

// Client-side progress functions for interactive components
export const progressUtils = {
  async updateProgress(update: ProgressUpdate): Promise<ProgressResult> {
    try {
      const supabase = createBrowserSupabaseClient()

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return {
          success: false,
          error: 'User not authenticated'
        }
      }

      // Get existing progress
      const existingProgress = await getUserProgressForContent(user.id, update.contentId)

      // Calculate new progress
      const newProgress = {
        status: update.status || existingProgress?.status || 'in_progress',
        progress_percentage: update.progressPercentage ?? existingProgress?.progress_percentage ?? 0,
        time_spent: (existingProgress?.time_spent || 0) + (update.timeSpent || 0)
      }

      // Update progress
      const result = await updateUserProgress(user.id, update.contentId, newProgress)

      return {
        success: !!result,
        progress: result,
        error: result ? undefined : 'Failed to update progress'
      }
    } catch (error) {
      console.error('Progress update error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  },

  async markAsCompleted(contentId: string): Promise<ProgressResult> {
    return await this.updateProgress({
      contentId,
      status: 'completed',
      progressPercentage: 100
    })
  },

  async markAsStarted(contentId: string): Promise<ProgressResult> {
    return await this.updateProgress({
      contentId,
      status: 'in_progress',
      progressPercentage: 0
    })
  },

  async addTimeSpent(contentId: string, timeSpent: number): Promise<ProgressResult> {
    return await this.updateProgress({
      contentId,
      timeSpent
    })
  },

  async getProgress(contentId: string) {
    try {
      const supabase = createBrowserSupabaseClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return null
      }

      return await getUserProgressForContent(user.id, contentId)
    } catch (error) {
      console.error('Get progress error:', error)
      return null
    }
  },

  async getAllProgress() {
    try {
      const supabase = createBrowserSupabaseClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return []
      }

      return await getUserProgress(user.id)
    } catch (error) {
      console.error('Get all progress error:', error)
      return []
    }
  }
}

// Hook for React components to manage progress
export function useProgress() {
  const updateProgress = async (update: ProgressUpdate) => {
    return await progressUtils.updateProgress(update)
  }

  const markCompleted = async (contentId: string) => {
    return await progressUtils.markAsCompleted(contentId)
  }

  const markStarted = async (contentId: string) => {
    return await progressUtils.markAsStarted(contentId)
  }

  const addTime = async (contentId: string, timeSpent: number) => {
    return await progressUtils.addTimeSpent(contentId, timeSpent)
  }

  const getProgress = async (contentId: string) => {
    return await progressUtils.getProgress(contentId)
  }

  const getAllProgress = async () => {
    return await progressUtils.getAllProgress()
  }

  return {
    updateProgress,
    markCompleted,
    markStarted,
    addTime,
    getProgress,
    getAllProgress
  }
}