'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, TestTube, MessageSquare, RefreshCw, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedItem {
  id: string;
  type: 'info' | 'test';
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image';
  testQuestion?: string;
  testOptions?: string[];
  learningPathId: string;
  learningPathTitle: string;
  completed: boolean;
  topic?: string;
  difficulty: number;
}

export default function Feed() {
  const supabase = createBrowserSupabaseClient();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePaths, setActivePaths] = useState<any[]>([]);
  const [userCredits, setUserCredits] = useState(12);

  const fetchActivePaths = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data } = await supabase
      .from('user_explorations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    return data || [];
  };

  const generateAIFeed = async (paths: any[]) => {
    if (paths.length === 0) return [];
    if (userCredits < 2) {
      alert("Not enough credits to refresh AI Feed.");
      return [];
    }
    setUserCredits(prev => prev - 2);

    const pathSummaries = paths.map(p => p.label || p.title || 'learning topic').join(', ');

    const prompt = `You are an expert educator and master lesson architect for Skill Gain.
Based ONLY on these active learning paths: ${pathSummaries}.

Generate exactly 4 personalized feed cards (2 info + 2 test) with increasing difficulty.
Return ONLY valid JSON array.`;

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
      return [];
    }
  };

  const getTopicImage = (title: string) => {
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 900;
    return `https://picsum.photos/id/${300 + hash}/800/400`;
  };

  const initializeFeed = async () => {
    setIsLoading(true);
    const paths = await fetchActivePaths();
    setActivePaths(paths);

    let aiItems: any[] = await generateAIFeed(paths);

    if (aiItems.length === 0 && paths.length > 0) {
      aiItems = [
        { type: 'info', title: `Deep Dive: ${paths[0].label || 'Core Concept'}`, description: 'Building expertise with key insights.', difficulty: 1 },
        { type: 'test', title: 'Knowledge Check', description: 'Quick test', testQuestion: `Apply concepts from ${paths[0].label}?`, testOptions: ['A', 'B', 'C', 'D'], difficulty: 2 },
      ];
    }

    const mappedItems: FeedItem[] = aiItems.map((item: any, index: number) => ({
      id: `feed-${Date.now()}-${index}`,
      type: item.type || 'info',
      title: item.title || 'Personalized Lesson',
      description: item.description || 'AI-generated educational content',
      mediaUrl: getTopicImage(item.title || 'education'),
      mediaType: 'image',
      testQuestion: item.testQuestion,
      testOptions: item.testOptions,
      learningPathId: paths[0]?.id || 'path-default',
      learningPathTitle: paths[0]?.label || 'Your Active Path',
      completed: false,
      topic: paths[0]?.label || 'general',
      difficulty: item.difficulty || 3,
    }));

    setFeedItems(mappedItems);
    setIsLoading(false);
  };

  useEffect(() => {
    initializeFeed();
  }, []);

  const markAsComplete = async (item: FeedItem) => {
    setFeedItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, completed: true } : i
    ));

    setTimeout(async () => {
      setFeedItems(prev => prev.filter(i => i.id !== item.id));

      const nextPrompt = `You are an expert educator for Skill Gain.
The student just completed: "${item.title}" (difficulty ${item.difficulty}).

Create ONE more advanced follow-up card on "${item.topic || 'this subject'}".
Make it clearly harder and deeper (increase difficulty by 1-2 levels).
Return ONLY valid JSON object with the structure:
{
  "type": "${item.type === 'info' ? 'info' : 'test'}",
  "title": "short engaging title",
  "description": "rich detailed content",
  "testQuestion": "... (if test)",
  "testOptions": ["opt1", "opt2", "opt3", "opt4"]
}`;

      try {
        const res = await fetch('/api/grok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: nextPrompt }),
        });

        const raw = await res.json();
        const nextData = typeof raw === 'string' ? JSON.parse(raw) : raw;

        const newItem: FeedItem = {
          id: `feed-next-${Date.now()}`,
          type: nextData.type || (item.type === 'info' ? 'info' : 'test'),
          title: nextData.title || `Advanced: ${item.title}`,
          description: nextData.description || 'Deeper exploration with more advanced concepts.',
          mediaUrl: getTopicImage(nextData.title || item.topic || 'education'),
          mediaType: 'image',
          testQuestion: nextData.testQuestion,
          testOptions: nextData.testOptions,
          learningPathId: item.learningPathId,
          learningPathTitle: item.learningPathTitle,
          completed: false,
          topic: item.topic,
          difficulty: (item.difficulty || 3) + 2,
        };

        setFeedItems(prev => [...prev, newItem]);
      } catch (e) {
        console.error('Failed to generate advanced follow-up:', e);
      }
    }, 500);
  };

  const handleRefreshFeed = () => initializeFeed();

  const recordInteraction = async (item: FeedItem, interactionType: 'ask_ai' | 'test_complete', result?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      await supabase.from('user_progress').insert({
        user_id: session.user.id,
        learning_path_id: item.learningPathId,
        item_type: item.type,
        interaction_type: interactionType,
        result: result || null,
        xp_earned: interactionType === 'test_complete' ? 25 : 10,
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Interaction recording failed:', err);
    }
  };

  const handleAskAI = async (item: FeedItem) => {
    const question = prompt('Ask AI anything about this card:') || 'General question';
    await recordInteraction(item, 'ask_ai');
    alert(`✅ Ask AI interaction recorded (+10 XP)`);
  };

  const handleTestSubmit = async (item: FeedItem, answer: string) => {
    await recordInteraction(item, 'test_complete', answer);
    markAsComplete(item);
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
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-2">
            <BookOpen className="h-4 w-4" />
            AI-powered • {activePaths.length} path{activePaths.length !== 1 ? 's' : ''}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefreshFeed} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground mb-8">Personalized info &amp; test cards. Complete them to earn XP and unlock the next challenge.</p>

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {feedItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30, transition: { duration: 0.4 } }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {item.type === 'info' ? <BookOpen className="h-5 w-5" /> : <TestTube className="h-5 w-5" />}
                    {item.title}
                    {item.completed && <CheckCircle className="h-4 w-4 text-emerald-600 ml-auto" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg leading-relaxed">{item.description}</p>

                  {item.type === 'info' && !item.completed && (
                    <>
                      <Button variant="outline" className="gap-2 w-full" onClick={() => handleAskAI(item)}>
                        <MessageSquare className="h-4 w-4" />
                        Ask AI about this
                      </Button>
                      <Button variant="default" className="gap-2 w-full" onClick={() => markAsComplete(item)}>
                        <CheckCircle className="h-4 w-4" />
                        Mark as Complete
                      </Button>
                    </>
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
                      <CheckCircle className="h-5 w-5" />
                      Completed — XP awarded • Next advanced challenge unlocked
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}