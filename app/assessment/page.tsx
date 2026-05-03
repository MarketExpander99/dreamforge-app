'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Mic, MessageSquare, Loader2, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AssessmentQuestion {
  id: string
  subject: string
  question_type: 'multiple_choice' | 'text_input' | 'voice_input'
  question: string
  options?: string[]
  correct_answer?: string
  difficulty: string
  points: number
}

interface AssessmentResponse {
  questionId: string
  question: string
  answer: string
  correctAnswer?: string
  subject: string
  points: number
  isCorrect?: boolean
}

interface AssessmentResult {
  grade: string
  confidence: number
  reasoning: string
  strengths: string[]
  weaknesses: string[]
}

export default function AssessmentPage() {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<AssessmentResponse[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    loadAssessmentQuestions()
  }, [])

  const loadAssessmentQuestions = async () => {
    try {
      const response = await fetch('/api/assessment/grade?curriculum=CAPS&limit=10')
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error('Error loading questions:', error)
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
      subject: currentQuestion.subject,
      points: currentQuestion.points,
      correctAnswer: currentQuestion.options ? undefined : currentQuestion.question.includes('sentence') ? 'sentence' : undefined
    }

    // Simple correctness check for multiple choice
    if (currentQuestion.options && currentQuestion.correct_answer) {
      response.isCorrect = currentAnswer === currentQuestion.correct_answer
      response.correctAnswer = currentQuestion.correct_answer
    }

    setResponses([...responses, response])
    setCurrentAnswer('')
    setCurrentQuestionIndex(currentQuestionIndex + 1)
  }

  const submitAssessment = async () => {
    if (responses.length === 0) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/assessment/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: responses.map(r => ({
            question: r.question,
            answer: r.answer,
            correctAnswer: r.correctAnswer,
            subject: r.subject,
            points: r.points,
            isCorrect: r.isCorrect
          })),
          curriculum: 'CAPS'
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.assessment)
      } else {
        console.error('Assessment submission failed:', data.error)
      }
    } catch (error) {
      console.error('Error submitting assessment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const startVoiceRecording = () => {
    // This would integrate with Web Speech API
    setIsRecording(true)
    // Placeholder for voice recording implementation
    setTimeout(() => {
      setIsRecording(false)
      setCurrentAnswer('Voice response recorded')
    }, 3000)
  }

  const retakeAssessment = () => {
    setCurrentQuestionIndex(0)
    setResponses([])
    setCurrentAnswer('')
    setResult(null)
  }

  const goToCurriculum = () => {
    router.push('/learning/curriculum')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Star className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
            <CardDescription>Your child's recommended grade level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{result.grade}</div>
              <div className="text-sm text-gray-600 mb-4">
                Confidence: {Math.round(result.confidence * 100)}%
              </div>
              <Progress value={result.confidence * 100} className="w-full mb-4" />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Assessment Summary</h3>
              <p className="text-gray-600 mb-4">{result.reasoning}</p>
            </div>

            {result.strengths.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-green-700">Strengths</h3>
                <ul className="space-y-1">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.weaknesses.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-orange-700">Areas for Growth</h3>
                <ul className="space-y-1">
                  {result.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <Button onClick={retakeAssessment} variant="outline" className="flex-1">
                Retake Assessment
              </Button>
              <Button onClick={goToCurriculum} className="flex-1">
                Explore Curriculum
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Review Your Answers</CardTitle>
            <CardDescription>
              You've completed {responses.length} questions. Ready to submit?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {responses.map((response, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{response.question}</p>
                    <p className="text-sm text-gray-600">Your answer: {response.answer}</p>
                  </div>
                  <Badge variant={response.isCorrect ? 'default' : 'secondary'}>
                    {response.points} pts
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
                    Analyzing...
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
        <h1 className="text-3xl font-bold mb-2">Grade Level Assessment</h1>
        <p className="text-gray-600">Help us determine the best grade level for your child</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
            <Badge variant="secondary">{currentQuestion.subject}</Badge>
          </div>
          <Progress value={progress} className="w-full mb-4" />
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          {currentQuestion.difficulty && (
            <Badge variant="outline" className="w-fit">
              {currentQuestion.difficulty}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-2">
              <Label>Select your answer</Label>
              <Select value={currentAnswer} onValueChange={handleAnswer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an answer..." />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options.map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentQuestion.question_type === 'text_input' && (
            <div className="space-y-2">
              <Label htmlFor="text-answer">Your Answer</Label>
              <Textarea
                id="text-answer"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {currentQuestion.question_type === 'voice_input' && (
            <div className="space-y-4">
              <Button
                onClick={startVoiceRecording}
                disabled={isRecording}
                variant="outline"
                className="w-full"
              >
                {isRecording ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Record Voice Answer
                  </>
                )}
              </Button>
              {currentAnswer && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{currentAnswer}</p>
                </div>
              )}
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