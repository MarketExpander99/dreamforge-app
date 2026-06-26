'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Clock, Play, Volume2, CheckCircle, X, Bookmark, BookmarkCheck, Award, ArrowRight } from 'lucide-react'
import { FeedCard as FeedCardType } from '@/lib/sample-content'
import { useBookmarks } from '@/lib/bookmarks'
import { useProgress } from '@/lib/progress'
import { useAchievements } from '@/lib/achievements'
import { useLikes } from '@/lib/likes'
import { useComments, Comment } from '@/lib/comments'
import { useUser } from '@/lib/user-context'

interface FeedCardProps {
  card: FeedCardType
  onComplete?: (cardId: string) => void
  isLastInSubject?: boolean
  subjectName?: string
}

export function FeedCard({ card, onComplete, isLastInSubject = false, subjectName }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(card.likes || 0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [progressLoading, setProgressLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(card.comments || 0)
  const [commentLoading, setCommentLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [showSubjectComplete, setShowSubjectComplete] = useState(false)

  const { toggleBookmark, checkStatus } = useBookmarks()
  const { markStarted, markCompleted, addTime } = useProgress()
  const { checkAchievements } = useAchievements()
  const { toggleLike, checkStatus: checkLikeStatus, getLikeCount } = useLikes()
  const { addComment, getComments, getCommentCount } = useComments()
  const { user } = useUser()

  // === ORIGINAL EFFECTS (preserved exactly) ===
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      const status = await checkStatus(card.id)
      setIsBookmarked(status)
    }
    checkBookmarkStatus()
  }, [card.id, checkStatus])

  useEffect(() => {
    if (user) {
      const checkLikeStatusAndCount = async () => {
        const [likeStatus, count] = await Promise.all([
          checkLikeStatus(card.id),
          getLikeCount(card.id)
        ])
        setIsLiked(likeStatus)
        setLikeCount(count)
      }
      checkLikeStatusAndCount()
    } else {
      setIsLiked(false)
      setLikeCount(card.likes || 0)
    }
  }, [card.id, checkLikeStatus, getLikeCount, user])

  useEffect(() => {
    const checkCommentCount = async () => {
      const count = await getCommentCount(card.id)
      setCommentCount(count)
    }
    checkCommentCount()
  }, [card.id, getCommentCount])

  useEffect(() => {
    if (user) {
      const trackContentView = async () => {
        setProgressLoading(true)
        try {
          await markStarted(card.id)
          await addTime(card.id, Math.min(card.readTime, 2))
        } catch (error) {
          console.error('Progress tracking error:', error)
        } finally {
          setProgressLoading(false)
        }
      }
      if (!progressLoading) {
        trackContentView()
      }
    }
  }, [card.id, markStarted, addTime, progressLoading, user])

  useEffect(() => {
    const trackQuizCompletion = async () => {
      if (showResult && card.quiz && selectedAnswer !== null) {
        const isCorrect = selectedAnswer === card.quiz.correctAnswer
        setProgressLoading(true)
        try {
          if (isCorrect) {
            await markCompleted(card.id)
            if (user) {
              await checkAchievements(user.id)
            }
          } else {
            await markStarted(card.id)
          }
          await addTime(card.id, 3)
        } catch (error) {
          console.error('Quiz progress tracking error:', error)
        } finally {
          setProgressLoading(false)
        }
      }
    }
    trackQuizCompletion()
  }, [showResult, selectedAnswer, card.id, card.quiz, markCompleted, markStarted, addTime, checkAchievements, user])

  const handleLike = async () => {
    setLikeLoading(true)
    try {
      const result = await toggleLike(card.id)
      if (result.success) {
        setIsLiked(result.isLiked || false)
        const newCount = await getLikeCount(card.id)
        setLikeCount(newCount)
      }
    } catch (error) {
      console.error('Like error:', error)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleBookmark = async () => {
    setBookmarkLoading(true)
    try {
      const result = await toggleBookmark(card.id)
      if (result.success) {
        setIsBookmarked(result.isBookmarked || false)
      }
    } catch (error) {
      console.error('Bookmark error:', error)
    } finally {
      setBookmarkLoading(false)
    }
  }

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    setShowResult(true)
  }

  const handleCommentToggle = async () => {
    if (!showComments) {
      setCommentLoading(true)
      try {
        const fetchedComments = await getComments(card.id)
        setComments(fetchedComments)
      } catch (error) {
        console.error('Error loading comments:', error)
      } finally {
        setCommentLoading(false)
      }
    }
    setShowComments(!showComments)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setCommentLoading(true)
    try {
      const result = await addComment(card.id, newComment)
      if (result.success && result.comment) {
        setComments(prev => [...prev, result.comment!])
        setCommentCount(prev => prev + 1)
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  // === NEW: Completion handler with onComplete support ===
  const handleComplete = async () => {
    setProgressLoading(true)
    try {
      await markCompleted(card.id)
      if (user) {
        await checkAchievements(user.id)
      }
      await addTime(card.id, 2)

      if (isLastInSubject) {
        setShowSubjectComplete(true)
      }

      setIsCompleted(true)

      setTimeout(() => {
        onComplete?.(card.id)
      }, 500)
    } catch (error) {
      console.error('Complete error:', error)
    } finally {
      setProgressLoading(false)
    }
  }

  const renderCardContent = () => {
    switch (card.type) {
      case 'text-image':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{card.content}</p>
            {card.imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image src={card.imageUrl} alt={card.title} fill className="object-cover" loading="lazy" />
              </div>
            )}
          </div>
        )
      case 'video':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{card.content}</p>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {card.videoUrl ? (
                <Button variant="secondary" size="lg" onClick={() => window.open(card.videoUrl, '_blank')}>
                  <Play className="h-6 w-6 mr-2" /> Watch Video
                </Button>
              ) : (
                <Button variant="secondary" size="lg" disabled><Play className="h-6 w-6 mr-2" /> Video Not Available</Button>
              )}
            </div>
          </div>
        )
      case 'audio':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{card.content}</p>
            <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
              {card.audioUrl ? (
                <Button variant="secondary" size="lg" onClick={() => window.open(card.audioUrl, '_blank')}>
                  <Volume2 className="h-6 w-6 mr-2" /> Play Audio
                </Button>
              ) : (
                <Button variant="secondary" size="lg" disabled><Volume2 className="h-6 w-6 mr-2" /> Audio Not Available</Button>
              )}
            </div>
          </div>
        )
      case 'quiz':
        if (!showQuiz) {
          return (
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">{card.content}</p>
              <Button onClick={() => setShowQuiz(true)} className="w-full">Take Quiz</Button>
            </div>
          )
        }
        if (showResult && card.quiz) {
          const isCorrect = selectedAnswer === card.quiz.correctAnswer
          return (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-600" />}
                  <span className={`font-semibold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{card.quiz.explanation}</p>
              </div>
              <Button onClick={() => { setShowQuiz(false); setSelectedAnswer(null); setShowResult(false) }} variant="outline">Try Again</Button>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{card.quiz?.question}</h3>
            <div className="space-y-2">
              {card.quiz?.options.map((option, index) => (
                <Button key={index} onClick={() => handleQuizAnswer(index)} variant="outline" className="w-full justify-start text-left" disabled={showResult}>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )
      default:
        return <p className="text-muted-foreground leading-relaxed">{card.content}</p>
    }
  }

  if (isCompleted && !showSubjectComplete) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="w-full max-w-2xl mx-auto mb-6"
    >
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl bg-white dark:bg-zinc-950">
        <CardHeader className="pb-3 pt-5 px-5">
          {/* X-Style Header */}
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 ring-1 ring-zinc-200 dark:ring-zinc-800 flex-shrink-0">
              <AvatarImage src="/icon-192x192.png" alt="DreamForge AI" />
              <AvatarFallback className="bg-zinc-900 text-white text-xs font-semibold">DF</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">DreamForge AI Teacher</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">·</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{subjectName || card.category}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{card.category}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {card.readTime} min
                </div>
                {card.quiz && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">Quiz</Badge>}
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3 leading-tight">
            {card.title}
          </h2>
        </CardHeader>

        <CardContent className="px-5 pb-5 pt-1">
          <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            {renderCardContent()}
          </div>

          {/* Subject Complete Banner */}
          <AnimatePresence>
            {showSubjectComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900"
              >
                <div className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">Subject now completed!</p>
                    <p className="text-sm text-emerald-600/90 dark:text-emerald-400/90 mt-1">
                      Great work. You've earned XP and unlocked the next stage in your path.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Bar */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1">
              {/* Social Actions */}
              <Button variant="ghost" size="sm" onClick={handleLike} disabled={likeLoading} className={`h-8 px-2.5 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                <Heart className={`h-4 w-4 mr-1.5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium tabular-nums">{likeCount}</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={handleCommentToggle} disabled={commentLoading} className="h-8 px-2.5 hover:text-blue-500">
                <MessageCircle className="h-4 w-4 mr-1.5" />
                <span className="font-medium tabular-nums">{commentCount}</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={handleBookmark} disabled={bookmarkLoading} className={`h-8 px-2.5 ${isBookmarked ? 'text-blue-500' : 'hover:text-blue-500'}`}>
                {isBookmarked ? <BookmarkCheck className="h-4 w-4 mr-1.5 fill-current" /> : <Bookmark className="h-4 w-4 mr-1.5" />}
                <span className="font-medium">Save</span>
              </Button>
            </div>

            {/* Primary Complete Button */}
            <Button 
              onClick={handleComplete} 
              disabled={progressLoading || showSubjectComplete}
              className="h-9 px-5 rounded-full bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-medium flex items-center gap-2"
            >
              {progressLoading ? 'Saving...' : (
                <>Complete Step <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>

          {/* Comments Section (preserved) */}
          <AnimatePresence>
            {showComments && (
              <motion.div className="mt-4 pt-4 border-t space-y-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                {user && (
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>{user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input 
                        placeholder="Write a comment..." 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()} 
                        disabled={commentLoading} 
                      />
                      <Button onClick={handleAddComment} disabled={commentLoading || !newComment.trim()} size="sm">Post</Button>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {commentLoading && comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1 text-sm">
                              <span className="font-medium">{comment.profiles?.full_name || 'Anonymous'}</span>
                              <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
