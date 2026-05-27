'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, TestTube, MessageSquare, Lock } from 'lucide-react';

interface FeedItem {
  id: string;
  type: 'info' | 'test';
  title: string;
  description: string;
  mediaType?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  testQuestion?: string;
  testOptions?: string[];
  learningPathId: string;
  completed: boolean;
}

export default function Feed() {
  const supabase = createBrowserSupabaseClient();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePath, setActivePath] = useState<string>('Sample Path to Expertise'); // Will connect to real active paths next

  // Mock AI-generated feed based on active learning paths (placeholder for real Grok call)
  useEffect(() => {
    const generateMockFeed = () => {
      const mockFeed: FeedItem[] = [
        {
          id: '1',
          type: 'info',
          title: 'Core Concept: Variables in Programming',
          description: 'Understanding variables is the foundation of any coding journey. They store data that your programs can manipulate.',
          mediaType: 'text',
          learningPathId: 'path-123',
          completed: false,
        },
        {
          id: '2',
          type: 'test',
          title: 'Quick Knowledge Check',
          description: 'Test your understanding of variables',
          testQuestion: 'What is the correct way to declare a variable in TypeScript?',
          testOptions: ['let x = 5;', 'var x = 5;', 'const x := 5;', 'All are correct'],
          learningPathId: 'path-123',
          completed: false,
        },
      ];
      setFeedItems(mockFeed);
      setIsLoading(false);
    };

    generateMockFeed();
  }, []);

  const handleAskAI = async (itemId: string) => {
    console.log(`[FEED] Ask AI triggered for item ${itemId} - will record interaction for XP`);
    // Future: Open inline chat + Supabase insert to user_progress + award XP
    alert('✅ Ask AI opened! (Interaction logged for progress/XP in next step)');
  };

  const handleTestSubmit = async (itemId: string, answer: string) => {
    console.log(`[FEED] Test submitted for item ${itemId} with answer: ${answer}`);
    // Simulate result + lock item
    setFeedItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, completed: true }
          : item
      )
    );
    alert('🎉 Test completed! +25 XP awarded to your learning path. Item locked and will appear as achievement on profile.');
    // Future: Record in user_progress + user_achievements
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">My Feed</h2>
        <Badge variant="secondary" className="gap-2">
          <BookOpen className="h-4 w-4" />
          AI-powered • Based on {activePath}
        </Badge>
      </div>
      <p className="text-muted-foreground mb-8">Personalized cards to build expertise in your active learning paths. Complete info + tests to earn XP and unlock achievements.</p>

      <div className="space-y-8">
        {feedItems.map((item) => (
          <Card key={item.id} className={item.completed ? 'opacity-75' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {item.type === 'info' ? <BookOpen className="h-5 w-5" /> : <TestTube className="h-5 w-5" />}
                {item.title}
                {item.completed && <Lock className="h-4 w-4 text-emerald-600 ml-auto" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed">{item.description}</p>

              {/* Media placeholder */}
              {item.mediaType && (
                <div className="bg-muted rounded-2xl h-48 flex items-center justify-center text-muted-foreground">
                  [{item.mediaType.toUpperCase()} PLACEHOLDER - AI will embed image/video here]
                </div>
              )}

              {item.type === 'info' && (
                <div>
                  <Button
                    variant="outline"
                    className="gap-2 w-full"
                    onClick={() => handleAskAI(item.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Ask AI about this
                  </Button>
                </div>
              )}

              {item.type === 'test' && !item.completed && (
                <div className="space-y-4">
                  <p className="font-medium">{item.testQuestion}</p>
                  <div className="space-y-2">
                    {item.testOptions?.map((option, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleTestSubmit(item.id, option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {item.completed && (
                <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-3">
                  <Lock className="h-5 w-5" />
                  Completed — +XP added to your learning path. Achievement unlocked on profile!
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}