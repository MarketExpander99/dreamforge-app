// Utility functions for user privacy and display names

import { createClient } from '@/lib/supabase-server'

/**
 * Get the public display name for a user (display_name || anonymous_id)
 * This ensures privacy by never showing real names publicly
 */
export async function getPublicUserName(userId: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, anonymous_id')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user public name:', error)
      return 'Anonymous User'
    }

    return data.display_name || data.anonymous_id || 'Anonymous User'
  } catch (error) {
    console.error('Error in getPublicUserName:', error)
    return 'Anonymous User'
  }
}

/**
 * Get multiple public names for users (efficient batch operation)
 */
export async function getPublicUserNames(userIds: string[]): Promise<Record<string, string>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, anonymous_id')
      .in('id', userIds)

    if (error) {
      console.error('Error fetching user public names:', error)
      return {}
    }

    const result: Record<string, string> = {}
    data.forEach(user => {
      result[user.id] = user.display_name || user.anonymous_id || 'Anonymous User'
    })

    return result
  } catch (error) {
    console.error('Error in getPublicUserNames:', error)
    return {}
  }
}

/**
 * Check if a user can set a display name (parent consent logic)
 */
export async function canUserSetDisplayName(userId: string): Promise<{ canSet: boolean; reason?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('role, parent_consent_given')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking display name permissions:', error)
      return { canSet: false, reason: 'Unable to verify permissions' }
    }

    if (data.role === 'student' && !data.parent_consent_given) {
      return { canSet: false, reason: 'Parent or guardian consent required' }
    }

    return { canSet: true }
  } catch (error) {
    console.error('Error in canUserSetDisplayName:', error)
    return { canSet: false, reason: 'Unable to verify permissions' }
  }
}