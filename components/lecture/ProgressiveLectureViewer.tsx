'use client'

import React, { useState } from 'react'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  Clock, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff,
  Lightbulb 
} from 'lucide-react'
import { LectureSection } from '@/lib/ai/lecture-generation'

interface LectureViewerProps {
  topic: string
  masterLecture: string
  sections: LectureSection[]
  onSectionComplete?: (sectionNumber: number) => void
  onLectureComplete?: () => void
  initialCompleted?: number[]
}

export function ProgressiveLectureViewer({
  topic,
  masterLecture,
  sections,
  onSectionComplete,
  onLectureComplete,
  initialCompleted = [],
}: LectureViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    new Set(initialCompleted)
  )
  const [showMaster, setShowMaster] = useState(false)
  const [reflectionInputs, setReflectionInputs] = useState<Record<number, string>>({})

  const totalSections = sections.length
  const completedCount = completedSections.size
  const progressPercent = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0

  const currentSection = sections[currentSectionIndex]
  const isCurrentCompleted = currentSection ? completedSections.has(currentSection.section_number) : false
  const isFirst = currentSectionIndex === 0
  const isLast = currentSectionIndex === totalSections - 1

  const goToSection = (index: number) => {
    if (index >= 0 && index < totalSections) {
      setCurrentSectionIndex(index)
    }
  }

  const markCurrentComplete = () => {
    if (!currentSection) return

    const newCompleted = new Set(completedSections)
    newCompleted.add(currentSection.section_number)
    setCompletedSections(newCompleted)

    onSectionComplete?.(currentSection.section_number)

    // Auto-advance if not last
    if (!isLast) {
      setTimeout(() => {
        setCurrentSectionIndex(currentSectionIndex + 1)
      }, 400)
    } else {
      onLectureComplete?.()
    }
  }

  const handleReflectionChange = (sectionNum: number, value: string) => {
    setReflectionInputs(prev => ({
      ...prev,
      [sectionNum]: value
    }))
  }

  const totalMinutes = sections.reduce((sum, s) => sum + (s.estimated_minutes || 0), 0)

  if (!sections.length || !currentSection) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No sections available for this lecture.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{topic}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Progressive Lecture • {totalSections} sections • ~{totalMinutes} min total
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMaster(!showMaster)}
            className="shrink-0"
          >
            {showMaster ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" /> Hide Full Lecture
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" /> View Full Master
              </>
            )}
          </Button>
        </div>

        {/* Overall Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Your progress</span>
            <span className="text-muted-foreground">
              {completedCount} / {totalSections} sections • {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Full Master Lecture (collapsible) */}
      {showMaster && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Full Master Lecture (Source of Truth)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This is the complete, cohesive document generated in Stage 1 before it was split into progressive sections.
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-auto rounded border bg-background p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {masterLecture}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section, idx) => {
          const isCompleted = completedSections.has(section.section_number)
          const isActive = idx === currentSectionIndex
          return (
            <Button
              key={section.section_number}
              variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
              size="sm"
              onClick={() => goToSection(idx)}
              className="flex items-center gap-1.5 text-xs"
            >
              {isCompleted && <CheckCircle className="h-3.5 w-3.5" />}
              {section.section_number}. {section.title.replace(/^\d+\.\s*/, '')}
            </Button>
          )
        })}
      </div>

      {/* Current Section Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/40 border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono">
                  Section {currentSection.section_number} / {totalSections}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {currentSection.estimated_minutes} min
                </div>
              </div>
              <CardTitle className="text-2xl leading-tight">
                {currentSection.title}
              </CardTitle>
            </div>
            {isCurrentCompleted && (
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle className="h-5 w-5" /> Completed
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Main Content */}
          <div>
            <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
              Content
            </h3>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-relaxed whitespace-pre-wrap">
              {currentSection.content}
            </div>
          </div>

          <Separator />

          {/* Key Takeaways */}
          {currentSection.key_takeaways?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Key Takeaways
              </h3>
              <ul className="space-y-2 pl-1">
                {currentSection.key_takeaways.map((takeaway, i) => (
                  <li key={i} className="flex gap-3 text-[15px]">
                    <span className="mt-1.5 block h-1.5 w-1.5 rounded-full bg-foreground/70 shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites + Reflection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                Prerequisites
              </h3>
              <p className="text-sm rounded bg-muted p-3">{currentSection.prerequisites || 'None'}</p>
            </div>

            {currentSection.reflection_prompt && (
              <div>
                <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                  Reflection / Mini-Exercise
                </h3>
                <div className="rounded border bg-muted/50 p-3 text-sm mb-2">
                  {currentSection.reflection_prompt}
                </div>
                <textarea
                  className="w-full rounded border bg-background p-3 text-sm min-h-[76px] focus:outline-none focus:ring-1"
                  placeholder="Write your reflection here (optional for now)..."
                  value={reflectionInputs[currentSection.section_number] || ''}
                  onChange={(e) => handleReflectionChange(currentSection.section_number, e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer actions */}
        <div className="border-t bg-muted/30 px-6 py-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => goToSection(currentSectionIndex - 1)}
              disabled={isFirst}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => goToSection(currentSectionIndex + 1)}
              disabled={isLast}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <Button 
            onClick={markCurrentComplete} 
            disabled={isCurrentCompleted}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isCurrentCompleted ? (
              <>Section Completed ✓</>
            ) : (
              <>Mark complete &amp; {isLast ? 'finish' : 'unlock next'} →</>
            )}
          </Button>
        </div>
      </Card>

      {/* Section list summary (accordion) */}
      <div className="pt-2">
        <h3 className="text-sm font-semibold mb-3 px-1 text-muted-foreground tracking-wider">ALL SECTIONS</h3>
        <Accordion type="multiple" className="w-full">
          {sections.map((section, idx) => {
            const isDone = completedSections.has(section.section_number)
            return (
              <AccordionItem key={section.section_number} value={`sec-${section.section_number}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3 pr-4 w-full">
                    <div className="font-mono text-xs px-2 py-0.5 rounded bg-muted shrink-0">
                      {section.section_number}
                    </div>
                    <span className="flex-1 truncate">{section.title}</span>
                    {isDone && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {section.estimated_minutes} min
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-2 pr-1 pb-1 space-y-3">
                    <div className="text-sm whitespace-pre-wrap leading-snug">
                      {section.content.substring(0, 420)}{section.content.length > 420 ? '…' : ''}
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => goToSection(idx)}
                    >
                      Jump to this section
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Each section introduces genuinely new material. Later sections assume mastery of earlier ones.
      </p>
    </div>
  )
}
