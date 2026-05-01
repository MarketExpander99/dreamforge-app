// Bookmark management utilities
import { createBrowserSupabaseClient } from './supabase'

export interface BookmarkResult {
  success: boolean
  error?: string
  isBookmarked?: boolean
}

// Client-side bookmark functions for interactive components
export const bookmarkUtils = {
  async toggleBookmark(contentId: string): Promise<BookmarkResult> {
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

      // Check if already bookmarked
      const { data: existingBookmark, error: checkError } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking bookmark status:', checkError)
        return {
          success: false,
          error: 'Failed to check bookmark status'
        }
      }

      const currentlyBookmarked = !!existingBookmark

      if (currentlyBookmarked) {
        // Remove bookmark
        const { error: deleteError } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId)

        if (deleteError) {
          console.error('Error removing bookmark:', deleteError)
          return {
            success: false,
            error: 'Failed to remove bookmark'
          }
        }

        return {
          success: true,
          isBookmarked: false
        }
      } else {
        // Add bookmark
        const { data: newBookmark, error: insertError } = await supabase
          .from('user_bookmarks')
          .insert({
            user_id: user.id,
            content_id: contentId
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error adding bookmark:', insertError)
          return {
            success: false,
            error: 'Failed to add bookmark'
          }
        }

        return {
          success: true,
          isBookmarked: true
        }
      }
    } catch (error) {
      console.error('Bookmark toggle error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  },

  async checkBookmarkStatus(contentId: string): Promise<boolean> {
    try {
      const supabase = createBrowserSupabaseClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return false
      }

      const { data: bookmark, error } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking bookmark status:', error)
        return false
      }

      return !!bookmark
    } catch (error) {
      console.error('Bookmark status check error:', error)
      return false
    }
  },

  async getUserBookmarksData() {
    try {
      const supabase = createBrowserSupabaseClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return []
      }

      const { data: bookmarks, error } = await supabase
        .from('user_bookmarks')
        .select(`
          *,
          content:content_items(*, category:categories(*))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user bookmarks:', error)
        return []
      }

      return bookmarks || []
    } catch (error) {
      console.error('Get user bookmarks error:', error)
      return []
    }
  }
}

// Hook for React components to manage bookmarks
export function useBookmarks() {
  const toggleBookmark = async (contentId: string) => {
    return await bookmarkUtils.toggleBookmark(contentId)
  }

  const checkStatus = async (contentId: string) => {
    return await bookmarkUtils.checkBookmarkStatus(contentId)
  }

  const getBookmarks = async () => {
    return await bookmarkUtils.getUserBookmarksData()
  }

  return {
    toggleBookmark,
    checkStatus,
    getBookmarks
  }
}