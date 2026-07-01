'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

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
  credits_balance?: number
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

  // Stable Supabase client via memoized singleton. NEVER recreate per-render.
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  // One-time init guard (ref prevents re-init loops on re-renders or tab switches)
  const initializedRef = useRef(false)
  const mountedRef = useRef(true)

  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
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
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }, [supabase])

  const initializeAuth = useCallback(async () => {
    if (initializedRef.current) return
    initializedRef.current = true

    try {
      setLoading(true)
      setError(null)

      const { data: { session: initialSession }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (!mountedRef.current) return

      setSession(initialSession)
      setUser(initialSession?.user ?? null)

      if (initialSession?.user) {
        const userProfile = await fetchUserProfile(initialSession.user.id)
        if (mountedRef.current) setProfile(userProfile)
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Error initializing auth:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setUser(null)
        setSession(null)
        setProfile(null)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [supabase, fetchUserProfile])

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session: refreshedSession }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (!mountedRef.current) return

      setSession(refreshedSession)
      setUser(refreshedSession?.user ?? null)

      if (refreshedSession?.user) {
        const userProfile = await fetchUserProfile(refreshedSession.user.id)
        if (mountedRef.current) setProfile(userProfile)
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('Error refreshing auth:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to refresh authentication')
        setUser(null)
        setSession(null)
        setProfile(null)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [supabase, fetchUserProfile])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      if (mountedRef.current) {
        setUser(null)
        setSession(null)
        setProfile(null)
        setError(null)
      }
    } catch (err) {
      console.error('Error signing out:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to sign out')
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [supabase])

  // Initialize once + listen for auth changes.
  // Key fix: stable deps only + ref guard to prevent re-subscription thrashing on navigation.
  useEffect(() => {
    mountedRef.current = true

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mountedRef.current) return

        console.log('Auth state changed:', event)
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          const userProfile = await fetchUserProfile(newSession.user.id)
          if (mountedRef.current) setProfile(userProfile)
        } else {
          setProfile(null)
        }

        setLoading(false)
        setError(null)
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [initializeAuth])

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    authLoading: loading,
    error,
    signOut,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useUser = () => useAuth()

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}