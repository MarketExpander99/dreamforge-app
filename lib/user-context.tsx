'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  role?: string
  grade_level?: string
  bio?: string
  interests?: string[]
  learning_goals?: string
  teacher_onboarding_completed?: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  authLoading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const supabase = createBrowserSupabaseClient()

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return null
      }

      return profileData
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const initializeAuth = async () => {
    if (isInitialized) return

    try {
      setLoading(true)
      setError(null)

      // Get initial session with retry logic
      let sessionData = null
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts && !sessionData) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error
          sessionData = session
          break
        } catch (error) {
          attempts++
          if (attempts >= maxAttempts) {
            throw error
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }

      setSession(sessionData)
      setUser(sessionData?.user ?? null)

      if (sessionData?.user) {
        const userProfile = await fetchUserProfile(sessionData.user.id)
        setProfile(userProfile)
      }

    } catch (error) {
      console.error('Error initializing auth:', error)
      setError(error instanceof Error ? error.message : 'Authentication failed')
      setUser(null)
      setSession(null)
      setProfile(null)
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  const refreshAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Error refreshing auth:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh authentication')
      setUser(null)
      setSession(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setSession(null)
      setProfile(null)
      setError(null)
    } catch (error) {
      console.error('Error signing out:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }

        setLoading(false)
        setError(null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    authLoading: loading,
    error,
    signOut,
    refreshAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useUser = useAuth

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}