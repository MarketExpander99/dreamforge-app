'use client'

import { useEffect, useState } from 'react'

export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true)
                }
              })
            }
          })

          setIsRegistered(true)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated:', event.data.payload)
        }
      })
    }
  }, [])

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update().then(() => {
          window.location.reload()
        })
      })
    }
  }

  return {
    isRegistered,
    updateAvailable,
    updateServiceWorker,
  }
}