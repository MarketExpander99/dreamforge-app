'use client'

import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { BookOpen, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/lib/user-context'
import { useEffect, useState } from 'react'

interface ContentItem {
  id: string
  title: string
  content: string
  type: 'text' | 'text-image' | 'video' | 'quiz' | 'audio'
  category_id: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[] | null
  image_url: string | null
  video_url: string | null
  audio_url: string | null
  quiz: {
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  } | null
  read_time: number
  likes: number
  views: number
  is_featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string | null
    created_at: string
  }
}

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth()
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        setError(null)

        let url = '/api/content?limit=10'

        if (user && profile) {
          // Get user profile to determine grade level
          const gradeLevel = profile.grade_level || 'grade-3'
          url += `&gradeLevel=${encodeURIComponent(gradeLevel)}`
        }

        const response = await fetch(url)
        if (response.ok) {
          const items = await response.json()
          setContentItems(items)
        } else {
          console.error('Failed to fetch content')
          setContentItems([])
        }
      } catch (error) {
        console.error('Database connection error:', error)
        setError('Failed to load content')
        setContentItems([])
      } finally {
        setLoading(false)
      }
    }

    // Only fetch content after auth is initialized
    if (!authLoading) {
      fetchContent()
    }
  }, [user, profile, authLoading])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
              Your Learning Feed
            </h1>

            {contentItems.length > 0 ? (
              <div className="space-y-6">
                {contentItems.map((item) => {
                  // Convert database item to FeedCard format
                  const feedCardItem = {
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    content: item.content,
                    imageUrl: item.image_url || undefined,
                    videoUrl: item.video_url || undefined,
                    audioUrl: item.audio_url || undefined,
                    quiz: item.quiz || undefined,
                    category: item.category?.name || 'General',
                    readTime: item.read_time,
                    likes: item.likes,
                    comments: 0 // Not implemented yet
                  }
                  return <FeedCard key={item.id} card={feedCardItem} />
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Welcome to Skill Gain!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your personalized learning journey starts here. Content will appear in your feed once it's added to the platform.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Explore different subjects and start building your knowledge base.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
