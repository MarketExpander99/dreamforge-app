'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, Clock, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/user-context'
import { getPersonalizedRecommendations, ContentItem } from '@/lib/data'
import { FeedCard } from '@/components/feed/feed-card'
import Image from 'next/image'

interface RecommendationsProps {
  title?: string
  subtitle?: string
  limit?: number
  showScrollButtons?: boolean
  highlightCurriculum?: boolean
}

export function Recommendations({
  title = "Recommended for You",
  subtitle = "Personalized content based on your learning journey",
  limit = 6,
  showScrollButtons = true
}: RecommendationsProps) {
  const { user, profile } = useAuth()
  const [recommendations, setRecommendations] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)

  const hasGradeLevel = profile?.grade_level !== null

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1)
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2)
      } else {
        setItemsPerView(3)
      }
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || !hasGradeLevel) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await getPersonalizedRecommendations(user.id, limit)
        setRecommendations(data)
      } catch (error) {
        console.error('Error fetching recommendations:', error)
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [user, limit, hasGradeLevel])

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev + itemsPerView >= recommendations.length ? 0 : prev + itemsPerView
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev - itemsPerView < 0 ? Math.max(0, recommendations.length - itemsPerView) : prev - itemsPerView
    )
  }

  const visibleItems = recommendations.slice(currentIndex, currentIndex + itemsPerView)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: itemsPerView }).map((_, i) => (
            <Card key={i} className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Getting to know you...</h3>
            <p className="text-muted-foreground text-sm">
              {subtitle}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Complete some lessons to get personalized recommendations!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {showScrollButtons && recommendations.length > itemsPerView && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              disabled={currentIndex + itemsPerView >= recommendations.length}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <motion.div
          className="flex gap-4"
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {visibleItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/3"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Image */}
                    {item.image_url && (
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                          {item.title}
                          {item.tags?.includes('curriculum-next') && (
                            <span className="ml-1 text-xs text-blue-600 font-bold">★</span>
                          )}
                        </h3>
                        <div className="flex gap-1">
                          {item.tags?.includes('curriculum-next') && (
                            <Badge className="text-xs shrink-0 bg-blue-100 text-blue-800">
                              Next in Path
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {item.category?.name || 'General'}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.content}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.read_time} min
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {item.difficulty}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dots indicator */}
      {recommendations.length > itemsPerView && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.ceil(recommendations.length / itemsPerView) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i * itemsPerView)}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / itemsPerView) === i
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}