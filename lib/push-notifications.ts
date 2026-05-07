'use client'

import { createBrowserSupabaseClient } from './supabase-client'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  data?: any
  actions?: {
    action: string
    title: string
    icon?: string
  }[]
}

export interface NotificationPreferences {
  achievements: boolean
  progress: boolean
  streaks: boolean
  nudges: boolean
  familyUpdates: boolean
}

class PushNotificationManager {
  private vapidPublicKey: string | null = null
  private subscription: PushSubscription | null = null

  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported')
      return
    }

    // Get VAPID public key from environment or server
    try {
      const response = await fetch('/api/push/vapid-public-key')
      if (response.ok) {
        const data = await response.json()
        this.vapidPublicKey = data.publicKey
      }
    } catch (error) {
      console.error('Failed to get VAPID public key:', error)
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported')
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey!) as BufferSource
      })

      this.subscription = subscription

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      throw error
    }
  }

  async unsubscribe(): Promise<void> {
    if (this.subscription) {
      await this.subscription.unsubscribe()
      this.subscription = null

      // Remove subscription from server
      await this.removeSubscriptionFromServer()
    }
  }

  async sendNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.subscription) {
      throw new Error('No push subscription available')
    }

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: this.subscription,
          payload
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send push notification')
      }
    } catch (error) {
      console.error('Failed to send push notification:', error)
      throw error
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: JSON.stringify(subscription),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to save subscription:', error)
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Failed to remove subscription:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  getSubscription(): PushSubscription | null {
    return this.subscription
  }

  isSubscribed(): boolean {
    return this.subscription !== null
  }

  getPermission(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied'
  }
}

// Singleton instance
let pushManagerInstance: PushNotificationManager | null = null

export function getPushManager(): PushNotificationManager {
  if (!pushManagerInstance) {
    pushManagerInstance = new PushNotificationManager()
  }
  return pushManagerInstance
}

// React hook for push notifications
export function usePushNotifications() {
  const manager = getPushManager()

  return {
    requestPermission: () => manager.requestPermission(),
    subscribe: () => manager.subscribe(),
    unsubscribe: () => manager.unsubscribe(),
    sendNotification: (payload: PushNotificationPayload) => manager.sendNotification(payload),
    isSubscribed: () => manager.isSubscribed(),
    getPermission: () => manager.getPermission(),
    getSubscription: () => manager.getSubscription()
  }
}

// Notification preferences utilities
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error)
      return getDefaultPreferences()
    }

    return data || getDefaultPreferences()
  } catch (error) {
    console.error('Failed to get notification preferences:', error)
    return getDefaultPreferences()
  }
}

export async function updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
  try {
    const supabase = createBrowserSupabaseClient()
    const currentPrefs = await getNotificationPreferences(userId)

    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...currentPrefs,
        ...preferences,
        updated_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to update notification preferences:', error)
    throw error
  }
}

function getDefaultPreferences(): NotificationPreferences {
  return {
    achievements: true,
    progress: true,
    streaks: true,
    nudges: true,
    familyUpdates: true
  }
}

// Smart notification scheduling
export class NotificationScheduler {
  private static instance: NotificationScheduler
  private scheduledNotifications: Map<string, number> = new Map()

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler()
    }
    return NotificationScheduler.instance
  }

  // Schedule a streak reminder notification
  scheduleStreakReminder(userId: string, streakCount: number): void {
    const key = `streak_${userId}`
    this.clearScheduled(key)

    // Schedule for 8 PM local time
    const now = new Date()
    const reminderTime = new Date(now)
    reminderTime.setHours(20, 0, 0, 0) // 8:00 PM

    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1) // Tomorrow
    }

    const delay = reminderTime.getTime() - now.getTime()
    const timeoutId = window.setTimeout(async () => {
      const preferences = await getNotificationPreferences(userId)
      if (preferences.streaks) {
        const pushManager = getPushManager()
        if (pushManager.isSubscribed()) {
          await pushManager.sendNotification({
            title: 'Keep Your Streak Going! 🔥',
            body: `You're on a ${streakCount}-day learning streak. Complete a lesson today to maintain it!`,
            icon: '/icon-192x192.png',
            url: '/learning'
          })
        }
      }
    }, delay)

    this.scheduledNotifications.set(key, timeoutId)
  }

  // Schedule a learning nudge
  scheduleLearningNudge(userId: string, lastActivity: Date): void {
    const key = `nudge_${userId}`
    this.clearScheduled(key)

    // Schedule nudge 2 days after last activity
    const nudgeTime = new Date(lastActivity)
    nudgeTime.setDate(nudgeTime.getDate() + 2)
    nudgeTime.setHours(19, 0, 0, 0) // 7:00 PM

    const now = new Date()
    if (nudgeTime <= now) return // Don't schedule past nudges

    const delay = nudgeTime.getTime() - now.getTime()
    const timeoutId = window.setTimeout(async () => {
      const preferences = await getNotificationPreferences(userId)
      if (preferences.nudges) {
        const pushManager = getPushManager()
        if (pushManager.isSubscribed()) {
          await pushManager.sendNotification({
            title: 'Time to Learn! 📚',
            body: 'It\'s been a couple of days since your last lesson. Ready to continue your learning journey?',
            icon: '/icon-192x192.png',
            url: '/learning'
          })
        }
      }
    }, delay)

    this.scheduledNotifications.set(key, timeoutId)
  }

  // Schedule achievement celebration
  scheduleAchievementNotification(userId: string, achievement: { title: string; description: string }): void {
    const key = `achievement_${userId}_${Date.now()}`
    this.clearScheduled(key)

    // Send immediately
    const timeoutId = window.setTimeout(async () => {
      const preferences = await getNotificationPreferences(userId)
      if (preferences.achievements) {
        const pushManager = getPushManager()
        if (pushManager.isSubscribed()) {
          await pushManager.sendNotification({
            title: 'Achievement Unlocked! 🎉',
            body: `Congratulations! You earned "${achievement.title}" - ${achievement.description}`,
            icon: '/icon-192x192.png',
            url: '/profile'
          })
        }
      }
    }, 1000) // Small delay to ensure UI updates first

    this.scheduledNotifications.set(key, timeoutId)
  }

  private clearScheduled(key: string): void {
    const existingTimeout = this.scheduledNotifications.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.scheduledNotifications.delete(key)
    }
  }

  clearAll(): void {
    this.scheduledNotifications.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    this.scheduledNotifications.clear()
  }
}