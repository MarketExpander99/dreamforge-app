// Progress tracking utilities
import { createBrowserSupabaseClient } from './supabase-client'
import { useUser } from './user-context'

// Client-side helper functions
async function getUserProgressForContent(userId: string, contentId: string) {
  const supabase = createBrowserSupabaseClient()
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.warn('Database not available for user progress, using fallback data:', error.message)
    return null
  }

  return data
}

async function updateUserProgress(userId: string, contentId: string, updates: any) {
  const supabase = createBrowserSupabaseClient()

  // First check if progress exists
  const existing = await getUserProgressForContent(userId, contentId)

  if (existing) {
    // Update existing progress
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        ...updates,
        last_accessed_at: new Date().toISOString(),
        completed_at: updates.status === 'completed' ? new Date().toISOString() : existing.completed_at
      })
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .select()
      .single()

    if (error) {
      console.warn('Database not available for progress update, using fallback:', error.message)
      return null
    }

    return data
  } else {
    // Create new progress
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        content_id: contentId,
        status: updates.status || 'in_progress',
        progress_percentage: updates.progress_percentage || 0,
        time_spent: updates.time_spent || 0,
        last_accessed_at: new Date().toISOString(),
        completed_at: updates.status === 'completed' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.warn('Database not available for progress creation, using fallback:', error.message)
      return null
    }

    return data
  }
}

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
  const { user } = useUser()

  const updateProgress = async (update: ProgressUpdate) => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    try {
      const supabase = createBrowserSupabaseClient()

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
  }

  const markCompleted = async (contentId: string) => {
    return await updateProgress({
      contentId,
      status: 'completed',
      progressPercentage: 100
    })
  }

  const markStarted = async (contentId: string) => {
    return await updateProgress({
      contentId,
      status: 'in_progress',
      progressPercentage: 0
    })
  }

  const addTime = async (contentId: string, timeSpent: number) => {
    return await updateProgress({
      contentId,
      timeSpent
    })
  }

  const getProgress = async (contentId: string) => {
    if (!user) return null

    return await getUserProgressForContent(user.id, contentId)
  }

  const getAllProgress = async () => {
    if (!user) return []

    return await getUserProgress(user.id)
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
