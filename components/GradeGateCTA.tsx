'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface GradeGateCTAProps {
  className?: string
}

export function GradeGateCTA({ className }: GradeGateCTAProps) {
  return (
    <Card className={`border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-xl font-semibold text-blue-900 dark:text-blue-100">
          Unlock Your Personalized Learning Path
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Complete the quick grade assessment to get content tailored specifically to your learning level and interests
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Link href="/learning/curriculum">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3">
            Take Grade Assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-3">
          Takes only 2-3 minutes • Personalized recommendations await
        </p>
      </CardContent>
    </Card>
  )
}