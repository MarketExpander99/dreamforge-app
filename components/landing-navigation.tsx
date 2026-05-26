'use client'

import Link from 'next/link'
import { BookOpen, LogIn, UserPlus, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LandingNavigation() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/logo.svg" alt="Skill-Gain" className="h-8 sm:h-10 w-auto" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
            >
              How It Works
            </Link>
            <Link
              href="#testimonials"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
            >
              Testimonials
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/auth/login')}
              className="hidden sm:flex h-10 px-4 text-sm font-medium"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/auth/signup')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-10 px-4 text-sm font-semibold min-w-[120px]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Get Started
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden h-10 w-10"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-4">
              <Link
                href="#features"
                className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-base font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-base font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#testimonials"
                className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-base font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </Link>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  onClick={() => {
                    router.push('/auth/login')
                    setIsMenuOpen(false)
                  }}
                  className="w-full justify-start h-12 text-base font-medium"
                >
                  <LogIn className="h-5 w-5 mr-3" />
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
