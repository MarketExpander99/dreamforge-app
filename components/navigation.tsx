'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, BookOpen, User, LogOut, Settings, PenTool } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'My Learning', href: '/learning', icon: BookOpen },
  { name: 'Profile', href: '/profile', icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setUser(user)

          // Get user profile to check role and get profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, avatar_url')
            .eq('id', user.id)
            .single()

          setUserRole(profile?.role || null)
          setUserProfile(profile)
        } else {
          // Clear state when user is not authenticated
          setUser(null)
          setUserRole(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        // Clear state on error
        setUser(null)
        setUserRole(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth state changes
    const supabase = createBrowserSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          // Refetch profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, avatar_url')
            .eq('id', session.user.id)
            .single()

          setUserRole(profile?.role || null)
          setUserProfile(profile)
        } catch (error) {
          console.error('Error fetching profile on auth change:', error)
          setUserRole(null)
          setUserProfile(null)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole(null)
        setUserProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      setUser(null)
      setUserRole(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      // If Supabase is not configured, just redirect to login
      router.push('/auth/login')
    }
  }

  // Check if user has admin access
  const hasAdminAccess = userRole === 'content-creator' || user?.email === 'eben.combrinck@proton.me'

  // Check if user is a content creator
  const isContentCreator = userRole === 'content-creator' || user?.email === 'eben.combrinck@proton.me'

  const adminNavigation = [
    { name: 'System Admin', href: '/admin', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <h1 className="text-2xl font-bold text-primary">Skill Gain</h1>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}

            {/* Content Creator Navigation */}
            {isContentCreator && (
              <>
                <div className="pt-4">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Content Creation
                    </h3>
                  </div>
                  <Link href="/content">
                    <Button
                      variant={pathname === '/content' || pathname.startsWith('/content/') ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      <PenTool className="mr-3 h-5 w-5" />
                      Creator Hub
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {/* Admin Navigation */}
            {hasAdminAccess && (
              <>
                <div className="pt-4">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Administration
                    </h3>
                  </div>
                  {adminNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className="w-full justify-start"
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </nav>
          <div className="flex-shrink-0 flex border-t p-4">
            <div className="flex items-center w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfile?.avatar_url || ""} />
                <AvatarFallback>
                  {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {userProfile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <nav className="flex justify-around py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.name}</span>
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}