'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, TestTube, MessageSquare, RefreshCw, CheckCircle, Sparkles, Trophy, ArrowRight, Volume2 } from 'lucide-react';
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
  topic: string;
  topicId: string;
  round: number;
  difficulty: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface TopicState {
  [topicId: string]: { currentRound: number };
}

const COMPLETED_STORAGE_KEY = 'skillgain_feed_completed_ids';

export default function Feed() {
  const supabase = createBrowserSupabaseClient();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [topicState, setTopicState] = useState<TopicState>({});
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [chatMessagesMap, setChatMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const [thinkingCardId, setThinkingCardId] = useState<string | null>(null);

  const loadCompletedIds = () => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const stored = localStorage.getItem(COMPLETED_STORAGE_KEY);
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const persistCompletedIds = (ids: Set<string>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  };

  const loadFeedFromDB = async () => {
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    const { data: explorations } = await supabase
      .from('user_explorations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    const paths = explorations || [];
    const loadedCompleted = loadCompletedIds();
    setCompletedIds(loadedCompleted);

    const mapped: FeedItem[] = [];

    paths.forEach((exp: any, topicIndex: number) => {
      const topicId = exp.id || `topic-${topicIndex}`;
      const topicTitle = exp.label || 'Learning Topic';
      const baseDesc = exp.short_description || exp.deep_details || `Core ideas around ${topicTitle}.`;

      const numCards = 3 + (topicIndex % 3);

      for (let i = 0; i < numCards; i++) {
        const id = `card-${topicId}-${i}`;
        const roundNum = Math.floor(i / 2) + 1;

        let description = baseDesc;
        if (i === 1) description = `Practical angle: ${baseDesc}`;
        if (i === 2) description = `Deeper look: How ${baseDesc.toLowerCase().replace(/\.$/, '')} connects to other ideas.`;
        if (i === 3) description = `Real-world example of ${baseDesc.toLowerCase().replace(/\.$/, '')}.`;
        if (i >= 4) description = `Advanced insight: ${baseDesc}`;

        mapped.push({
          id,
          type: 'info',
          title: `${topicTitle} - Insight ${i + 1}`,
          description,
          mediaUrl: `https://picsum.photos/id/${300 + topicIndex + i}/800/400`,
          mediaType: 'image',
          learningPathId: 'path-default',
          learningPathTitle: 'Your Path',
          completed: loadedCompleted.has(id),
          topic: topicTitle,
          topicId,
          round: roundNum,
          difficulty: roundNum,
        });
      }

      const testId = `test-${topicId}`;
      mapped.push({
        id: testId,
        type: 'test',
        title: `${topicTitle} - Quick Check`,
        description: 'Test your understanding.',
        mediaUrl: `https://picsum.photos/id/${320 + topicIndex}/800/400`,
        mediaType: 'image',
        testQuestion: `What is a key idea behind ${topicTitle}?`,
        testOptions: [
          `It is the core purpose of ${topicTitle}`,
          `It has nothing to do with ${topicTitle}`,
          `It only works in specific conditions`,
          `It was invented recently`
        ],
        learningPathId: 'path-default',
        learningPathTitle: 'Your Path',
        completed: loadedCompleted.has(testId),
        topic: topicTitle,
        topicId,
        round: 1,
        difficulty: 1,
      });
    });

    if (mapped.length === 0) {
      mapped.push({
        id: 'empty',
        type: 'info',
        title: 'Start Exploring',
        description: 'Add topics from the Discover page to begin structured rounds.',
        mediaUrl: 'https://picsum.photos/id/1015/800/400',
        mediaType: 'image',
        learningPathId: 'path-default',
        learningPathTitle: 'Your Path',
        completed: false,
        topic: 'Getting Started',
        topicId: 'start',
        round: 1,
        difficulty: 1,
      });
    }

    const seen = new Set<string>();
    const uniqueMapped = mapped.filter(item => {
      const key = `${item.topicId}-${item.title.substring(0, 60)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setFeedItems(uniqueMapped);

    const initialState: TopicState = {};
    uniqueMapped.forEach(item => {
      if (!initialState[item.topicId]) {
        initialState[item.topicId] = { currentRound: 1 };
      }
    });
    setTopicState(initialState);

    setIsLoading(false);
  };

  useEffect(() => {
    loadFeedFromDB();
  }, []);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadFeedFromDB();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  const getCurrentRound = (topicId: string) => topicState[topicId]?.currentRound || 1;

  const advanceToNextRound = (topicId: string) => {
    setTopicState(prev => ({
      ...prev,
      [topicId]: { currentRound: Math.min((prev[topicId]?.currentRound || 1) + 1, 3) }
    }));
  };

  const isRoundComplete = (topicId: string, round: number) => {
    const roundCards = feedItems.filter(i => i.topicId === topicId && i.round === round);
    return roundCards.length > 0 && roundCards.every(card => card.completed);
  };

  const updateCompleted = (newIds: Set<string>) => {
    setCompletedIds(newIds);
    persistCompletedIds(newIds);
  };

  const markAsComplete = (item: FeedItem) => {
    const newIds = new Set(completedIds);
    newIds.add(item.id);
    updateCompleted(newIds);
    setFeedItems(prev => prev.map(i => (i.id === item.id ? { ...i, completed: true } : i)));
  };

  const handleTestSubmit = (item: FeedItem, answer: string) => {
    markAsComplete(item);
  };

  const markTopicComplete = (topicId: string, topicTitle: string) => {
    if (!confirm(`Mark entire topic "${topicTitle}" as complete?`)) return;

    const newIds = new Set(completedIds);
    feedItems.filter(item => item.topicId === topicId).forEach(item => newIds.add(item.id));
    updateCompleted(newIds);
    setFeedItems(prev => prev.filter(item => item.topicId !== topicId));
  };

  const handleRefreshFeed = () => loadFeedFromDB();

  const readAloud = async (item: FeedItem) => {
    setThinkingCardId(item.id);

    try {
      const scriptPrompt = `You are a warm, encouraging tutor on Skill Gain. Rewrite the following lesson into a natural, conversational spoken script optimized for reading aloud. Use short clear sentences, friendly tone, and natural flow as if speaking directly to a curious student. Avoid markdown, lists, or extra commentary. Just output the clean narration text.

Lesson title: ${item.title}
Content: ${item.description}`;

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: scriptPrompt })
      });

      const raw = await response.json();
      const spokenScript = typeof raw === 'string' ? raw : raw.response || raw.text || item.description;

      setOpenChatId(item.id);
      const narrationMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `🎙️ **Narration:** ${spokenScript}`,
        created_at: new Date().toISOString()
      };
      setChatMessagesMap(prev => ({
        ...prev,
        [item.id]: [...(prev[item.id] || []), narrationMsg]
      }));

      // Pure xAI TTS via proxy
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenScript, voice: 'rex' }) // change to 'ava' if you prefer
      });

      if (ttsResponse.ok) {
        const audioBlob = await ttsResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        throw new Error('TTS failed');
      }
    } catch (err) {
      console.error('TTS error:', err);
      alert("Voice playback issue. Make sure /api/tts/route.ts exists and restart server.");
    } finally {
      setThinkingCardId(null);
    }
  };

  const handleSendMessage = async (item: FeedItem, customMessage?: string) => {
    const input = document.getElementById(`chat-input-${item.id}`) as HTMLInputElement;
    const messageText = customMessage || (input?.value || '').trim();
    if (!messageText || sendingMessage) return;

    setSendingMessage(true);
    setThinkingCardId(item.id);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSendingMessage(false);
      setThinkingCardId(null);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };

    setChatMessagesMap(prev => ({
      ...prev,
      [item.id]: [...(prev[item.id] || []), userMsg]
    }));

    if (!customMessage && input) input.value = '';

    try {
      await supabase.from('chat_messages').insert({
        user_id: session.user.id,
        card_id: item.id,
        learning_path_id: item.learningPathId,
        topic: item.topic,
        message_role: 'user',
        content: messageText
      });
    } catch (e) {
      console.warn('chat_messages insert skipped');
    }

    try {
      const chatPrompt = `You are an expert tutor on Skill Gain. The user is studying "${item.title}". Answer helpfully and concisely: ${messageText}`;
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatPrompt })
      });
      const raw = await response.json();
      const assistantResponse = typeof raw === 'string' ? raw : raw.response || raw.text || 'Great question!';

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantResponse,
        created_at: new Date().toISOString()
      };

      setChatMessagesMap(prev => ({
        ...prev,
        [item.id]: [...(prev[item.id] || []), assistantMsg]
      }));

      await supabase.from('chat_messages').insert({
        user_id: session.user.id,
        card_id: item.id,
        learning_path_id: item.learningPathId,
        topic: item.topic,
        message_role: 'assistant',
        content: assistantResponse
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
      setThinkingCardId(null);
    }
  };

  const quickAsk = (item: FeedItem, prompt: string) => {
    setOpenChatId(item.id);
    setTimeout(() => {
      const input = document.getElementById(`chat-input-${item.id}`) as HTMLInputElement;
      if (input) input.value = prompt;
      handleSendMessage(item, prompt);
    }, 80);
  };

  const toggleChat = (itemId: string) => {
    setOpenChatId(openChatId === itemId ? null : itemId);
  };

  const topics = [...new Set(feedItems.map(i => i.topicId))];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Sparkles className="h-10 w-10 text-amber-500 animate-pulse mb-4" />
        <p className="text-lg text-muted-foreground">Loading your feed...</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-amber-500" /> My Feed
        </h2>
        <Button variant="outline" size="sm" onClick={handleRefreshFeed} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <p className="text-muted-foreground mb-8">
        Dynamic cards generated from your explorations. Speaker uses real Grok voice (Rex/Ava).
      </p>

      <div className="space-y-12">
        {topics.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">No active topics. Add more from Discover!</p>
          </Card>
        )}

        {topics.map(topicId => {
          const topicItems = feedItems.filter(i => i.topicId === topicId);
          if (topicItems.length === 0) return null;

          const topicTitle = topicItems[0].topic;
          const currentRound = getCurrentRound(topicId);
          const currentRoundItems = topicItems.filter(i => i.round === currentRound && !i.completed);
          const roundComplete = isRoundComplete(topicId, currentRound);
          const allRoundsDone = currentRound === 3 && roundComplete;

          if (allRoundsDone) return null;

          return (
            <div key={topicId} className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-2xl font-semibold">{topicTitle}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge>Round {currentRound}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {currentRoundItems.length} cards remaining
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {roundComplete && currentRound < 3 && (
                    <Button onClick={() => advanceToNextRound(topicId)} className="gap-2">
                      Next Round <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => markTopicComplete(topicId, topicTitle)}
                    className="gap-2"
                  >
                    <Trophy className="h-4 w-4" /> Complete Topic
                  </Button>
                </div>
              </div>

              <div className="grid gap-6">
                {currentRoundItems.length === 0 && !roundComplete && (
                  <p className="text-muted-foreground">No active cards in this round.</p>
                )}

                {currentRoundItems.map(item => (
                  <motion.div key={item.id} layout>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          {item.type === 'info' ? <BookOpen className="h-5 w-5" /> : <TestTube className="h-5 w-5" />}
                          {item.title}

                          <div className="ml-auto flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-60"
                              onClick={() => readAloud(item)}
                              disabled={thinkingCardId === item.id}
                            >
                              <Volume2 className={`h-4 w-4 ${thinkingCardId === item.id ? 'animate-pulse' : ''}`} />
                            </Button>

                            {thinkingCardId === item.id && (
                              <span className="text-xs text-amber-600 font-medium animate-pulse whitespace-nowrap">
                                Grok is rehearsing the perfect voice...
                              </span>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <p className="text-lg leading-relaxed">{item.description}</p>

                        {item.type === 'info' && !item.completed && (
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" className="gap-2" onClick={() => toggleChat(item.id)}>
                              <MessageSquare className="h-4 w-4" /> Ask AI
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => quickAsk(item, `Extract the key concepts from "${item.title}" and explain them simply and memorably for a student.`)}
                            >
                              Key Concepts
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => quickAsk(item, `Break down "${item.title}" into clear, actionable steps or a practical process.`)}
                            >
                              Steps
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => quickAsk(item, `Suggest 3 relevant related lessons or topics on Skill Gain that connect to "${item.title}" or the topic "${item.topic}".`)}
                            >
                              Related Lessons
                            </Button>
                          </div>
                        )}

                        {item.type === 'test' && !item.completed && (
                          <div className="space-y-3">
                            <p className="font-medium">{item.testQuestion}</p>
                            {item.testOptions?.map((option, idx) => (
                              <Button key={idx} variant="outline" className="w-full justify-start" onClick={() => handleTestSubmit(item, option)}>
                                {option}
                              </Button>
                            ))}
                          </div>
                        )}

                        {!item.completed && item.type === 'info' && (
                          <Button variant="default" className="w-full gap-2" onClick={() => markAsComplete(item)}>
                            <CheckCircle className="h-4 w-4" /> Mark as Complete
                          </Button>
                        )}

                        <AnimatePresence>
                          {openChatId === item.id && (
                            <div className="mt-4 border rounded-2xl p-4 bg-muted/50">
                              <div className="h-64 overflow-y-auto space-y-3 mb-4 pr-2">
                                {chatMessagesMap[item.id]?.map(msg => (
                                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-background border'}`}>
                                      {msg.content}
                                    </div>
                                  </div>
                                ))}

                                {sendingMessage && thinkingCardId === item.id && (
                                  <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                                    <div className="flex gap-1">
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                                    </div>
                                    <span>Grok is thinking...</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Input 
                                  id={`chat-input-${item.id}`} 
                                  placeholder="Ask Grok anything about this lesson..." 
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(item)} 
                                />
                                <Button onClick={() => handleSendMessage(item)} disabled={sendingMessage}>
                                  Send
                                </Button>
                              </div>
                            </div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {roundComplete && currentRound < 3 && (
                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center">
                  <Trophy className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                  <h4 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Round {currentRound} Complete!</h4>
                  <p className="text-emerald-600 dark:text-emerald-400 mt-1">Great work. Ready to level up?</p>
                  <Button onClick={() => advanceToNextRound(topicId)} className="mt-4 gap-2">
                    Start Round {currentRound + 1} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}