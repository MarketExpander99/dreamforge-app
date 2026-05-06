'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'

interface NotificationToastProps {
  id: string
  type: 'achievement' | 'progress' | 'nudge'
  title: string
  message: string
  icon?: string
  onClose: (id: string) => void
  duration?: number
}

export function NotificationToast({
  id,
  type,
  title,
  message,
  icon,
  onClose,
  duration = 5000
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Trigger confetti for achievements
    if (type === 'achievement') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
      })
    }

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300) // Allow exit animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [id, type, duration, onClose])

  const getIcon = () => {
    if (icon) return icon

    switch (type) {
      case 'achievement':
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 'progress':
        return <Target className="h-6 w-6 text-green-500" />
      case 'nudge':
        return <Zap className="h-6 w-6 text-blue-500" />
      default:
        return null
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'achievement':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'progress':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'nudge':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
      default:
        return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            duration: 0.3
          }}
          className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg border shadow-lg ${getTypeColor()}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false)
                setTimeout(() => onClose(id), 300)
              }}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar for auto-dismiss */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className="h-1 bg-current opacity-20 rounded-full mt-3"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}