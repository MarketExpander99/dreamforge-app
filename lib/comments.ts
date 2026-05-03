// Comments management utilities
import { useCallback } from 'react'
import { createBrowserSupabaseClient } from './supabase-client'
import { useUser } from './user-context'

export interface Comment {
  id: string
  user_id: string
  content_id: string
  comment: string
  created_at: string
  profiles?: {
    full_name: string
    avatar_url?: string
  }
}

export interface CommentResult {
  success: boolean
  error?: string
  comment?: Comment
}

// Client-side comments functions for interactive components
export const commentUtils = {
  async addComment(contentId: string, commentText: string): Promise<CommentResult> {
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

      const { data: newComment, error: insertError } = await supabase
        .from('content_comments')
        .insert({
          user_id: user.id,
          content_id: contentId,
          comment: commentText
        })
        .select(`
          *,
          profiles:profiles(full_name, avatar_url)
        `)
        .single()

      if (insertError) {
        console.error('Error adding comment:', insertError)
        return {
          success: false,
          error: 'Failed to add comment'
        }
      }

      return {
        success: true,
        comment: newComment
      }
    } catch (error) {
      console.error('Comment add error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  },

  async getComments(contentId: string): Promise<Comment[]> {
    try {
      const supabase = createBrowserSupabaseClient()

      const { data: comments, error } = await supabase
        .from('content_comments')
        .select(`
          *,
          profiles:profiles(full_name, avatar_url)
        `)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting comments:', error)
        return []
      }

      return comments || []
    } catch (error) {
      console.error('Comments fetch error:', error)
      return []
    }
  },

  async getCommentCount(contentId: string): Promise<number> {
    try {
      const supabase = createBrowserSupabaseClient()

      const { count, error } = await supabase
        .from('content_comments')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', contentId)

      if (error) {
        console.error('Error getting comment count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Comment count error:', error)
      return 0
    }
  },

  async deleteComment(commentId: string): Promise<CommentResult> {
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

      const { error: deleteError } = await supabase
        .from('content_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id) // Only allow deleting own comments

      if (deleteError) {
        console.error('Error deleting comment:', deleteError)
        return {
          success: false,
          error: 'Failed to delete comment'
        }
      }

      return {
        success: true
      }
    } catch (error) {
      console.error('Comment delete error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }
}

// Hook for React components to manage comments
export function useComments() {
  const { user } = useUser()

  const addComment = useCallback(async (contentId: string, commentText: string) => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!commentText.trim()) {
      return {
        success: false,
        error: 'Comment cannot be empty'
      }
    }

    try {
      const supabase = createBrowserSupabaseClient()

      const { data: newComment, error: insertError } = await supabase
        .from('content_comments')
        .insert({
          user_id: user.id,
          content_id: contentId,
          comment: commentText.trim()
        })
        .select(`
          *,
          profiles:profiles(full_name, avatar_url)
        `)
        .single()

      if (insertError) {
        console.error('Error adding comment:', insertError)
        return {
          success: false,
          error: 'Failed to add comment'
        }
      }

      return {
        success: true,
        comment: newComment
      }
    } catch (error) {
      console.error('Comment add error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }, [user])

  const getComments = useCallback(async (contentId: string) => {
    try {
      const supabase = createBrowserSupabaseClient()

      const { data: comments, error } = await supabase
        .from('content_comments')
        .select(`
          *,
          profiles:profiles(full_name, avatar_url)
        `)
        .eq('content_id', contentId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error getting comments:', error)
        return []
      }

      return comments || []
    } catch (error) {
      console.error('Comments fetch error:', error)
      return []
    }
  }, [])

  const getCommentCount = useCallback(async (contentId: string) => {
    try {
      const supabase = createBrowserSupabaseClient()

      const { count, error } = await supabase
        .from('content_comments')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', contentId)

      if (error) {
        console.error('Error getting comment count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Comment count error:', error)
      return 0
    }
  }, [])

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    try {
      const supabase = createBrowserSupabaseClient()

      const { error: deleteError } = await supabase
        .from('content_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id) // Only allow deleting own comments

      if (deleteError) {
        console.error('Error deleting comment:', deleteError)
        return {
          success: false,
          error: 'Failed to delete comment'
        }
      }

      return {
        success: true
      }
    } catch (error) {
      console.error('Comment delete error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }, [user])

  return {
    addComment,
    getComments,
    getCommentCount,
    deleteComment
  }
}