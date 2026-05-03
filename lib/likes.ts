// Likes management utilities
import { useCallback } from 'react'
import { createBrowserSupabaseClient } from './supabase-client'
import { useUser } from './user-context'

export interface LikeResult {
  success: boolean
  error?: string
  isLiked?: boolean
}

// Client-side likes functions for interactive components
export const likeUtils = {
  async toggleLike(contentId: string): Promise<LikeResult> {
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

      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single()

      // Handle different error codes:
      // PGRST116: No rows found (expected when user hasn't liked the content)
      // PGRST205: Table not found (database schema not applied)
      if (checkError) {
        if (checkError.code === 'PGRST116') {
          // No like found - this is expected behavior, continue to add like
        } else if (checkError.code === 'PGRST205') {
          // Table doesn't exist - log warning and return error
          console.warn('Database table "user_likes" not found. Please apply the database schema.')
          return {
            success: false,
            error: 'Database table not found. Please contact support.'
          }
        } else {
          // Other errors
          console.error('Error checking like status:', checkError)
          return {
            success: false,
            error: 'Failed to check like status'
          }
        }
      }

      const currentlyLiked = !!existingLike

      if (currentlyLiked) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId)

        if (deleteError) {
          console.error('Error removing like:', deleteError)
          return {
            success: false,
            error: 'Failed to remove like'
          }
        }

        return {
          success: true,
          isLiked: false
        }
      } else {
        // Add like
        const { data: newLike, error: insertError } = await supabase
          .from('user_likes')
          .insert({
            user_id: user.id,
            content_id: contentId
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error adding like:', insertError)
          return {
            success: false,
            error: 'Failed to add like'
          }
        }

        return {
          success: true,
          isLiked: true
        }
      }
    } catch (error) {
      console.error('Like toggle error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  },

  async checkLikeStatus(contentId: string): Promise<boolean> {
    try {
      const supabase = createBrowserSupabaseClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return false
      }

      const { data: like, error } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single()

      // Handle different error codes:
      // PGRST116: No rows found (expected when user hasn't liked the content)
      // PGRST205: Table not found (database schema not applied)
      if (error) {
        if (error.code === 'PGRST116') {
          // No like found - this is expected behavior
          return false
        } else if (error.code === 'PGRST205') {
          // Table doesn't exist - log warning but don't crash
          console.warn('Database table "user_likes" not found. Please apply the database schema.')
          return false
        } else {
          // Other errors
          console.error('Error checking like status:', error)
          return false
        }
      }

      return !!like
    } catch (error) {
      console.error('Like status check error:', error)
      return false
    }
  },

  async getLikeCount(contentId: string): Promise<number> {
    try {
      const supabase = createBrowserSupabaseClient()

      const { count, error } = await supabase
        .from('user_likes')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', contentId)

      if (error) {
        console.error('Error getting like count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Like count error:', error)
      return 0
    }
  }
}

// Hook for React components to manage likes
export function useLikes() {
  const { user } = useUser()

  const toggleLike = useCallback(async (contentId: string) => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    try {
      const supabase = createBrowserSupabaseClient()

      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single()

      // Handle different error codes:
      // PGRST116: No rows found (expected when user hasn't liked the content)
      // PGRST205: Table not found (database schema not applied)
      if (checkError) {
        if (checkError.code === 'PGRST116') {
          // No like found - this is expected behavior, continue to add like
        } else if (checkError.code === 'PGRST205') {
          // Table doesn't exist - log warning and return error
          console.warn('Database table "user_likes" not found. Please apply the database schema.')
          return {
            success: false,
            error: 'Database table not found. Please contact support.'
          }
        } else {
          // Other errors
          console.error('Error checking like status:', checkError)
          return {
            success: false,
            error: 'Failed to check like status'
          }
        }
      }

      const currentlyLiked = !!existingLike

      if (currentlyLiked) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('user_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId)

        if (deleteError) {
          console.error('Error removing like:', deleteError)
          return {
            success: false,
            error: 'Failed to remove like'
          }
        }

        return {
          success: true,
          isLiked: false
        }
      } else {
        // Add like
        const { data: newLike, error: insertError } = await supabase
          .from('user_likes')
          .insert({
            user_id: user.id,
            content_id: contentId
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error adding like:', insertError)
          return {
            success: false,
            error: 'Failed to add like'
          }
        }

        return {
          success: true,
          isLiked: true
        }
      }
    } catch (error) {
      console.error('Like toggle error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }, [user])

  const checkStatus = useCallback(async (contentId: string) => {
    if (!user) {
      console.warn('Cannot check like status: user not authenticated')
      return false
    }

    if (!contentId) {
      console.warn('Cannot check like status: contentId is required')
      return false
    }

    try {
      const supabase = createBrowserSupabaseClient()

      const { data: like, error } = await supabase
        .from('user_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single()

      // Handle different error codes:
      // PGRST116: No rows found (expected when user hasn't liked the content)
      // PGRST205: Table not found (database schema not applied)
      if (error) {
        if (error.code === 'PGRST116') {
          // No like found - this is expected behavior
          return false
        } else if (error.code === 'PGRST205') {
          // Table doesn't exist - log warning but don't crash
          console.warn('Database table "user_likes" not found. Please apply the database schema.')
          return false
        } else {
          // Other errors
          console.error('Error checking like status:', error)
          return false
        }
      }

      return !!like
    } catch (error) {
      console.error('Like status check error:', {
        error: error instanceof Error ? error.message : error
      })
      return false
    }
  }, [user])

  const getLikeCount = useCallback(async (contentId: string) => {
    try {
      const supabase = createBrowserSupabaseClient()

      const { count, error } = await supabase
        .from('user_likes')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', contentId)

      if (error) {
        console.error('Error getting like count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Like count error:', error)
      return 0
    }
  }, [])

  return {
    toggleLike,
    checkStatus,
    getLikeCount
  }
}
