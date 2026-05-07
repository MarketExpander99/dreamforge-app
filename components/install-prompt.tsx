'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt after a delay to not be too intrusive
      setTimeout(() => setShowPrompt(true), 3000)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Install prompt failed:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismissal to not show again for a while
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed recently
  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Install Skill Gain
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Get the full app experience with offline learning and push notifications.
              </p>

              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}