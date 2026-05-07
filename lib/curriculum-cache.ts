'use client'

interface CurriculumItem {
  id: string
  title: string
  content: string
  type: 'text' | 'text-image' | 'video' | 'quiz' | 'audio'
  category_id: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[] | null
  image_url: string | null
  video_url: string | null
  audio_url: string | null
  quiz: any | null
  read_time: number
  likes: number
  views: number
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string | null
  }
}

interface CurriculumCacheEntry {
  id: string
  data: CurriculumItem
  lastAccessed: number
  lastUpdated: number
  version: number
}

class CurriculumCache {
  private db: IDBDatabase | null = null
  private readonly dbName = 'skillgain_curriculum_cache'
  private readonly dbVersion = 1
  private readonly storeName = 'curriculum_items'
  private readonly maxCacheSize = 100 // Maximum number of items to cache
  private readonly cacheExpiryDays = 7 // Cache expiry in days

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initDB()
    }
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('Curriculum cache database opened successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        this.db = db

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })

          // Create indexes for efficient querying
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false })
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false })
          store.createIndex('category', 'data.category_id', { unique: false })
          store.createIndex('type', 'data.type', { unique: false })
        }
      }
    })
  }

  private ensureDB(): Promise<void> {
    return this.db ? Promise.resolve() : this.initDB()
  }

  async cacheCurriculumItem(item: CurriculumItem): Promise<void> {
    await this.ensureDB()

    const cacheEntry: CurriculumCacheEntry = {
      id: item.id,
      data: item,
      lastAccessed: Date.now(),
      lastUpdated: Date.now(),
      version: 1
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const request = store.put(cacheEntry)

      request.onsuccess = () => {
        console.log(`Cached curriculum item: ${item.title}`)
        this.enforceCacheSize()
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to cache curriculum item:', request.error)
        reject(request.error)
      }
    })
  }

  async getCachedCurriculumItem(id: string): Promise<CurriculumItem | null> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      const request = store.get(id)

      request.onsuccess = () => {
        const cacheEntry: CurriculumCacheEntry | undefined = request.result

        if (cacheEntry) {
          // Update last accessed time
          this.updateLastAccessed(id)

          // Check if cache entry is expired
          const expiryTime = this.cacheExpiryDays * 24 * 60 * 60 * 1000
          if (Date.now() - cacheEntry.lastUpdated > expiryTime) {
            console.log(`Cache entry expired for item: ${id}`)
            this.removeCachedItem(id)
            resolve(null)
            return
          }

          resolve(cacheEntry.data)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        console.error('Failed to get cached curriculum item:', request.error)
        reject(request.error)
      }
    })
  }

  async getCachedCurriculumItems(options: {
    categoryId?: string
    type?: string
    limit?: number
    offset?: number
  } = {}): Promise<CurriculumItem[]> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      let request: IDBRequest

      if (options.categoryId) {
        const index = store.index('category')
        request = index.getAll(options.categoryId)
      } else if (options.type) {
        const index = store.index('type')
        request = index.getAll(options.type)
      } else {
        request = store.getAll()
      }

      request.onsuccess = () => {
        let results: CurriculumCacheEntry[] = request.result || []

        // Sort by last accessed (most recent first)
        results.sort((a, b) => b.lastAccessed - a.lastAccessed)

        // Apply pagination
        if (options.offset) {
          results = results.slice(options.offset)
        }
        if (options.limit) {
          results = results.slice(0, options.limit)
        }

        // Filter out expired items
        const expiryTime = this.cacheExpiryDays * 24 * 60 * 60 * 1000
        const validResults = results.filter(entry =>
          Date.now() - entry.lastUpdated <= expiryTime
        )

        resolve(validResults.map(entry => entry.data))
      }

      request.onerror = () => {
        console.error('Failed to get cached curriculum items:', request.error)
        reject(request.error)
      }
    })
  }

  async isCurriculumItemCached(id: string): Promise<boolean> {
    const item = await this.getCachedCurriculumItem(id)
    return item !== null
  }

  async getCacheStats(): Promise<{
    totalItems: number
    totalSize: number
    oldestItem: number
    newestItem: number
  }> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      const request = store.getAll()

      request.onsuccess = () => {
        const entries: CurriculumCacheEntry[] = request.result || []

        const stats = {
          totalItems: entries.length,
          totalSize: this.estimateSize(entries),
          oldestItem: entries.length > 0 ? Math.min(...entries.map(e => e.lastAccessed)) : 0,
          newestItem: entries.length > 0 ? Math.max(...entries.map(e => e.lastAccessed)) : 0
        }

        resolve(stats)
      }

      request.onerror = () => {
        console.error('Failed to get cache stats:', request.error)
        reject(request.error)
      }
    })
  }

  private estimateSize(entries: CurriculumCacheEntry[]): number {
    // Rough estimation: average 2KB per entry
    return entries.length * 2048
  }

  private async updateLastAccessed(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const cacheEntry: CurriculumCacheEntry | undefined = getRequest.result

        if (cacheEntry) {
          cacheEntry.lastAccessed = Date.now()
          const putRequest = store.put(cacheEntry)

          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve() // Item not found, nothing to update
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  private async enforceCacheSize(): Promise<void> {
    const stats = await this.getCacheStats()

    if (stats.totalItems <= this.maxCacheSize) {
      return
    }

    // Remove oldest items (least recently accessed)
    const itemsToRemove = stats.totalItems - this.maxCacheSize

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('lastAccessed')

      const request = index.openCursor()

      let removed = 0

      request.onsuccess = () => {
        const cursor = request.result

        if (cursor && removed < itemsToRemove) {
          cursor.delete()
          removed++
          cursor.continue()
        } else {
          console.log(`Removed ${removed} old cache entries`)
          resolve()
        }
      }

      request.onerror = () => {
        console.error('Failed to enforce cache size:', request.error)
        reject(request.error)
      }
    })
  }

  async removeCachedItem(id: string): Promise<void> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const request = store.delete(id)

      request.onsuccess = () => {
        console.log(`Removed cached item: ${id}`)
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to remove cached item:', request.error)
        reject(request.error)
      }
    })
  }

  async clearCache(): Promise<void> {
    await this.ensureDB()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const request = store.clear()

      request.onsuccess = () => {
        console.log('Curriculum cache cleared')
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to clear cache:', request.error)
        reject(request.error)
      }
    })
  }

  // Preload popular curriculum items for offline access
  async preloadPopularItems(): Promise<void> {
    try {
      // Get popular/recent items from API
      const response = await fetch('/api/curriculum/popular?limit=20')

      if (!response.ok) {
        console.warn('Failed to fetch popular items for preloading')
        return
      }

      const items: CurriculumItem[] = await response.json()

      // Cache each item
      for (const item of items) {
        try {
          await this.cacheCurriculumItem(item)
        } catch (error) {
          console.error(`Failed to preload item ${item.id}:`, error)
        }
      }

      console.log(`Preloaded ${items.length} popular curriculum items`)
    } catch (error) {
      console.error('Failed to preload popular items:', error)
    }
  }
}

// Singleton instance
let curriculumCacheInstance: CurriculumCache | null = null

export function getCurriculumCache(): CurriculumCache {
  if (!curriculumCacheInstance) {
    curriculumCacheInstance = new CurriculumCache()
  }
  return curriculumCacheInstance
}

// React hook for curriculum caching
export function useCurriculumCache() {
  const cache = getCurriculumCache()

  return {
    cacheItem: (item: CurriculumItem) => cache.cacheCurriculumItem(item),
    getItem: (id: string) => cache.getCachedCurriculumItem(id),
    getItems: (options?: any) => cache.getCachedCurriculumItems(options),
    isCached: (id: string) => cache.isCurriculumItemCached(id),
    getStats: () => cache.getCacheStats(),
    clearCache: () => cache.clearCache(),
    preloadPopular: () => cache.preloadPopularItems()
  }
}