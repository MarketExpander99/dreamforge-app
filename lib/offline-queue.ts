'use client'

import { ProgressUpdate } from './progress'

interface QueuedProgressUpdate extends ProgressUpdate {
  id: string
  timestamp: number
  userId: string
  retryCount: number
}

const QUEUE_STORAGE_KEY = 'skillgain_offline_progress_queue'
const MAX_RETRY_COUNT = 3

class OfflineProgressQueue {
  private queue: QueuedProgressUpdate[] = []
  private isOnline = true
  private syncInProgress = false

  constructor() {
    this.loadQueue()
    this.setupNetworkListeners()
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
      this.queue = []
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  private setupNetworkListeners() {
    this.isOnline = navigator.onLine

    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  async addToQueue(update: ProgressUpdate, userId: string): Promise<void> {
    const queuedUpdate: QueuedProgressUpdate = {
      ...update,
      id: `${userId}_${update.contentId}_${Date.now()}`,
      timestamp: Date.now(),
      userId,
      retryCount: 0
    }

    this.queue.push(queuedUpdate)
    this.saveQueue()

    // If online, try to sync immediately
    if (this.isOnline && !this.syncInProgress) {
      this.syncQueue()
    }

    // Notify service worker to queue for background sync
    if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration?.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await (registration as any).sync.register('sync-progress')
      } catch (error) {
        console.log('Background sync not available, will sync on next online event')
      }
    }
  }

  private async syncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.queue.length === 0) {
      return
    }

    this.syncInProgress = true

    try {
      const itemsToSync = [...this.queue]

      for (const item of itemsToSync) {
        try {
          await this.syncItem(item)
          // Remove successfully synced item
          this.queue = this.queue.filter(q => q.id !== item.id)
        } catch (error) {
          console.error(`Failed to sync progress for ${item.contentId}:`, error)
          item.retryCount++

          if (item.retryCount >= MAX_RETRY_COUNT) {
            // Remove item after max retries
            this.queue = this.queue.filter(q => q.id !== item.id)
            console.warn(`Removed progress update after ${MAX_RETRY_COUNT} failed attempts:`, item)
          }
        }
      }

      this.saveQueue()
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncItem(item: QueuedProgressUpdate): Promise<void> {
    const response = await fetch('/api/progress/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId: item.contentId,
        status: item.status,
        progressPercentage: item.progressPercentage,
        timeSpent: item.timeSpent,
        userId: item.userId
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Sync failed')
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  getQueuedItems(): QueuedProgressUpdate[] {
    return [...this.queue]
  }

  isOnlineStatus(): boolean {
    return this.isOnline
  }

  clearQueue(): void {
    this.queue = []
    this.saveQueue()
  }

  // Force sync (useful for manual sync buttons)
  async forceSync(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    let synced = 0
    let failed = 0

    for (const item of this.queue) {
      try {
        await this.syncItem(item)
        this.queue = this.queue.filter(q => q.id !== item.id)
        synced++
      } catch (error) {
        failed++
        item.retryCount++
        if (item.retryCount >= MAX_RETRY_COUNT) {
          this.queue = this.queue.filter(q => q.id !== item.id)
        }
      }
    }

    this.saveQueue()
    return { synced, failed }
  }
}

// Singleton instance
let offlineQueueInstance: OfflineProgressQueue | null = null

export function getOfflineQueue(): OfflineProgressQueue {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineProgressQueue()
  }
  return offlineQueueInstance
}

// Hook for React components
export function useOfflineQueue() {
  const queue = getOfflineQueue()

  return {
    addToQueue: (update: ProgressUpdate, userId: string) => queue.addToQueue(update, userId),
    getQueueLength: () => queue.getQueueLength(),
    getQueuedItems: () => queue.getQueuedItems(),
    forceSync: () => queue.forceSync(),
    clearQueue: () => queue.clearQueue(),
    isOnline: queue.isOnlineStatus()
  }
}
