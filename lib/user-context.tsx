'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from './supabase-client'

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (!mounted) return

        if (error) {
          setError(error.message)
        } else {
          setUser(user)
        }
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    // Listen for auth changes
    const supabase = createBrowserSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          setError(null)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setError(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, loading, error }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}