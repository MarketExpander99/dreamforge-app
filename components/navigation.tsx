'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, BookOpen, User, LogOut, Settings, PenTool, Users, Flame, Trophy, Target, GraduationCap, Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/user-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getCurrentStreak, hasCompletedAssessment } from '@/lib/data'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'My Learning', href: '/learning', icon: BookOpen },
  { name: 'Curriculum', href: '/learning/curriculum', icon: Target },
  { name: 'Profile', href: '/profile', icon: User },
]

// Assessment navigation for students who haven't completed assessment
const assessmentNavigation = [
  { name: 'Assessment', href: '/assessment', icon: GraduationCap },
]

// Family navigation for parents
const familyNavigation = [
  { name: 'Family', href: '/family', icon: Users },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut, loading } = useAuth()
  const [currentStreak, setCurrentStreak] = useState(0)
  const [assessmentCompleted, setAssessmentCompleted] = useState(false)

  // Fetch current streak and assessment status for students
  useEffect(() => {
    const fetchData = async () => {
      if (user && profile?.role === 'student') {
        try {
          const { currentStreak: streak } = await getCurrentStreak(user.id)
          setCurrentStreak(streak)

          const completed = await hasCompletedAssessment(user.id)
          setAssessmentCompleted(completed)
        } catch (error) {
          console.error('Error fetching student data:', error)
          // Continue with defaults - navigation should still work
        }
      }
    }

    if (!loading && user) {
      fetchData()
    }
  }, [user, profile, loading])

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      // If sign out fails, just redirect to login
      router.push('/auth/login')
    }
  }

  // Check if user has admin access
  const hasAdminAccess = profile?.role === 'content-creator' || user?.email === 'eben.combrinck@proton.me'

  // Check if user is a content creator
  const isContentCreator = profile?.role === 'content-creator' || user?.email === 'eben.combrinck@proton.me'

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

          {/* Follow Us on X */}
          <div className="px-4 mb-6">
            <a
              href="https://x.com/Skill_GainX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors group"
            >
              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200">
                Follow us
              </span>
            </a>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href} className="block">
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

            {/* Assessment Navigation for Students */}
            {profile?.role === 'student' && !assessmentCompleted && (
              <Link href="/assessment">
                <Button
                  variant={pathname === '/assessment' ? "secondary" : "ghost"}
                  className="w-full justify-start bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200"
                >
                  <GraduationCap className="mr-3 h-5 w-5 text-blue-600" />
                  Take Assessment
                  <Badge variant="secondary" className="ml-auto text-xs bg-blue-100 text-blue-700">
                    New
                  </Badge>
                </Button>
              </Link>
            )}

            {/* Family Navigation for Parents */}
            {profile?.role === 'parent' && (
              <>
                <div className="pt-4">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Family
                    </h3>
                  </div>
                  {familyNavigation.map((item) => {
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
                </div>
              </>
            )}

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

          {/* Install App Button */}
          <div className="px-2 pb-4">
            <Button
              variant="outline"
              className="w-full justify-start bg-slate-800 hover:bg-slate-900 border-slate-800 text-gray-100 hover:text-white shadow-sm hover:shadow-md dark:bg-slate-700 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-gray-100 dark:hover:text-white"
              onClick={() => {
                // Trigger install prompt or redirect to install instructions
                if ('beforeinstallprompt' in window) {
                  window.dispatchEvent(new Event('beforeinstallprompt'))
                } else {
                  // Fallback for browsers that don't support install prompt
                  alert('To install Skill Gain, tap the share button in your browser and select "Add to Home Screen"')
                }
              }}
            >
              <Smartphone className="mr-3 h-5 w-5" />
              Install App
            </Button>
          </div>

          <div className="flex-shrink-0 flex border-t p-4">
            <div className="flex items-center w-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  {profile?.role === 'student' && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Badge
                        variant="secondary"
                        className={`text-xs px-2 py-0.5 transition-all duration-300 ${
                          currentStreak > 0
                            ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900 dark:to-red-900 dark:text-orange-300 shadow-sm'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        <Flame className={`h-3 w-3 mr-1 transition-all duration-300 ${currentStreak > 0 ? 'animate-pulse' : ''}`} />
                        {currentStreak > 0 ? currentStreak : '0'}
                      </Badge>
                    </motion.div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto transition-colors"
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
          {[
            { name: 'Home', href: '/', icon: Home },
            { name: 'Explore', href: '/explore', icon: Search },
            { name: 'My Learning', href: '/learning', icon: BookOpen },
            { name: 'Curriculum', href: '/learning/curriculum', icon: Target },
            { name: 'Profile', href: '/profile', icon: User },
          ].map((item) => {
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