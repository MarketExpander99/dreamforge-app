import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { getContentItems, getContentByGradeLevel, getUserProfile, ContentItem } from '@/lib/data'
import { createClient } from '@/lib/supabase-server'
import { BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function Home() {
  // Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let contentItems: ContentItem[] = []

  if (user) {
    // Get user profile to determine grade level
    const userProfile = await getUserProfile(user.id)
    const gradeLevel = userProfile?.grade_level || 'grade-3'

    // Fetch content filtered by grade level
    contentItems = await getContentByGradeLevel(gradeLevel, { limit: 10 })
  } else {
    // Fallback for non-authenticated users
    contentItems = await getContentItems({ limit: 10 })
  }

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
                  <h3 className="font-semibold mb-2">Welcome to KnowFeed!</h3>
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
