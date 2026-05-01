import { Navigation } from '@/components/navigation'
import { FeedCard } from '@/components/feed/feed-card'
import { sampleFeedContent } from '@/lib/sample-content'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-6 px-4 md:px-8 pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
              Your Learning Feed
            </h1>

            <div className="space-y-6">
              {sampleFeedContent.map((card) => (
                <FeedCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
