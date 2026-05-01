// Server actions for client components
'use server'

import { updateUserProfile } from './data'

export async function updateUserProfileAction(userId: string, updates: { grade_level?: string; role?: 'parent' | 'student' }) {
  try {
    await updateUserProfile(userId, updates)
    return { success: true }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }
}