'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Clock, Play, Volume2, CheckCircle, X, Bookmark, BookmarkCheck } from 'lucide-react'
import { FeedCard as FeedCardType } from '@/lib/sample-content'
import { useBookmarks } from '@/lib/bookmarks'
import { useProgress } from '@/lib/progress'
import { useAchievements } from '@/lib/achievements'
import { useLikes } from '@/lib/likes'
import { useComments, Comment } from '@/lib/comments'
import { clientData } from '@/lib/data'
import { useUser } from '@/lib/user-context'

interface FeedCardProps {
  card: FeedCardType
}

export function FeedCard({ card }: FeedCardProps) {
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

  const { toggleBookmark, checkStatus } = useBookmarks()
  const { markStarted, markCompleted, addTime } = useProgress()
  const { checkAchievements } = useAchievements()
  const { toggleLike, checkStatus: checkLikeStatus, getLikeCount } = useLikes()
  const { addComment, getComments, getCommentCount } = useComments()
  const { user } = useUser()

  // Check bookmark and like status on component mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      const status = await checkStatus(card.id)
      setIsBookmarked(status)
    }
    checkBookmarkStatus()
  }, [card.id, checkStatus])

  // Check like status and get real like count on component mount (only for authenticated users)
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
      // For unauthenticated users, use default values
      setIsLiked(false)
      setLikeCount(card.likes || 0)
    }
  }, [card.id, checkLikeStatus, getLikeCount, user])

  // Check comment count on component mount
  useEffect(() => {
    const checkCommentCount = async () => {
      const count = await getCommentCount(card.id)
      setCommentCount(count)
    }
    checkCommentCount()
  }, [card.id, getCommentCount])

  // Track content view progress (only for authenticated users)
  useEffect(() => {
    if (user) {
      const trackContentView = async () => {
        setProgressLoading(true)
        try {
          await markStarted(card.id)
          // Add estimated reading time
          await addTime(card.id, Math.min(card.readTime, 2)) // Cap at 2 minutes for initial view
        } catch (error) {
          console.error('Progress tracking error:', error)
        } finally {
          setProgressLoading(false)
        }
      }

      // Only track if not already loading
      if (!progressLoading) {
        trackContentView()
      }
    }
  }, [card.id, markStarted, addTime, progressLoading, user])

  // Track quiz completion
  useEffect(() => {
    const trackQuizCompletion = async () => {
      if (showResult && card.quiz && selectedAnswer !== null) {
        const isCorrect = selectedAnswer === card.quiz.correctAnswer
        setProgressLoading(true)
        try {
          if (isCorrect) {
            await markCompleted(card.id)
            // Check for new achievements after completing content
            if (user) {
              await checkAchievements(user.id)
            }
          } else {
            // Mark as in progress if incorrect
            await markStarted(card.id)
          }
          // Add time spent on quiz
          await addTime(card.id, 3) // Assume 3 minutes for quiz
        } catch (error) {
          console.error('Quiz progress tracking error:', error)
        } finally {
          setProgressLoading(false)
        }
      }
    }

    trackQuizCompletion()
  }, [showResult, selectedAnswer, card.id, card.quiz, markCompleted, markStarted, addTime, checkAchievements])

  const handleLike = async () => {
    setLikeLoading(true)
    try {
      const result = await toggleLike(card.id)
      if (result.success) {
        setIsLiked(result.isLiked || false)
        // Refresh like count after toggle
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
      // Load comments when opening
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

  const renderCardContent = () => {
    switch (card.type) {
      case 'text-image':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{card.content}</p>
            {card.imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={card.imageUrl}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
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
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => window.open(card.videoUrl, '_blank')}
                >
                  <Play className="h-6 w-6 mr-2" />
                  Watch Video
                </Button>
              ) : (
                <Button variant="secondary" size="lg" disabled>
                  <Play className="h-6 w-6 mr-2" />
                  Video Not Available
                </Button>
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
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => window.open(card.audioUrl, '_blank')}
                >
                  <Volume2 className="h-6 w-6 mr-2" />
                  Play Audio
                </Button>
              ) : (
                <Button variant="secondary" size="lg" disabled>
                  <Volume2 className="h-6 w-6 mr-2" />
                  Audio Not Available
                </Button>
              )}
            </div>
          </div>
        )

      case 'quiz':
        if (!showQuiz) {
          return (
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">{card.content}</p>
              <Button onClick={() => setShowQuiz(true)} className="w-full">
                Take Quiz
              </Button>
            </div>
          )
        }

        if (showResult && card.quiz) {
          const isCorrect = selectedAnswer === card.quiz.correctAnswer
          return (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{card.quiz.explanation}</p>
              </div>
              <Button onClick={() => {
                setShowQuiz(false)
                setSelectedAnswer(null)
                setShowResult(false)
              }} variant="outline">
                Try Again
              </Button>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{card.quiz?.question}</h3>
            <div className="space-y-2">
              {card.quiz?.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleQuizAnswer(index)}
                  variant="outline"
                  className="w-full justify-start text-left"
                  disabled={showResult}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <p className="text-muted-foreground leading-relaxed">{card.content}</p>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full max-w-2xl mx-auto mb-6"
    >
      <Card className="overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 border-2 hover:border-primary/30 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.h2
                className="text-xl font-bold mb-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {card.title}
              </motion.h2>
              <motion.div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge variant="secondary" className="transition-colors hover:bg-primary hover:text-primary-foreground">
                  {card.category}
                </Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {card.readTime} min read
                </div>
              </motion.div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {renderCardContent()}
          </motion.div>

          <motion.div
            className="flex items-center justify-between mt-6 pt-4 border-t"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`transition-all duration-200 ${isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
                >
                  <motion.div
                    animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.div>
                  <motion.span
                    key={likeCount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="font-medium"
                  >
                    {likeCount}
                  </motion.span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCommentToggle}
                  disabled={commentLoading}
                  className="transition-colors hover:text-blue-500"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <motion.span
                    key={commentCount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="font-medium"
                  >
                    {commentCount}
                  </motion.span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={bookmarkLoading}
                  className={`transition-all duration-200 ${isBookmarked ? 'text-blue-500 hover:text-blue-600' : 'hover:text-blue-500'}`}
                >
                  <motion.div
                    animate={{ rotate: isBookmarked ? [0, -10, 10, 0] : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-4 w-4 mr-1 fill-current" />
                    ) : (
                      <Bookmark className="h-4 w-4 mr-1" />
                    )}
                  </motion.div>
                  <span className="font-medium">
                    {bookmarkLoading ? 'Saving...' : isBookmarked ? 'Saved' : 'Save'}
                  </span>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showComments && (
              <motion.div
                className="mt-4 pt-4 border-t space-y-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {user && (
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                        disabled={commentLoading}
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={commentLoading || !newComment.trim()}
                        size="sm"
                      >
                        {commentLoading ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {commentLoading && comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                  ) : (
                    comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        className="flex gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback>
                            {comment.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.profiles?.full_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        </div>
                      </motion.div>
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
