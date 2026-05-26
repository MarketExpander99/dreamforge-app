'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  X,
  ArrowRight,
  Play
} from 'lucide-react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

interface TeacherOnboardingProps {
  onComplete: () => void
}

export function TeacherOnboarding({ onComplete }: TeacherOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const supabase = createBrowserSupabaseClient()

  const steps = [
    {
      title: "Welcome to Teacher Dashboard",
      description: "Get started with your teaching toolkit",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Welcome to Skill Gain's teacher dashboard! Here's what you can do:
          </p>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">Manage Classes</p>
                <p className="text-sm text-muted-foreground">Create and organize your teaching groups</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <BookOpen className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">Create Content</p>
                <p className="text-sm text-muted-foreground">Design lessons and activities for your students</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium">Track Progress</p>
                <p className="text-sm text-muted-foreground">Monitor student performance and engagement</p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: "Get Started"
    },
    {
      title: "Create Your First Class",
      description: "Set up a class and invite students",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Classes are the foundation of your teaching. Each class gets a unique invite code that students can use to join.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Quick Class Setup</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Choose a subject and grade level</li>
              <li>• Set class capacity and settings</li>
              <li>• Generate shareable invite codes</li>
              <li>• Students join instantly with the code</li>
            </ul>
          </div>
        </div>
      ),
      action: "Create Class",
      link: "/teacher/classes/new"
    },
    {
      title: "Create Your First Lesson",
      description: "Design engaging learning content",
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Share your teaching expertise by creating custom lessons, quizzes, and activities for your students.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Content Types</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Badge variant="secondary" className="justify-center">Text Lessons</Badge>
              <Badge variant="secondary" className="justify-center">Video Content</Badge>
              <Badge variant="secondary" className="justify-center">Interactive Quizzes</Badge>
              <Badge variant="secondary" className="justify-center">Mixed Media</Badge>
            </div>
          </div>
        </div>
      ),
      action: "Create Content",
      link: "/teacher/content/new"
    },
    {
      title: "Monitor Student Progress",
      description: "Track learning and engagement",
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Get insights into how your students are progressing and identify areas where they need extra support.
          </p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Analytics Include</h4>
            <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
              <li>• Individual student progress</li>
              <li>• Class-wide performance trends</li>
              <li>• Engagement and activity metrics</li>
              <li>• Achievement and badge progress</li>
            </ul>
          </div>
        </div>
      ),
      action: "View Analytics",
      link: "/teacher/analytics"
    }
  ]

  const progress = ((completedSteps.size + (currentStep < steps.length ? 1 : 0)) / steps.length) * 100

  const handleNext = () => {
    console.log(`🎯 handleNext called, currentStep: ${currentStep}, steps.length: ${steps.length}`)
    setCompletedSteps(prev => new Set([...prev, currentStep]))

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1
      console.log(`📍 Advancing to step ${nextStep}`)
      setCurrentStep(nextStep)
    } else {
      console.log('🎯 Reached final step, calling handleComplete')
      handleComplete()
    }
  }

  const handleComplete = async () => {
    console.log('🎯 handleComplete function called!')

    try {
      console.log('🎯 Starting onboarding completion via API...')

      // Call the API route to complete onboarding (bypasses RLS)
      console.log('📡 Making fetch request to /api/onboarding/complete...')
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Fetch response received, status:', response.status)

      const result = await response.json()
      console.log('📡 Response body:', result)

      if (!response.ok) {
        console.error('❌ API error:', result)
        alert(`Failed to complete onboarding: ${result.error}`)
        return
      }

      console.log('✅ Onboarding completed successfully via API:', result)

    } catch (error) {
      console.error('❌ Unexpected error in handleComplete:', error)
      alert('An unexpected error occurred. Please try again.')
      return
    }

    console.log('🎉 Onboarding completion successful, calling onComplete callback')
    onComplete()
  }

  const handleSkip = () => {
    handleComplete()
  }

  const currentStepData = steps[currentStep]
  const IconComponent = currentStepData.icon

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStepData.content}

          {/* Step Indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-green-500'
                    : index === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {currentStepData.link ? (
              <Button className="flex-1" onClick={() => { handleNext(); window.location.href = currentStepData.link; }}>
                {currentStepData.action}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1">
                {currentStep === steps.length - 1 ? 'Complete Setup' : currentStepData.action}
                {currentStep === steps.length - 1 ? (
                  <CheckCircle className="w-4 h-4 ml-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 ml-2" />
                )}
              </Button>
            )}

            <Button variant="outline" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}