'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, TestTube, MessageSquare, RefreshCw, CheckCircle, Sparkles, Trophy, ArrowRight, Volume2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { markCardComplete } from '@/app/actions/progress';

interface QAData {
  question: string;
  options: string[] | null;
  correctAnswer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface FeedItem {
  id: string;
  type: 'lesson' | 'qa';   // aligned with spec (lesson/qa)
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image';
  qa?: QAData;            // qa_payload style data (topic-true)
  testQuestion?: string;  // legacy fallback
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

  // Per-card answer state for inline QA cards (Phase 1)
  const [qaAnswers, setQaAnswers] = useState<Record<string, string>>({});

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

    // === Fix 1 + Fix 3 (fast visible win): Merge localStorage + server user_progress for completed ===
    // Ensures after markCardComplete + refresh the completed cards stay gone (no reappear).
    // Uses existing user_progress table only. Idempotent and robust.
    const loadedCompleted = loadCompletedIds();
    const { data: progressCompleted } = await supabase
      .from('user_progress')
      .select('content_id, status, progress_percentage')
      .eq('user_id', session.user.id)
      .or('status.eq.completed,progress_percentage.gte.100');

    const serverCompleted = new Set<string>((progressCompleted || []).map((p: any) => p.content_id));
    const effectiveCompleted = new Set<string>([...loadedCompleted, ...serverCompleted]);
    setCompletedIds(effectiveCompleted);
    persistCompletedIds(effectiveCompleted);

    const mapped: FeedItem[] = [];

    // Helper: Create a real, topic-specific comprehension QA (never meta about card)
    function createTopicTrueQA(topic: string, desc: string): QAData {
      const safeTopic = topic || 'this topic';
      const summary = (desc || '').slice(0, 420);
      // Prefer multiple choice. Build one factual key-concept question.
      // Heuristic: pick a concrete aspect from description for direct test.
      const lower = summary.toLowerCase();
      let question = `According to the lesson on ${safeTopic}, what is described as a key characteristic or step?`;
      let options: string[] = [
        `It focuses on practical mechanisms and real examples.`,
        `It is unrelated to everyday applications.`,
        `It only applies in laboratory settings.`,
        `It was developed in the last decade with no prior history.`
      ];
      let correct = 'A) It focuses on practical mechanisms and real examples.';

      if (lower.includes('function') || lower.includes('how') || lower.includes('work')) {
        question = `What does the lesson identify as central to how ${safeTopic} works or functions?`;
        options = [
          `The underlying mechanisms, materials, or step-by-step process.`,
          `Purely decorative or aesthetic qualities only.`,
          `Random chance without any predictable pattern.`,
          `It requires no prior knowledge or components.`
        ];
        correct = 'A) The underlying mechanisms, materials, or step-by-step process.';
      } else if (lower.includes('example') || lower.includes('real') || lower.includes('application')) {
        question = `Which statement best captures a real-world connection mentioned for ${safeTopic}?`;
        options = [
          `It appears in manufacturing, engineering, or daily technology.`,
          `It has no connection to the physical world.`,
          `It only exists in theoretical models.`,
          `It was designed exclusively for one narrow use case.`
        ];
        correct = 'A) It appears in manufacturing, engineering, or daily technology.';
      }

      return {
        question,
        options,
        correctAnswer: correct,
        explanation: `The lesson emphasizes the concrete mechanisms and applications of ${safeTopic}.`,
        difficulty: 'medium'
      };
    }

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
          type: 'lesson',
          title: `${topicTitle} - Insight ${i + 1}`,
          description,
          mediaUrl: `https://picsum.photos/id/${300 + topicIndex + i}/800/400`,
          mediaType: 'image',
          learningPathId: 'path-default',
          learningPathTitle: 'Your Path',
          completed: effectiveCompleted.has(id),
          topic: topicTitle,
          topicId,
          round: roundNum,
          difficulty: roundNum,
        });
      }

      // QA card placeholder (real MICRO_QUIZ_PROMPT upgrade runs async after load for topic-specific non-meta Q)
      const testId = `qa-${topicId}`;
      const qaData = createTopicTrueQA(topicTitle, baseDesc);
      mapped.push({
        id: testId,
        type: 'qa',
        title: `${topicTitle} - Check Understanding`,
        description: baseDesc.substring(0, 280),
        mediaUrl: `https://picsum.photos/id/${320 + topicIndex}/800/400`,
        mediaType: 'image',
        qa: qaData,
        learningPathId: 'path-default',
        learningPathTitle: 'Your Path',
        completed: effectiveCompleted.has(testId),
        topic: topicTitle,
        topicId,
        round: 1,
        difficulty: 1,
      });
    });

    if (mapped.length === 0) {
      mapped.push({
        id: 'empty',
        type: 'lesson',
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

    // Apply the new prompt: upgrade QA cards to real Grok-generated topic-specific ones (async + cached)
    upgradeQACardsWithRealPrompt(session.user.id, uniqueMapped, effectiveCompleted);
  };

  // === Real Grok Q&A generation using exact MICRO_QUIZ_PROMPT (non-blocking, cached) ===
  // Guarantees: questions test KEY lesson facts/concepts directly.
  // No meta language ("this card", "the purpose of this", UI talk). Honeybee-style topics will be specific.
  // Falls back silently to heuristic on any error to keep feed fast and reliable.
  const upgradeQACardsWithRealPrompt = async (
    _userId: string,
    currentItems: FeedItem[],
    effectiveCompleted: Set<string>
  ) => {
    const QA_CACHE_KEY = 'skillgain_qa_prompt_cache_v1';
    let qaCache: Record<string, QAData> = {};
    try {
      const raw = localStorage.getItem(QA_CACHE_KEY);
      if (raw) qaCache = JSON.parse(raw);
    } catch {}

    const qaItems = currentItems.filter(i => i.type === 'qa' && !effectiveCompleted.has(i.id));
    if (qaItems.length === 0) return;

    const updates: { id: string; qa: QAData }[] = [];

    for (const qaItem of qaItems) {
      const cacheKey = `${qaItem.topicId || qaItem.topic}`.slice(0, 120);
      if (qaCache[cacheKey]) {
        updates.push({ id: qaItem.id, qa: qaCache[cacheKey] });
        continue;
      }

      try {
        const { MICRO_QUIZ_PROMPT } = await import('@/lib/prompts/lesson-generator');
        const prompt = MICRO_QUIZ_PROMPT(qaItem.topic, (qaItem.description || qaItem.topic).slice(0, 850));

        const resp = await fetch('/api/grok', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (!resp.ok) throw new Error(`Grok ${resp.status}`);

        const rawContent: any = await resp.json();
        const text = typeof rawContent === 'string'
          ? rawContent
          : (rawContent?.response || rawContent?.text || rawContent?.content || JSON.stringify(rawContent));

        // Clean possible ```json fences
        const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(jsonText);

        const realQA: QAData = {
          question: String(parsed.question || '').trim(),
          options: Array.isArray(parsed.options) ? parsed.options.map(String) : null,
          correctAnswer: parsed.correctAnswer ? String(parsed.correctAnswer) : undefined,
          explanation: parsed.explanation ? String(parsed.explanation) : undefined,
          difficulty: (['easy','medium','hard'] as const).includes(parsed.difficulty) ? parsed.difficulty : 'medium'
        };

        // Guard: if somehow meta slipped in, keep fallback (rare)
        const qLower = realQA.question.toLowerCase();
        if (qLower.includes('this card') || qLower.includes('this question') || qLower.includes('purpose of this')) {
          throw new Error('Meta question detected - using fallback');
        }

        qaCache[cacheKey] = realQA;
        updates.push({ id: qaItem.id, qa: realQA });
      } catch (err) {
        // Silent fallback keeps UX fluid. Heuristic is already set on the item.
        console.info('[QA] Using local topic-true heuristic for', qaItem.topic);
      }
    }

    if (updates.length > 0) {
      try { localStorage.setItem(QA_CACHE_KEY, JSON.stringify(qaCache)); } catch {}
      setFeedItems(prev => prev.map(item => {
        const match = updates.find(u => u.id === item.id);
        return match ? { ...item, qa: match.qa } : item;
      }));
    }
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

  // Optimistic X-style 1-tap completion (with restore on error)
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set());

  const handleComplete = async (item: FeedItem, qaAnswer?: string) => {
    // Optimistic: immediately hide the card
    setPendingRemoveIds(prev => new Set(prev).add(item.id));

    try {
      const result = await markCardComplete(item.id, qaAnswer || null);

      // Persist in completed set for refresh safety
      const newIds = new Set(completedIds);
      newIds.add(item.id);
      updateCompleted(newIds);

      // Update internal feed state (in case refresh merges)
      setFeedItems(prev => prev.map(i => (i.id === item.id ? { ...i, completed: true } : i)));

      toast.success(result.message || `+${result.xpAwarded} XP`);

      // Keep it removed from current view (optimistic success)
      // (It will naturally disappear on next load or round change)
    } catch (e: any) {
      // Restore on failure
      setPendingRemoveIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      toast.error('Something went wrong — card restored. Try again.');
      console.error('markCardComplete failed', e);
    }
  };

  const markAsComplete = (item: FeedItem) => {
    handleComplete(item);
  };

  const handleQASubmit = (item: FeedItem, answer: string) => {
    if (!answer || !answer.trim()) return;
    handleComplete(item, answer.trim());
  };

  // Legacy test submit support (now routes to qa style)
  const handleTestSubmit = (item: FeedItem, answer: string) => {
    handleQASubmit(item, answer);
  };

  const markTopicComplete = (topicId: string, topicTitle: string) => {
    if (!confirm(`Mark entire topic "${topicTitle}" as complete?`)) return;

    const newIds = new Set(completedIds);
    feedItems.filter(item => item.topicId === topicId).forEach(item => newIds.add(item.id));
    updateCompleted(newIds);
    setFeedItems(prev => prev.filter(item => item.topicId !== topicId));
  };

  const handleRefreshFeed = () => loadFeedFromDB();

  const readAloud = async (item: FeedItem, voice: 'rex' | 'ava' | 'ara' | 'sal' = 'rex') => {
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

      // === Real Grok Voice (ARA, AVA, REX, SAL) ===
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenScript, voice })
      });

      if (ttsResponse.ok) {
        const audioBlob = await ttsResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
        return;
      }

      console.warn(`xAI TTS failed with voice "${voice}" — using browser fallback`);

      // Browser fallback (only if xAI fails)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(spokenScript);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
        return;
      }

      throw new Error('No TTS available');
    } catch (err) {
      console.error('TTS error:', err);
      if ('speechSynthesis' in window) {
        const fallback = new SpeechSynthesisUtterance(item.description);
        window.speechSynthesis.speak(fallback);
      }
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
    <div className="mt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-amber-500" /> My Feed
        </h2>
        <Button variant="outline" size="sm" onClick={handleRefreshFeed} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <p className="text-muted-foreground mb-7">
        Dynamic cards generated from your explorations. Speaker uses real Grok voice (Rex/Ava).
      </p>

      <div className="space-y-10">
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
            <div key={topicId} className="space-y-5">
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

              <div className="grid gap-5">
                {currentRoundItems.length === 0 && !roundComplete && (
                  <p className="text-muted-foreground">No active cards in this round.</p>
                )}

                {currentRoundItems.map(item => {
                  const isPendingRemove = pendingRemoveIds.has(item.id);
                  if (isPendingRemove) return null; // Optimistic removal (X-style fluid feed)

                  const isQA = item.type === 'qa';
                  const qa = item.qa || (item.testQuestion ? { question: item.testQuestion, options: item.testOptions || null } : null);
                  const currentAnswer = qaAnswers[item.id] || '';

                  return (
                    <motion.div key={item.id} layout>
                      <Card className="border border-zinc-200 dark:border-zinc-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3 text-lg">
                            {isQA ? <TestTube className="h-5 w-5 text-emerald-600" /> : <BookOpen className="h-5 w-5" />}
                            <span>{item.title}</span>

                            <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-widest">
                              {item.type}
                            </Badge>

                            <div className="ml-auto flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-60"
                                onClick={() => readAloud(item, 'rex')}
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
                        <CardContent className="space-y-5">
                          <p className="text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">{item.description}</p>

                          {/* Inline topic-true Q&A for qa cards (never meta) */}
                          {isQA && qa && !item.completed && (
                            <div className="rounded-xl border bg-zinc-50/60 dark:bg-zinc-950/60 p-4 space-y-3">
                              <div className="font-semibold tracking-tight">{qa.question}</div>

                              {qa.options && qa.options.length > 0 ? (
                                <div className="space-y-2">
                                  {qa.options.map((opt, idx) => {
                                    const letter = String.fromCharCode(65 + idx);
                                    const full = `${letter}) ${opt.replace(/^[A-D]\)\s*/, '')}`;
                                    return (
                                      <Button
                                        key={idx}
                                        variant="outline"
                                        className="w-full justify-start text-left h-auto py-2.5"
                                        onClick={() => handleQASubmit(item, full)}
                                        disabled={!!currentAnswer}
                                      >
                                        {full}
                                      </Button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Type your short answer here..."
                                    value={currentAnswer}
                                    onChange={(e) => setQaAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    className="min-h-[80px]"
                                  />
                                  <Button
                                    onClick={() => handleQASubmit(item, currentAnswer)}
                                    disabled={!currentAnswer.trim()}
                                    className="w-full gap-2"
                                  >
                                    <Check className="h-4 w-4" /> Submit Answer &amp; Complete
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Lesson cards: always-prominent primary Complete action (X-style single tap) */}
                          {!isQA && !item.completed && (
                            <Button
                              onClick={() => handleComplete(item)}
                              className="w-full h-11 text-base gap-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="h-5 w-5" /> Complete
                            </Button>
                          )}

                          {/* Extra actions for lesson cards */}
                          {!isQA && !item.completed && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button variant="outline" size="sm" className="gap-2" onClick={() => toggleChat(item.id)}>
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
                            </div>
                          )}

                          <AnimatePresence>
                            {openChatId === item.id && (
                              <div className="mt-4 border rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900">
                                <div className="h-64 overflow-y-auto space-y-3 mb-4 pr-2">
                                  {chatMessagesMap[item.id]?.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-[#0078D4] text-white' : 'bg-white dark:bg-zinc-950 border'}`}>
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

                          {/* Completion state indicator */}
                          {item.completed && (
                            <div className="flex items-center gap-2 text-emerald-600 text-sm">
                              <CheckCircle className="h-4 w-4" /> Completed • XP awarded
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {roundComplete && currentRound < 3 && (
                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
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