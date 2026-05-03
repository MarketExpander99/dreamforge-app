import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { getContentItem } from '@/lib/data'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ContentDetailPageProps {
  params: { id: string }
}

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const contentItem = await getContentItem(params.id)

  if (!contentItem) {
    notFound()
  }

  // Convert database item to FeedCard format
  const feedCardItem = {
    id: contentItem.id,
    type: contentItem.type,
    title: contentItem.title,
    content: contentItem.content,
    imageUrl: contentItem.image_url || undefined,
    videoUrl: contentItem.video_url || undefined,
    audioUrl: contentItem.audio_url || undefined,
    quiz: contentItem.quiz || undefined,
    category: contentItem.category?.name || 'General',
    readTime: contentItem.read_time,
    likes: contentItem.likes,
    comments: 0 // Not implemented yet
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <Link href="/explore">
                <Button variant="ghost" className="pl-0">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Explore
                </Button>
              </Link>
            </div>

            {/* Content Detail */}
            <FeedCard card={feedCardItem} />
          </div>
        </main>
      </div>
    </div>
  )
}