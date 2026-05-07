'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sparkles,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  Play,
  Star,
  Heart,
  Zap,
  Target
} from 'lucide-react'
import Link from 'next/link'

interface LaunchSplashProps {
  onComplete?: () => void
}

export function LaunchSplash({ onComplete }: LaunchSplashProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const slides = [
    {
      title: "Welcome to Skill Gain",
      subtitle: "Where Learning Feels Like Discovery",
      description: "Transform your educational journey with our interactive CAPS curriculum platform designed for South African students.",
      icon: Sparkles,
      gradient: "from-blue-500 to-purple-600",
      features: [
        "Adaptive Learning Paths",
        "Gamified Experience",
        "Social Learning Community"
      ]
    },
    {
      title: "Master CAPS Curriculum",
      subtitle: "Grades 1-12 Made Engaging",
      description: "Comprehensive coverage of Mathematics, Sciences, Languages, and more with interactive lessons and assessments.",
      icon: BookOpen,
      gradient: "from-green-500 to-teal-600",
      features: [
        "Complete CAPS Alignment",
        "Interactive Assessments",
        "Progress Tracking"
      ]
    },
    {
      title: "Learn Together",
      subtitle: "Community & Collaboration",
      description: "Connect with fellow learners, share achievements, and learn from peers in a supportive educational community.",
      icon: Users,
      gradient: "from-orange-500 to-red-600",
      features: [
        "Classroom Integration",
        "Peer Learning",
        "Achievement Sharing"
      ]
    },
    {
      title: "Gamify Your Learning",
      subtitle: "Earn Points, Unlock Rewards",
      description: "Turn education into an exciting game with points, badges, leaderboards, and rewards for academic excellence.",
      icon: Trophy,
      gradient: "from-yellow-500 to-orange-600",
      features: [
        "Points & Badges System",
        "Leaderboards",
        "Achievement Unlocks"
      ]
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete?.()
    }, 500)
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isVisible) return null

  const currentSlideData = slides[currentSlide]
  const IconComponent = currentSlideData.icon

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse" />

      <Card className="w-full max-w-md mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-blue-500 w-8'
                      : index < currentSlide
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${currentSlideData.gradient} flex items-center justify-center shadow-lg`}>
            <IconComponent className="w-10 h-10 text-white" />
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            {currentSlideData.title}
          </h1>

          <h2 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">
            {currentSlideData.subtitle}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {currentSlideData.description}
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {currentSlideData.features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentSlideData.gradient}`} />
                <span className="text-gray-700 dark:text-gray-200">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleNext}
              className={`w-full bg-gradient-to-r ${currentSlideData.gradient} hover:opacity-90 text-white border-0`}
              size="lg"
            >
              {currentSlide === slides.length - 1 ? (
                <>
                  Get Started
                  <Star className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {currentSlide < slides.length - 1 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Skip Tour
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Grades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">1000+</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Lessons</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">∞</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Possibilities</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="absolute top-20 right-20">
          <Star className="w-6 h-6" />
        </div>
        <div className="absolute bottom-20 left-20">
          <Heart className="w-6 h-6" />
        </div>
        <div className="absolute bottom-10 right-10">
          <Zap className="w-8 h-8" />
        </div>
        <div className="absolute top-1/2 left-1/4">
          <Target className="w-6 h-6" />
        </div>
        <div className="absolute top-1/3 right-1/4">
          <Trophy className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}