'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, BookOpen, TestTube, MessageSquare, RefreshCw, CheckCircle, Sparkles, Bot, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MASTER_LESSON_PROMPT, NEXT_CARD_PROMPT } from '@/lib/prompts/lesson-generator';

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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function Feed() {
  const supabase = createBrowserSupabaseClient();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activePaths, setActivePaths] = useState<any[]>([]);
  const [userCredits, setUserCredits] = useState(12);

  // Chat state
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [chatMessagesMap, setChatMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const [thinkingCardId, setThinkingCardId] = useState<string | null>(null);

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

  const fetchMasteryContext = async (userId: string) => {
    const { data: completed } = await supabase
      .from('user_progress')
      .select('item_type, learning_path_id, result, completed_at')
      .eq('user_id', userId)
      .eq('interaction_type', 'test_complete')
      .order('completed_at', { ascending: false })
      .limit(8);

    const { data: chats } = await supabase
      .from('chat_messages')
      .select('card_id, topic, content, message_role')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12);

    return {
      completedSummary: completed?.length 
        ? `User has successfully completed ${completed.length} recent items across paths: ${[...new Set(completed.map(c => c.learning_path_id))].join(', ')}.` 
        : 'User is relatively new and has few completions.',
      chatSummary: chats?.length 
        ? `User has engaged in deep AI chats on topics: ${[...new Set(chats.map(c => c.topic).filter(Boolean))].join(', ')}. Recent conversations show strong interest in mastery.` 
        : 'No prior chat history.'
    };
  };

  const generateAIFeed = async (paths: any[]) => {
    if (paths.length === 0) return [];
    if (userCredits < 2) {
      alert("Not enough credits to refresh AI Feed.");
      return [];
    }
    setUserCredits(prev => prev - 2);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const mastery = await fetchMasteryContext(session.user.id);
    const pathSummaries = paths.map(p => p.label || p.title || 'learning topic').join(', ');

    const prompt = `${MASTER_LESSON_PROMPT}\n\nBased ONLY on these active learning paths: ${pathSummaries}.\n${mastery.completedSummary}\n${mastery.chatSummary}\nGenerate exactly 4 personalized feed cards (2 info + 2 test) with increasing difficulty that perfectly match the user's current mastery level and chat depth.`;

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
    setLoadingProgress(10);

    const paths = await fetchActivePaths();
    setActivePaths(paths);
    setLoadingProgress(30);

    let aiItems: any[] = await generateAIFeed(paths);
    setLoadingProgress(70);

    if (aiItems.length === 0 && paths.length > 0) {
      aiItems = [
        { type: 'info', title: `Deep Dive: ${paths[0].label || 'Core Concept'}`, description: 'Building expertise with key insights.', difficulty: 1 },
        { type: 'test', title: 'Knowledge Check', description: 'Quick test', testQuestion: `Apply concepts from ${paths[0].label}?`, testOptions: ['A', 'B', 'C', 'D'], difficulty: 2 },
      ];
    }

    setLoadingProgress(90);

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
    setLoadingProgress(100);

    setTimeout(() => {
      setIsLoading(false);
      setLoadingProgress(0);
    }, 400);
  };

  useEffect(() => {
    initializeFeed();
  }, []);

  useEffect(() => {
    const loadChatMessages = async () => {
      if (!openChatId) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('card_id', openChatId)
        .order('created_at', { ascending: true });

      if (error) console.error('Chat load error:', error);
      else {
        setChatMessagesMap(prev => ({ ...prev, [openChatId]: data || [] }));
      }
    };

    loadChatMessages();
  }, [openChatId, supabase]);

  const markAsComplete = async (item: FeedItem) => {
    setFeedItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, completed: true } : i
    ));

    setTimeout(async () => {
      setFeedItems(prev => prev.filter(i => i.id !== item.id));

      const prompt = NEXT_CARD_PROMPT(item.title, item.topic || 'this subject', item.difficulty);

      try {
        const res = await fetch('/api/grok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
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

  const handleSendMessage = async (item: FeedItem) => {
    const input = document.getElementById(`chat-input-${item.id}`) as HTMLInputElement;
    const messageText = input?.value.trim();
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

    input.value = '';

    await supabase
      .from('chat_messages')
      .insert({
        user_id: session.user.id,
        card_id: item.id,
        learning_path_id: item.learningPathId,
        topic: item.topic,
        message_role: 'user',
        content: messageText
      });

    await recordInteraction(item, 'ask_ai');

    try {
      const chatPrompt = `You are an expert tutor on the Skill Gain platform. 
The user is studying: "${item.title}" 
Topic: "${item.topic || 'general'}"
Description: "${item.description}"
Help them master this concept with a clear, encouraging, and educational response. Keep it concise but insightful.

User question: ${messageText}`;

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: chatPrompt }),
      });

      const raw = await response.json();
      const assistantResponse = typeof raw === 'string' 
        ? raw 
        : raw.response || raw.text || raw.message || 'Great question! Let me explain this in more detail to help build your mastery.';

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

      await supabase
        .from('chat_messages')
        .insert({
          user_id: session.user.id,
          card_id: item.id,
          learning_path_id: item.learningPathId,
          topic: item.topic,
          message_role: 'assistant',
          content: assistantResponse
        });
    } catch (err) {
      console.error('AI chat response failed:', err);
    } finally {
      setSendingMessage(false);
      setThinkingCardId(null);
    }
  };

  const toggleChat = (itemId: string) => {
    setOpenChatId(openChatId === itemId ? null : itemId);
  };

  const handleTestSubmit = async (item: FeedItem, answer: string) => {
    await recordInteraction(item, 'test_complete', answer);
    markAsComplete(item);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6 w-full max-w-md"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 15, -10, 15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-14 w-14 text-amber-500" />
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-1 -right-1"
            >
              <Bot className="h-6 w-6 text-purple-500" />
            </motion.div>
          </div>

          <div className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground">
            Grok is building your feed
            <div className="flex space-x-1.5">
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>

          <p className="text-muted-foreground text-center max-w-xs">
            Personalized AI cards • Powered by your active paths
          </p>

          <div className="w-full max-w-xs mt-4">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Generating personalized cards...</span>
              <span>{loadingProgress}%</span>
            </div>
          </div>
        </motion.div>
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
                    <Button 
                      variant="outline" 
                      className="gap-2 w-full" 
                      onClick={() => toggleChat(item.id)}
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

                  <AnimatePresence>
                    {openChatId === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 border rounded-2xl p-4 bg-muted/50"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-9 w-9 text-amber-500 animate-pulse flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                          </svg>
                          <h3 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Ask Grok
                          </h3>
                        </div>

                        <div className="h-64 overflow-y-auto space-y-4 mb-4 pr-2 bg-background/80 rounded-xl p-3">
                          {chatMessagesMap[item.id]?.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Ask anything to deepen your mastery on this card!</p>
                          ) : (
                            chatMessagesMap[item.id]?.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </div>
                            ))
                          )}

                          {thinkingCardId === item.id && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted flex items-center gap-2">
                                <Bot className="h-4 w-4 text-purple-500" />
                                <div className="flex space-x-1">
                                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs text-muted-foreground">Grok is thinking...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            id={`chat-input-${item.id}`}
                            placeholder="Ask Grok anything..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendMessage(item);
                            }}
                            disabled={sendingMessage}
                          />
                          <Button 
                            onClick={() => handleSendMessage(item)} 
                            disabled={sendingMessage}
                            className="gap-2"
                          >
                            Send
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {item.type === 'info' && !item.completed && (
                    <Button variant="default" className="gap-2 w-full" onClick={() => markAsComplete(item)}>
                      <CheckCircle className="h-4 w-4" />
                      Mark as Complete
                    </Button>
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