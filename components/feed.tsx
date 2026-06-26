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
import { markCardComplete, markTopicComplete as markTopicCompleteServer } from '@/app/actions/progress';
import { getUncompletedFeed } from '@/app/actions/feed';

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

  // Topic-level completion state (for immediate "Topic completed!" celebration UI before server re-load)
  // Complements the server marker (topic-complete-*) for instant feedback + reliable hide on refresh.
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

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

    // === SINGLE SOURCE OF TRUTH: Server-authoritative uncompleted feed ===
    // getUncompletedFeed calls getPersonalizedUncompletedFeed which:
    // - Reads user_explorations + user_progress on server
    // - Filters status=completed OR progress>=100 BEFORE returning
    // - Uses stable IDs derived from exploration PK
    // - Deduplicates
    // This is the authoritative "what should this user see" list.
    // Client still enriches + keeps optimistic UI + localStorage resilience.
    let serverItems: any[] = [];
    try {
      serverItems = await getUncompletedFeed();
    } catch (e) {
      console.warn('[feed] Server feed fetch failed, will fall back to explorations path', e);
    }

    // Belt-and-suspenders: still compute effectiveCompleted (local + server) for any client-only cards
    // and for round completion math. The server list is already filtered.
    const loadedCompleted = loadCompletedIds();
    const { data: progressCompleted } = await supabase
      .from('user_progress')
      .select('content_id, status, progress_percentage')
      .eq('user_id', session.user.id)
      .or('status.eq.completed,progress_percentage.gte.100');

    const serverCompleted = new Set<string>((progressCompleted || []).map((p: any) => String(p.content_id)));
    const effectiveCompleted = new Set<string>([...loadedCompleted, ...serverCompleted]);
    setCompletedIds(effectiveCompleted);
    persistCompletedIds(effectiveCompleted);

    // Helper (kept for QA enrichment on load)
    function createTopicTrueQA(topic: string, desc: string): QAData {
      const safeTopic = topic || 'this topic';
      const summary = (desc || '').slice(0, 420);
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

    let mapped: FeedItem[] = [];

    if (serverItems.length > 0) {
      // Use server pre-filtered list (primary path). Augment with client-only fields for existing render.
      mapped = serverItems.map((item: any, idx: number) => {
        const base: FeedItem = {
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          mediaUrl: `https://picsum.photos/id/${300 + (idx % 20)}/800/400`,
          mediaType: 'image',
          learningPathId: 'path-default',
          learningPathTitle: 'Your Path',
          completed: false, // Server already excluded completed items
          topic: item.topic,
          topicId: item.topicId,
          round: item.round || 1,
          difficulty: item.difficulty || item.round || 1,
        };
        // Seed initial QA heuristic for qa cards (will be upgraded async if needed)
        if (item.type === 'qa') {
          (base as any).qa = createTopicTrueQA(item.topic, item.description);
        }
        return base;
      });
    } else {
      // Fallback: original client generation (kept for resilience when server action unavailable)
      const { data: explorations } = await supabase
        .from('user_explorations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      const paths = explorations || [];

      paths.forEach((exp: any, topicIndex: number) => {
        const topicId = exp.id || `topic-${topicIndex}`;
        const topicTitle = exp.label || 'Learning Topic';
        const baseDesc = exp.short_description || exp.deep_details || `Core ideas around ${topicTitle}.`;

        const numCards = 3 + (topicIndex % 3);

        for (let i = 0; i < numCards; i++) {
          const id = `card-${topicId}-${i}`;
          const roundNum = Math.floor(i / 2) + 1;
          if (effectiveCompleted.has(id)) continue; // skip in fallback too (authoritative filter)

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
            completed: false,
            topic: topicTitle,
            topicId,
            round: roundNum,
            difficulty: roundNum,
          });
        }

        const testId = `qa-${topicId}`;
        if (!effectiveCompleted.has(testId)) {
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
            completed: false,
            topic: topicTitle,
            topicId,
            round: 1,
            difficulty: 1,
          });
        }
      });
    }

    // No placeholder cards when empty — the entire feed section will be hidden by the render guard below.

    // Server already deduped, but keep strong client dedup as defense
    const seen = new Set<string>();
    const uniqueMapped = mapped.filter(item => {
      const key = `${item.topicId}-${item.title.substring(0, 60)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setFeedItems(uniqueMapped);

    // Derive sensible starting round per topic:
    // Start at the lowest round that still has uncompleted cards for that topic.
    // This ensures that if lower rounds were completed previously (server filter), we land on the active round.
    const initialState: TopicState = {};
    uniqueMapped.forEach(item => {
      if (!initialState[item.topicId]) {
        const roundsForTopic = uniqueMapped
          .filter(i => i.topicId === item.topicId)
          .map(i => i.round);
        const startRound = roundsForTopic.length > 0 ? Math.min(...roundsForTopic) : 1;
        initialState[item.topicId] = { currentRound: startRound };
      }
    });
    setTopicState(initialState);

    // Clear any stale local completedTopics on fresh authoritative load (server truth wins)
    setCompletedTopics(new Set());

    setIsLoading(false);

    // Async upgrade for real topic-true Grok QAs (only uncompleted)
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
    // No artificial cap — render logic decides if we are past the real last round for the topic.
    // Guarded by hasHigherRoundCards checks in the UI so users cannot advance into phantom rounds.
    setTopicState(prev => ({
      ...prev,
      [topicId]: { currentRound: (prev[topicId]?.currentRound || 1) + 1 }
    }));
  };

  const isRoundComplete = (topicId: string, round: number) => {
    const roundCards = feedItems.filter(i => i.topicId === topicId && i.round === round && !pendingRemoveIds.has(i.id));
    // Consider complete only when every card is either server-completed or pending removal (optimistic)
    return roundCards.length > 0 && roundCards.every(card => card.completed || pendingRemoveIds.has(card.id));
  };

  const updateCompleted = (newIds: Set<string>) => {
    setCompletedIds(newIds);
    persistCompletedIds(newIds);
  };

  // Optimistic X-style 1-tap completion (with restore on error)
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(new Set());

  const handleComplete = async (item: FeedItem, qaAnswer?: string) => {
    // Optimistic: immediately hide the card (instant feedback before revalidation)
    setPendingRemoveIds(prev => new Set(prev).add(item.id));

    try {
      const result = await markCardComplete(item.id, qaAnswer || null);

      // Persist locally (belt)
      const newIds = new Set(completedIds);
      newIds.add(item.id);
      updateCompleted(newIds);

      // Mark completed in local state (will be filtered on next authoritative load)
      setFeedItems(prev => prev.map(i => (i.id === item.id ? { ...i, completed: true } : i)));

      toast.success(result.message || `+${result.xpAwarded} XP`);

      // === Round + Topic completion detection (per spec) ===
      // After completing a card, check if this was the *last card of the final round* for its topic.
      // If so: show celebratory "Topic completed!" state + persist via marker so it stays hidden on refresh.
      setTimeout(() => {
        const topicId = item.topicId;
        // Compute remaining visible (non-pending, non-completed) cards for the topic
        const remainingForTopic = feedItems.filter(i =>
          i.topicId === topicId &&
          i.id !== item.id &&
          !pendingRemoveIds.has(i.id) &&
          !completedIds.has(i.id)
        );

        // Also account for the just-completed one
        const stillActive = remainingForTopic.length;

        if (stillActive === 0) {
          // No more active cards for this topic in current view → treat as finished
          // Stabilized check: if there are no uncompleted cards in *higher rounds* than the one just finished,
          // this was the final round for the topic.
          const higherCardsRemaining = feedItems.filter(i =>
            i.topicId === topicId &&
            i.round > item.round &&
            !pendingRemoveIds.has(i.id) &&
            !completedIds.has(i.id)
          );

          const wasFinal = higherCardsRemaining.length === 0;

          if (wasFinal) {
            // Show positive topic complete UI + persist marker
            setCompletedTopics(prev => new Set(prev).add(topicId));
            // Persist to server (non-blocking; optimistic already applied)
            markTopicCompleteServer(topicId).catch(() => {});
            // Clean the topic items from local feed for instant removal of cards
            setFeedItems(prev => prev.filter(i => i.topicId !== topicId));
          }
        }
      }, 10);

      // After server write + revalidate (action already does revalidatePath /discover etc),
      // pull fresh authoritative list from server so UI matches "one source of truth".
      // Do not await to keep UI snappy; next focus/refresh or explicit will be clean.
      // We keep the pendingRemove so it stays gone in this view.
      setTimeout(() => {
        // Non-blocking authoritative refresh
        getUncompletedFeed().then((fresh) => {
          if (fresh && fresh.length >= 0) {
            // We don't fully reset feed here to preserve round/chat state.
            // The next visibilitychange or manual Refresh will use the clean server list.
          }
        }).catch(() => {});
      }, 50);

      // Note: On hard refresh or tab return the server getPersonalizedUncompletedFeed
      // will exclude this card permanently for the user.
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

  // Reliable topic completion: writes server marker (so getPersonalizedUncompletedFeed excludes forever)
  // + optimistic client removal + local celebration state.
  const markTopicComplete = async (topicId: string, topicTitle: string) => {
    // Optimistic: hide the whole topic immediately
    setCompletedTopics(prev => new Set(prev).add(topicId));
    setFeedItems(prev => prev.filter(item => item.topicId !== topicId));

    // Also mark any remaining synthetic card ids locally (defense in depth)
    const topicCardIds = feedItems
      .filter(item => item.topicId === topicId)
      .map(item => item.id);
    const newIds = new Set(completedIds);
    topicCardIds.forEach(id => newIds.add(id));
    updateCompleted(newIds);

    try {
      await markTopicCompleteServer(topicId);
      toast.success(`Topic "${topicTitle}" marked complete — hidden from feed`);
    } catch (e) {
      // Still keep hidden in this session; server marker may have partially applied.
      // On next load the cards may come back only if marker write failed.
      console.warn('markTopicCompleteServer failed (topic may reappear after refresh if not persisted)', e);
      toast('Topic hidden for this session. Server sync may retry on refresh.');
    }
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

  // Hide the entire feed section when there are no cards/topics to show (new users or all completed)
  if (feedItems.length === 0) {
    return null;
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

      <div className="space-y-10">

        {topics.map(topicId => {
          const topicItems = feedItems.filter(i => i.topicId === topicId);
          if (topicItems.length === 0) return null;

          // Local completion celebration state wins for immediate UX (before re-fetch)
          if (completedTopics.has(topicId)) {
            // Already in celebration / hidden state — render a minimal completed banner
            // (parent topics list + this guard keeps it from re-rendering cards)
            const titleFromState = topicItems[0]?.topic || feedItems.find(i => i.topicId === topicId)?.topic || 'Topic';
            return (
              <div key={topicId} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 text-center border rounded-2xl bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                >
                  <Trophy className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                    Topic completed!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Great work finishing <span className="font-medium">{titleFromState}</span>. This topic has been marked complete and removed from your feed.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      // Ensure server marker and clean local state (idempotent)
                      markTopicCompleteServer(topicId).catch(() => {});
                      setCompletedTopics(prev => {
                        const next = new Set(prev);
                        next.delete(topicId);
                        return next;
                      });
                    }}
                  >
                    Hide completed topic
                  </Button>
                </motion.div>
              </div>
            );
          }

          const topicTitle = topicItems[0].topic;
          const currentRound = getCurrentRound(topicId);

          // Filter pending removes for accurate "remaining" count and empty state
          const effectiveTopicItems = topicItems.filter(i => !pendingRemoveIds.has(i.id));
          const currentRoundItems = effectiveTopicItems.filter(i => i.round === currentRound && !i.completed);

          const roundComplete = isRoundComplete(topicId, currentRound);

          // === Stabilized final-round detection (fixes phantom Round 3 + manual close after round 2) ===
          // "Is final" = there are no uncompleted cards belonging to rounds strictly higher than current.
          // This works regardless of how many rounds the synthetic generator produced for the topic (2 or 3+).
          // We also compute maxPresent for safety against advancing past real content.
          const higherRoundCards = effectiveTopicItems.filter(
            i => i.round > currentRound && !i.completed && !pendingRemoveIds.has(i.id)
          );
          const hasHigherRoundCards = higherRoundCards.length > 0;

          const maxPresentRound = effectiveTopicItems.length > 0
            ? Math.max(...effectiveTopicItems.map(i => i.round))
            : currentRound;

          const isBeyondLastRound = currentRound > maxPresentRound;
          const isFinalRound = !hasHigherRoundCards || isBeyondLastRound;

          // If we somehow landed on a round with no cards and no higher rounds exist, treat the whole topic as done.
          const noCardsLeftForTopic = effectiveTopicItems.every(i => i.completed || pendingRemoveIds.has(i.id));

          // Extra stabilization: if truly no uncompleted cards remain for this topic, render clean completed UI
          // without round header or "Complete Topic" button (prevents manual close on phantom rounds).
          if ((noCardsLeftForTopic || isBeyondLastRound) && currentRoundItems.length === 0) {
            return (
              <div key={topicId} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 text-center border rounded-2xl bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                >
                  <Trophy className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                    Topic completed!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500 mb-4">
                    Great work finishing {topicTitle}. This topic has been marked complete.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markTopicComplete(topicId, topicTitle)}
                  >
                    Hide completed topic
                  </Button>
                </motion.div>
              </div>
            );
          }

          return (
            <div key={topicId} className="space-y-5">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-2xl font-semibold">{topicTitle}</h3>
                  {(isBeyondLastRound || noCardsLeftForTopic) && (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Completed</span>
                  )}
                </div>

                <div className="flex gap-3">
                  {roundComplete && hasHigherRoundCards && (
                    <Button onClick={() => advanceToNextRound(topicId)} className="gap-2">
                      Next <ArrowRight className="h-4 w-4" />
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
                {/* === Stabilized empty state (defense) === */}
                {/* Primary protection is the early-return complete banner + hasHigher guards above.
                    This catches any remaining edge cases of 0 cards on/after final round. */}
                {currentRoundItems.length === 0 && !noCardsLeftForTopic && !isBeyondLastRound && !isFinalRound && (
                  roundComplete ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
                      <Trophy className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                      <h4 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Section Complete!</h4>
                      <p className="text-emerald-600 dark:text-emerald-400 mt-1">Great work. Ready for the next set?</p>
                      <Button onClick={() => advanceToNextRound(topicId)} className="mt-4 gap-2">
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No active cards in this set.</p>
                  )
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
            </div>
          );
        })}
      </div>
    </div>
  );
}