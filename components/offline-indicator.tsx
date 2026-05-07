'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      // Hide the "back online" message after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm"
        >
          <div className={`rounded-lg shadow-lg border p-3 flex items-center gap-3 ${
            isOnline
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200'
          }`}>
            <div className="flex-shrink-0">
              {isOnline ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {isOnline ? 'Back Online' : 'You\'re Offline'}
              </p>
              <p className="text-xs opacity-75">
                {isOnline
                  ? 'Your progress will sync automatically'
                  : 'Your data is saved locally'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}