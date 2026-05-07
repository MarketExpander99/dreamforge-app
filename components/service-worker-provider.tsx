'use client'

import { useEffect } from 'react'
import { useServiceWorker } from '@/lib/use-service-worker'

export function ServiceWorkerProvider() {
  const { isRegistered } = useServiceWorker()

  // Preload popular curriculum content when service worker is ready
  useEffect(() => {
    if (isRegistered && typeof window !== 'undefined' && navigator.onLine) {
      // Delay preloading to not interfere with initial page load
      const timer = setTimeout(async () => {
        try {
          // Dynamically import to avoid server-side issues
          const { useCurriculumCache } = await import('@/lib/curriculum-cache')
          const { preloadPopular } = useCurriculumCache()
          await preloadPopular()
          console.log('Popular curriculum content preloaded for offline access')
        } catch (error) {
          console.warn('Failed to preload curriculum content:', error)
        }
      }, 3000) // 3 seconds after service worker registration

      return () => clearTimeout(timer)
    }
  }, [isRegistered])

  useServiceWorker()
  return null
}
