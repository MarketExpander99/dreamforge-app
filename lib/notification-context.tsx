'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/user-context'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Notification {
  id: string
  type: 'achievement' | 'progress' | 'nudge'
  title: string
  message: string
  icon?: string
  userId: string
  childId?: string // For parent notifications about children
  timestamp: Date
}

interface NotificationContextType {
  notifications: Notification[]
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user, profile } = useAuth()
  const supabase = createBrowserSupabaseClient()

  // Generate unique notification ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Show notification
  const showNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const notification: Notification = {
      ...notificationData,
      id: generateId(),
      timestamp: new Date()
    }

    setNotifications(prev => [notification, ...prev])

    // Auto-remove after 5 seconds for non-achievement notifications
    if (notification.type !== 'achievement') {
      setTimeout(() => {
        removeNotification(notification.id)
      }, 5000)
    }
  }, [])

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return

    const channels: RealtimeChannel[] = []

    // Subscribe to user's own achievements
    const userAchievementsChannel = supabase
      .channel('user_achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          const achievement = payload.new
          showNotification({
            type: 'achievement',
            title: 'Achievement Unlocked! 🎉',
            message: `You earned "${achievement.title}" - ${achievement.description}`,
            icon: achievement.icon,
            userId: user.id
          })
        }
      )
      .subscribe()

    channels.push(userAchievementsChannel)

    // Subscribe to user's own progress completions
    const userProgressChannel = supabase
      .channel('user_progress_completion')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          const progress = payload.new
          const oldProgress = payload.old

          // Check if status changed to 'completed' or progress hit 100%
          const wasCompleted = (progress.status === 'completed' && oldProgress.status !== 'completed') ||
                              (progress.progress_percentage === 100 && oldProgress.progress_percentage < 100)

          if (wasCompleted) {
            // Get content details
            supabase
              .from('content_items')
              .select('title, type')
              .eq('id', progress.content_id)
              .single()
              .then(({ data: content }: { data: any }) => {
                if (content) {
                  const contentType = content.type === 'quiz' ? 'quiz' :
                                    content.type === 'video' ? 'video' :
                                    content.type === 'audio' ? 'audio' : 'lesson'

                  showNotification({
                    type: 'progress',
                    title: 'Progress Complete! ✅',
                    message: `You finished the ${contentType}: "${content.title}"`,
                    userId: user.id
                  })
                }
              })
          }
        }
      )
      .subscribe()

    channels.push(userProgressChannel)

    // If user is a parent, subscribe to children's achievements and progress
    if (profile?.role === 'parent') {
      // Subscribe to all achievements where the achiever has this user as parent
      const childrenAchievementsChannel = supabase
        .channel('children_achievements')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_achievements'
          },
          async (payload: any) => {
            const achievement = payload.new

            // Check if this achievement belongs to one of the parent's children
            const { data: childProfile } = await supabase
              .from('profiles')
              .select('full_name, parent_id')
              .eq('id', achievement.user_id)
              .single()

            if (childProfile?.parent_id === user.id) {
              showNotification({
                type: 'achievement',
                title: `${childProfile.full_name} earned an achievement! 🎉`,
                message: `"${achievement.title}" - ${achievement.description}`,
                icon: achievement.icon,
                userId: user.id,
                childId: achievement.user_id
              })
            }
          }
        )
        .subscribe()

      channels.push(childrenAchievementsChannel)

      // Subscribe to children's progress completions
      const childrenProgressChannel = supabase
        .channel('children_progress_completion')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_progress'
          },
          async (payload: any) => {
            const progress = payload.new
            const oldProgress = payload.old

            // Check if status changed to 'completed' or progress hit 100%
            const wasCompleted = (progress.status === 'completed' && oldProgress.status !== 'completed') ||
                                (progress.progress_percentage === 100 && oldProgress.progress_percentage < 100)

            if (wasCompleted) {
              // Check if this progress belongs to one of the parent's children
              const { data: childProfile } = await supabase
                .from('profiles')
                .select('full_name, parent_id')
                .eq('id', progress.user_id)
                .single()

              if (childProfile?.parent_id === user.id) {
                // Get content details
                const { data: content } = await supabase
                  .from('content_items')
                  .select('title, type')
                  .eq('id', progress.content_id)
                  .single()

                if (content) {
                  const contentType = content.type === 'quiz' ? 'quiz' :
                                    content.type === 'video' ? 'video' :
                                    content.type === 'audio' ? 'audio' : 'lesson'

                  showNotification({
                    type: 'progress',
                    title: `${childProfile.full_name} completed content! ✅`,
                    message: `Finished the ${contentType}: "${content.title}"`,
                    userId: user.id,
                    childId: progress.user_id
                  })
                }
              }
            }
          }
        )
        .subscribe()

      channels.push(childrenProgressChannel)
    }

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
  }, [user, profile, supabase, showNotification])

  const value: NotificationContextType = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}