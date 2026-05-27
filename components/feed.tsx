'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, TestTube, MessageSquare, Lock, Sparkles } from 'lucide-react';

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
  learningPathTitle: string;
  completed: boolean;
}

export default function Feed() {
  const supabase = createBrowserSupabaseClient();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePaths, setActivePaths] = useState<any[]>([]);

  // Fetch active learning paths (using existing user_explorations as source of active paths)
  const fetchActivePaths = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
      .from('user_explorations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Failed to fetch active paths:', error);
      return [];
    }
    return data || [];
  };

  // AI-generated feed using real Grok call based on active paths
  const generateAIFeed = async (paths: any[]) => {
    if (paths.length === 0) return [];

    const pathSummaries = paths.map(p => p.label || p.title).join(', ');
    const prompt = `You are an expert educator for Skill Gain. Based ONLY on these active learning paths: ${pathSummaries}.
Generate exactly 4 personalized feed cards (2 info cards and 2 test cards) to help the user become an expert.
Return ONLY valid JSON array of objects with this structure:
[
  {
    "type": "info" or "test",
    "title": "short engaging title",
    "description": "clear helpful description",
    "mediaType": "text",
    "testQuestion": "optional question for test cards",
    "testOptions": ["option1", "option2", "option3", "option4"] for tests only
  }
]`;

    try {
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const raw = await response.json();
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('AI feed generation failed:', err);
      return []; // fallback handled below
    }
  };

  useEffect(() => {
    const initializeFeed = async () => {
      setIsLoading(true);
      const paths = await fetchActivePaths();
      setActivePaths(paths);

      let aiItems: any[] = await generateAIFeed(paths);

      // Fallback mock if AI call fails (still tied to paths)
      if (aiItems.length === 0 && paths.length > 0) {
        aiItems = [
          {
            type: 'info',
            title: `Deep Dive: ${paths[0].label || 'Core Concept'}`,
            description: 'Building expertise in your chosen path with key insights and real-world application.',
            mediaType: 'text',
          },
          {
            type: 'test',
            title: 'Knowledge Check',
            description: 'Quick test to solidify your learning',
            testQuestion: `How would you apply concepts from ${paths[0].label || 'this path'}?`,
            testOptions: ['Option A', 'Option B', 'Option C', 'Option D'],
          },
        ];
      }

      const mappedItems: FeedItem[] = aiItems.map((item: any, index: number) => ({
        id: `feed-${Date.now()}-${index}`,
        type: item.type || 'info',
        title: item.title || 'Personalized Card',
        description: item.description || 'AI-generated content to advance your expertise',
        mediaType: item.mediaType || 'text',
        testQuestion: item.testQuestion,
        testOptions: item.testOptions,
        learningPathId: paths[0]?.id || 'path-default',
        learningPathTitle: paths[0]?.label || 'Your Active Path',
        completed: false,
      }));

      setFeedItems(mappedItems);
      setIsLoading(false);
    };

    initializeFeed();
  }, []);

  const recordInteraction = async (item: FeedItem, interactionType: 'ask_ai' | 'test_complete', result?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Record to existing user_progress table (no schema change)
      await supabase.from('user_progress').insert({
        user_id: session.user.id,
        learning_path_id: item.learningPathId, // or related field if exact column differs
        item_type: item.type,
        interaction_type: interactionType,
        result: result || null,
        xp_earned: interactionType === 'test_complete' ? 25 : 10,
        completed_at: new Date().toISOString(),
      });

      // If test completed → create achievement
      if (interactionType === 'test_complete') {
        await supabase.from('user_achievements').insert({
          user_id: session.user.id,
          achievement_type: 'feed_mastery',
          title: `Mastered ${item.title}`,
          description: `Completed feed item in ${item.learningPathTitle}`,
        });
      }
    } catch (err) {
      console.error('Interaction recording failed (non-blocking):', err);
    }
  };

  const handleAskAI = async (item: FeedItem) => {
    const question = prompt('Ask AI anything about this card:') || 'General question';
    console.log(`[FEED] Ask AI for item ${item.id} on path ${item.learningPathTitle}: ${question}`);
    await recordInteraction(item, 'ask_ai');
    alert(`✅ AI interaction recorded (+10 XP to ${item.learningPathTitle}). In future iterations this will show a rich response.`);
  };

  const handleTestSubmit = async (item: FeedItem, answer: string) => {
    console.log(`[FEED] Test submitted for ${item.id} with answer: ${answer}`);
    await recordInteraction(item, 'test_complete', answer);

    // Lock the item
    setFeedItems(prev =>
      prev.map(i => (i.id === item.id ? { ...i, completed: true } : i))
    );

    alert(`🎉 Test completed! +25 XP awarded to ${item.learningPathTitle}. Item locked. Achievement added to your profile!`);
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
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-amber-500" />
          My Feed
        </h2>
        <Badge variant="secondary" className="gap-2">
          <BookOpen className="h-4 w-4" />
          AI-powered • {activePaths.length} active path{activePaths.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      <p className="text-muted-foreground mb-8">Personalized info &amp; test cards generated from your active learning paths. Complete them to earn XP and unlock achievements.</p>

      <div className="space-y-8">
        {feedItems.map((item) => (
          <Card key={item.id} className={item.completed ? 'opacity-75 pointer-events-none' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {item.type === 'info' ? <BookOpen className="h-5 w-5" /> : <TestTube className="h-5 w-5" />}
                {item.title}
                {item.completed && <Lock className="h-4 w-4 text-emerald-600 ml-auto" />}
                <span className="text-xs text-muted-foreground ml-auto">for {item.learningPathTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed">{item.description}</p>

              {/* Media placeholder */}
              {item.mediaType && (
                <div className="bg-muted rounded-2xl h-48 flex items-center justify-center text-muted-foreground text-sm">
                  [{item.mediaType.toUpperCase()} — AI media embed coming soon]
                </div>
              )}

              {item.type === 'info' && !item.completed && (
                <Button
                  variant="outline"
                  className="gap-2 w-full"
                  onClick={() => handleAskAI(item)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Ask AI about this
                </Button>
              )}

              {item.type === 'test' && !item.completed && (
                <div className="space-y-4">
                  <p className="font-medium">{item.testQuestion}</p>
                  <div className="space-y-2">
                    {item.testOptions?.map((option, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-start text-left"
                        onClick={() => handleTestSubmit(item, option)}
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
                  Completed — XP awarded • Achievement unlocked on profile
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}