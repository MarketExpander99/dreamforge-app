'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Star, BookOpen, Target, TrendingUp, Award, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/user-context'
import { DiagnosticQuestion } from '@/lib/diagnostic-assessment'

interface AssessmentResponse {
  questionId: string
  question: string
  answer: string
  subject: string
}

interface DiagnosticResults {
  recommended_grade: string
  subject_proficiency: {
    Mathematics: number
    English: number
    Science: number
    'General Knowledge': number
  }
  overall_score: number
  strengths: string[]
  gaps: string[]
  suggested_topics: string[]
  assessment_summary: string
}

const subjectColors = {
  Mathematics: 'bg-blue-100 text-blue-800 border-blue-200',
  English: 'bg-green-100 text-green-800 border-green-200',
  Science: 'bg-purple-100 text-purple-800 border-purple-200',
  'General Knowledge': 'bg-orange-100 text-orange-800 border-orange-200'
}

const subjectIcons = {
  Mathematics: '🔢',
  English: '📚',
  Science: '🧪',
  'General Knowledge': '🌍'
}

export default function DiagnosticAssessmentPage() {
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<AssessmentResponse[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<DiagnosticResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const { refreshAuth } = useAuth()

  useEffect(() => {
    loadAssessmentQuestions()
  }, [])

  const loadAssessmentQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/assessment/diagnostic')
      const data = await response.json()

      if (response.ok && data.questions) {
        setQuestions(data.questions)
      } else {
        setError(data.error || 'Failed to load assessment questions')
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer: string) => {
    setCurrentAnswer(answer)
  }

  const nextQuestion = () => {
    if (!currentAnswer.trim()) return

    const currentQuestion = questions[currentQuestionIndex]
    const response: AssessmentResponse = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: currentAnswer,
      subject: currentQuestion.subject
    }

    setResponses([...responses, response])
    setCurrentAnswer('')
    setCurrentQuestionIndex(currentQuestionIndex + 1)
  }

  const submitAssessment = async () => {
    if (responses.length === 0) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/assessment/diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: responses
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResults(data.results)
        // Refresh auth context to update profile data
        try {
          await refreshAuth()
        } catch (refreshError) {
          console.warn('Failed to refresh auth after assessment:', refreshError)
        }
      } else {
        setError(data.error || 'Failed to submit assessment')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Error submitting assessment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const startLearning = () => {
    router.push('/learning/curriculum')
  }

  const retakeAssessment = () => {
    setCurrentQuestionIndex(0)
    setResponses([])
    setCurrentAnswer('')
    setResults(null)
    setError(null)
    loadAssessmentQuestions()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Generating your personalized assessment...</p>
        </div>
      </div>
    )
  }

  if (error && !results) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <Button onClick={loadAssessmentQuestions} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push('/learning/curriculum')}>
                Back to Curriculum
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (results) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Celebration Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Award className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Assessment Complete! 🎉</h1>
              <p className="text-gray-600 text-lg">{results.assessment_summary}</p>
            </CardContent>
          </Card>

          {/* Grade Recommendation */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Recommended Grade Level</CardTitle>
              <CardDescription>Your personalized learning path starts here</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-6xl font-bold text-blue-600 mb-4"
              >
                {results.recommended_grade}
              </motion.div>
              <div className="text-sm text-gray-600 mb-4">
                Overall Proficiency: {results.overall_score}%
              </div>
              <Progress value={results.overall_score} className="w-full max-w-md mx-auto" />
            </CardContent>
          </Card>

          {/* Subject Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Subject Proficiency Breakdown
              </CardTitle>
              <CardDescription>Your performance across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results.subject_proficiency).map(([subject, score], index) => (
                  <motion.div
                    key={subject}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{subjectIcons[subject as keyof typeof subjectIcons]}</span>
                            <div>
                              <h3 className="font-semibold">{subject}</h3>
                              <p className="text-sm text-gray-600">{score}% proficiency</p>
                            </div>
                          </div>
                          <Badge className={subjectColors[subject as keyof typeof subjectColors]}>
                            {score >= 80 ? 'Strong' : score >= 60 ? 'Good' : 'Needs Work'}
                          </Badge>
                        </div>
                        <Progress value={score} className="w-full" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.strengths.map((strength, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <TrendingUp className="h-5 w-5" />
                  Areas for Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.gaps.map((gap, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + index * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="h-2 w-2 bg-orange-500 rounded-full flex-shrink-0 mt-1" />
                      <span className="text-sm">{gap}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Suggested Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recommended Topics to Start With
              </CardTitle>
              <CardDescription>We'll generate personalized content for these areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {results.suggested_topics.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 + index * 0.05 }}
                  >
                    <Badge variant="secondary" className="text-sm py-1 px-3">
                      {topic}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={startLearning}
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
                <Button
                  onClick={retakeAssessment}
                  variant="outline"
                  size="lg"
                  className="flex-1 sm:flex-none"
                >
                  Retake Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Review Your Answers</CardTitle>
            <CardDescription>
              You've completed all {responses.length} questions. Ready to see your results?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {responses.map((response, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{response.question}</p>
                    <p className="text-sm text-gray-600">Your answer: {response.answer}</p>
                  </div>
                  <Badge variant="outline" className={subjectColors[response.subject as keyof typeof subjectColors]}>
                    {response.subject}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                variant="outline"
                disabled={currentQuestionIndex === 0}
              >
                Back
              </Button>
              <Button
                onClick={submitAssessment}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Your Results...
                  </>
                ) : (
                  'Submit Assessment'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Diagnostic Assessment</h1>
        <p className="text-gray-600">Let's find your perfect learning level across different subjects</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
            <Badge className={subjectColors[currentQuestion.subject]}>
              {subjectIcons[currentQuestion.subject]} {currentQuestion.subject}
            </Badge>
          </div>
          <Progress value={progress} className="w-full mb-4" />
          <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
          <Badge variant="secondary" className="w-fit">
            {currentQuestion.difficulty}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choose the best answer:</p>
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      currentAnswer === option
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentQuestion.question_type === 'short_answer' && (
            <div className="space-y-2">
              <label htmlFor="answer" className="text-sm font-medium text-gray-700">
                Your Answer
              </label>
              <Textarea
                id="answer"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={nextQuestion}
              disabled={!currentAnswer.trim()}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}