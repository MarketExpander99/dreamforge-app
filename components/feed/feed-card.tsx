// components/feed/feed-card.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MessageCircle, Clock, Play, Volume2, CheckCircle, X, Bookmark, BookmarkCheck, Trophy } from 'lucide-react'
import { FeedCard as FeedCardType } from '@/lib/sample-content'
import { useBookmarks } from '@/lib/bookmarks'
import { useProgress } from '@/lib/progress'
import { useAchievements } from '@/lib/achievements'
import { useLikes } from '@/lib/likes'
import { useComments, Comment } from '@/lib/comments'
import { useUser } from '@/lib/user-context'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

interface FeedCardProps {
  card: FeedCardType
}

export function FeedCard({ card }: FeedCardProps) {
  const supabase = createBrowserSupabaseClient()
  const { user } = useUser()

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
  const [isCardCompleted, setIsCardCompleted] = useState(false)

  const { toggleBookmark, checkStatus } = useBookmarks()
  const { markStarted, markCompleted } = useProgress()
  const { checkAchievements } = useAchievements()
  const { toggleLike, checkStatus: checkLikeStatus, getLikeCount } = useLikes()
  const { addComment, getComments, getCommentCount } = useComments()

  // Fixed & Strong Progress Saver
  const saveProgress = async (contentId: string, increment: number = 35, forceComplete: boolean = false) => {
    if (!user?.id) return
    setProgressLoading(true)
    try {
      const { data: current } = await supabase
        .from('user_progress')
        .select('progress_percentage, time_spent')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single()

      let newPct = Math.min(100, (current?.progress_percentage || 0) + increment)
      if (forceComplete) newPct = 100

      await supabase.from('user_progress').upsert({
        user_id: user.id,
        content_id: contentId,
        status: newPct >= 100 ? 'completed' : 'in_progress',
        progress_percentage: newPct,
        time_spent: (current?.time_spent || 0) + 10,
        last_accessed_at: new Date().toISOString(),
        completed_at: newPct >= 100 ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,content_id' })

      if (newPct >= 100) setIsCardCompleted(true)
      console.log(`✅ Progress updated → ${newPct}% for ${contentId}`)
    } catch (err) {
      console.error('Progress save error:', err)
    } finally {
      setProgressLoading(false)
    }
  }

  // Initial view tracking
  useEffect(() => {
    if (user) {
      saveProgress(card.id, 25)
      markStarted(card.id)
    }
  }, [card.id, user])

  // Quiz completion
  useEffect(() => {
    if (showResult && selectedAnswer !== null && card.quiz) {
      const isCorrect = selectedAnswer === card.quiz.correctAnswer
      saveProgress(card.id, isCorrect ? 55 : 20, isCorrect)
      if (isCorrect) {
        markCompleted(card.id)
        if (user) checkAchievements(user.id)
      }
    }
  }, [showResult, selectedAnswer, card.id, card.quiz, user])

  const handleMarkAsComplete = async () => {
    await saveProgress(card.id, 70, true)
    alert(`🎉 ${card.title} marked as completed! Progress updated to 100%.`)
    setIsCardCompleted(true)
  }

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    setShowResult(true)
  }

  const handleLike = async () => {
    setLikeLoading(true)
    try {
      const result = await toggleLike(card.id)
      if (result.success) {
        setIsLiked(result.isLiked || false)
        const newCount = await getLikeCount(card.id)
        setLikeCount(newCount)
        await saveProgress(card.id, 10)
      }
    } catch (e) { console.error(e) }
    setLikeLoading(false)
  }

  const handleBookmark = async () => {
    setBookmarkLoading(true)
    try {
      const result = await toggleBookmark(card.id)
      if (result.success) setIsBookmarked(result.isBookmarked || false)
      await saveProgress(card.id, 22)
    } catch (e) {}
    setBookmarkLoading(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setCommentLoading(true)
    try {
      const result = await addComment(card.id, newComment)
      if (result.success) {
        setCommentCount(prev => prev + 1)
        setNewComment('')
        await saveProgress(card.id, 16)
      }
    } catch (e) {}
    setCommentLoading(false)
  }

  const handleCommentToggle = async () => {
    if (!showComments) {
      setCommentLoading(true)
      try {
        const fetched = await getComments(card.id)
        setComments(fetched)
      } catch (e) {}
      setCommentLoading(false)
    }
    setShowComments(!showComments)
  }

  const renderCardContent = () => {
    switch (card.type) {
      case 'text-image':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{card.content}</p>
            {card.imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image src={card.imageUrl} alt={card.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
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
                <Button variant="secondary" size="lg" disabled>Video Not Available</Button>
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
                <Button variant="secondary" size="lg" disabled>Audio Not Available</Button>
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
                  <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{card.quiz.explanation}</p>
              </div>
              <Button onClick={() => { setShowQuiz(false); setSelectedAnswer(null); setShowResult(false) }} variant="outline">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full max-w-2xl mx-auto mb-6"
    >
      <Card className={`overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 border-2 hover:border-primary/30 group ${isCardCompleted ? 'border-emerald-500 bg-emerald-50/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.h2 className="text-xl font-bold mb-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                {card.title}
              </motion.h2>
              <motion.div className="flex items-center gap-2 text-sm text-muted-foreground" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Badge variant="secondary">{card.category}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {card.readTime} min read
                </div>
                {isCardCompleted && <Badge className="bg-emerald-600">✅ Completed</Badge>}
              </motion.div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {renderCardContent()}
          </motion.div>

          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
            <Button onClick={handleMarkAsComplete} className="flex-1" variant="default">
              <Trophy className="mr-2 h-4 w-4" /> Mark as Complete
            </Button>
            <Button onClick={() => setShowQuiz(true)} variant="outline">Take Quiz</Button>
            <Button onClick={handleBookmark} disabled={bookmarkLoading}>
              {isBookmarked ? "✅ Saved" : "Bookmark"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLike}>❤️ {likeCount}</Button>
            <Button variant="ghost" size="sm" onClick={handleCommentToggle}>💬 {commentCount}</Button>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div className="mt-4 pt-4 border-t space-y-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                {user && (
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>{user.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()} disabled={commentLoading} />
                      <Button onClick={handleAddComment} disabled={commentLoading || !newComment.trim()} size="sm">
                        {commentLoading ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <motion.div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback>U</AvatarFallback></Avatar>
                      <div className="flex-1 bg-muted rounded-lg p-3">
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}