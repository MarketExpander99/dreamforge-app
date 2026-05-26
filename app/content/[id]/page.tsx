'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/user-context'
import { getContentItem, updateUserProgress } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Clock,
  User,
  Calendar,
  CheckCircle,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  Volume2,
  HelpCircle
} from 'lucide-react'
import { ContentItem } from '@/lib/data'
import Image from 'next/image'

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [content, setContent] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [startingContent, setStartingContent] = useState(false)
  const [completingContent, setCompletingContent] = useState(false)
  const [showGradeAdvancement, setShowGradeAdvancement] = useState(false)
  const [newGrade, setNewGrade] = useState<string | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      if (!params.id) return

      try {
        const contentData = await getContentItem(params.id as string)
        if (!contentData) {
          setError('Content not found')
          return
        }
        setContent(contentData)

        // TODO: Load user progress, likes, bookmarks
        // For now, set some mock data
        setProgress(0)
        setIsCompleted(false)
        setIsLiked(false)
        setIsBookmarked(false)

      } catch (err) {
        console.error('Error loading content:', err)
        setError('Failed to load content')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [params.id])

  const handleLike = async () => {
    if (!user || !content) return
    // TODO: Implement like functionality
    setIsLiked(!isLiked)
  }

  const handleBookmark = async () => {
    if (!user || !content) return
    // TODO: Implement bookmark functionality
    setIsBookmarked(!isBookmarked)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content?.title,
          text: content?.content.substring(0, 100) + '...',
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  const handleStartContent = async () => {
    if (!user || !content) return

    setStartingContent(true)
    try {
      await updateUserProgress(user.id, content.id, {
        status: 'in_progress',
        progress_percentage: 10
      })
      setProgress(10)
      // Stay on the same page to continue learning
    } catch (err) {
      console.error('Error updating progress:', err)
      // Could add toast notification here
    } finally {
      setStartingContent(false)
    }
  }

  const handleCompleteContent = async () => {
    if (!user || !content) return

    setCompletingContent(true)
    try {
      // First update progress in database
      await updateUserProgress(user.id, content.id, {
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString()
      })

      // Then evaluate performance with adaptive engine
      const evaluationResponse = await fetch('/api/progress/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: content.id,
          score: quizCompleted ? quizScore : 100, // Use quiz score if available, otherwise 100
          timeSpent: Math.max(1, Math.floor((Date.now() - Date.now()) / (1000 * 60))), // Estimate time spent (fallback to 1 min)
          contentType: content.type,
          difficulty: content.difficulty,
          tags: content.tags,
          category: content.category?.name || 'General'
        })
      })

      if (evaluationResponse.ok) {
        const evaluationData = await evaluationResponse.json()
        console.log('Performance evaluation completed:', evaluationData.evaluation)

        // Check for grade advancement and show celebration
        if (evaluationData.evaluation.gradeReadiness) {
          // Trigger grade advancement celebration
          setShowGradeAdvancement(true)
          // Extract new grade from evaluation or fetch from profile
          // For now, we'll show a generic celebration
          setNewGrade('Next Grade')
        }
      } else {
        console.error('Failed to evaluate performance')
      }

      setProgress(100)
      setIsCompleted(true)
    } catch (err) {
      console.error('Error completing content:', err)
      // Could add toast notification here
    } finally {
      setCompletingContent(false)
    }
  }

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[questionIndex] = answerIndex
    setQuizAnswers(newAnswers)
  }

  const handleQuizSubmit = () => {
    if (!content?.quiz) return

    let correct = 0
    quizAnswers.forEach((answer, index) => {
      if (content.quiz && answer === content.quiz.correctAnswer) {
        correct++
      }
    })

    const score = Math.round((correct / quizAnswers.length) * 100)
    setQuizScore(score)
    setQuizCompleted(true)

    // Mark as completed if quiz passed
    if (score >= 70) {
      handleCompleteContent()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Content not found'}
            </h1>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{content.category?.name}</Badge>
                <Badge variant="secondary">{content.difficulty}</Badge>
                <Badge variant="outline">{content.type}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {content.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {content.read_time} min read
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {content.likes} likes
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {content.views} views
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant={isBookmarked ? "default" : "outline"}
                size="sm"
                onClick={handleBookmark}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {user && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="mb-4" />

              <div className="flex gap-2">
                {!isCompleted && progress === 0 && (
                  <Button onClick={handleStartContent} disabled={startingContent}>
                    {startingContent ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-current mr-2"></div>
                        Starting...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Learning
                      </>
                    )}
                  </Button>
                )}
                {!isCompleted && progress > 0 && progress < 100 && (
                  <Button onClick={handleCompleteContent} disabled={completingContent}>
                    {completingContent ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-current mr-2"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                )}
                {isCompleted && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Completed!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Image */}
            {content.image_url && (
              <div className="mb-6">
                <Image
                  src={content.image_url}
                  alt={content.title}
                  width={800}
                  height={400}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Video */}
            {content.video_url && (
              <div className="mb-6">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <Button variant="secondary" size="lg">
                    <PlayCircle className="mr-2 h-6 w-6" />
                    Play Video
                  </Button>
                </div>
              </div>
            )}

            {/* Audio */}
            {content.audio_url && (
              <div className="mb-6">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-6 w-6" />
                    <div className="flex-1">
                      <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded">
                        <div className="h-2 bg-blue-500 rounded w-1/3"></div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Text Content */}
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content.content }} />
            </div>
          </CardContent>
        </Card>

        {/* Quiz */}
        {content.quiz && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Knowledge Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!quizCompleted ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Question {currentQuizQuestion + 1} of {content.quiz.options.length}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {content.quiz.question}
                    </p>
                    <div className="space-y-2">
                      {content.quiz.options.map((option, index) => (
                        <Button
                          key={index}
                          variant={quizAnswers[currentQuizQuestion] === index ? "default" : "outline"}
                          className="w-full justify-start text-left"
                          onClick={() => handleQuizAnswer(currentQuizQuestion, index)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuizQuestion(Math.max(0, currentQuizQuestion - 1))}
                      disabled={currentQuizQuestion === 0}
                    >
                      Previous
                    </Button>
                    {currentQuizQuestion < content.quiz.options.length - 1 ? (
                      <Button
                        onClick={() => setCurrentQuizQuestion(currentQuizQuestion + 1)}
                        disabled={quizAnswers[currentQuizQuestion] === undefined}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={handleQuizSubmit}
                        disabled={quizAnswers.length !== content.quiz.options.length}
                      >
                        Submit Quiz
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4">
                    <div className={`text-4xl font-bold ${quizScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                      {quizScore}%
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {quizScore >= 70 ? 'Great job! You passed!' : 'Keep practicing!'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {content.quiz.explanation}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grade Advancement Celebration Modal */}
        {showGradeAdvancement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center relative overflow-hidden">
              {/* Confetti effect - simple CSS animation */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute top-8 right-8 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="absolute bottom-8 left-6 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute top-6 right-4 w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                <div className="absolute bottom-4 right-6 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>

              <div className="relative z-10">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Congratulations!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You've advanced to {newGrade}! Your hard work and dedication have paid off.
                </p>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg mb-6">
                  <span className="font-semibold">Grade Unlocked: {newGrade}</span>
                </div>
                <Button
                  onClick={() => setShowGradeAdvancement(false)}
                  className="w-full"
                >
                  Continue Learning
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
