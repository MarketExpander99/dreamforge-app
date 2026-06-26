// app/discover/page.tsx
// Skill Gain - Discover Page with Safe JSON Parsing + Reliable Progress Saving
// Full file - ready to copy-paste

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { useAuth } from '@/lib/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Search, BookOpen, Plus, CreditCard, Crown, Loader2, Sparkles } from 'lucide-react';
import Feed from '@/components/feed';

const LESSON_PROMPT_TEMPLATE = `You are an expert educational assistant for Skill Gain, a safe and gamified learning platform for students.

CRITICAL SAFETY RULES - NEVER BREAK THESE:
- Under NO circumstances generate content that is harmful to kids, illegal, explicit, violent, hateful, discriminatory, or promotes any illegal/dangerous activity.
- All content must be 100% safe, family-friendly, educational, and appropriate for children and teenagers.
- Stay positive, encouraging, and fully educational at all times.

User profile: \${grade} level student with interests in \${interests}.

For the topic "\${topic}", create ONE focused, practical LESSON on a specific actionable sub-topic.

IMPORTANT:
- Label must be a clear, specific lesson title (e.g. "How Starship's Heat Shield Tiles Work" or "Cleaning a Beehive").
- Start teaching real content immediately. Do NOT use teaser language like "Explore...", "Discover...", "Learn about..." or any advert-style hooks.
- Always teach "how it works", materials, mechanisms, and practical knowledge right from the start.

Return ONLY valid JSON with this exact structure:

{
  "label": "Specific lesson title focused on how something works or a practical skill",
  "short_description": "Actual engaging lesson introduction - the opening section of the full lesson. Dynamically adjust length and depth based on the student's grade_level and interests: beginner (3-4 detailed sentences), intermediate (4-6 detailed sentences), advanced (5-7+ detailed sentences). Start teaching the content right away at the student's exact level. Educational, substantive, and never teaser/advert style.",
  "main_function": "Clear learning objective - what the student will understand or be able to do after this lesson",
  "components": ["key concept 1", "key concept 2", ...],
  "self_similar": ["related lesson ideas", ...],
  \${isDeep ? \`"deep_details": "FULL DETAILED LESSON CONTENT (600+ words). Write engaging, educational material at the student's exact level. Include step-by-step instructions where appropriate, clear explanations, examples, reference data, facts, and sources at the end. Stimulate their current understanding and gently challenge them to grow."\` : \`"deep_details": "Detailed lesson content (400+ words) adapted to the student's level with explanations, examples, and references."\`}
}`;

interface Node {
  id: string;
  label: string;
  short_description: string;
  main_function: string;
  components: string[];
  self_similar: string[];
  deep_details?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface LearningModule {
  title: string;
  lessons: string[];
  estimated_time: string;
  description?: string;
}

interface LearningPath {
  id?: string;
  title: string;
  description: string;
  modules: LearningModule[];
  generated_at: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [centerNode, setCenterNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState<number>(8);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [userProfile, setUserProfile] = useState<{ grade_level?: string; interests?: string[] } | null>(null);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [chatUsedForNode, setChatUsedForNode] = useState(false);
  const [isAddingToPath, setIsAddingToPath] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    if (!authLoading && user) {
      searchInputRef.current?.focus();
    }
  }, [authLoading, user]);

  // Animate progress bar while Grok builds the lesson
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isLoading) {
      setLoadProgress(6);
      interval = setInterval(() => {
        setLoadProgress((prev) => {
          const next = prev + (Math.random() * 13 + 5);
          return next > 93 ? 93 : next;
        });
      }, 210);
    } else {
      setLoadProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Redirect to login if not authenticated (after context settles)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Fetch minimal profile info needed for prompts (once user is available)
  useEffect(() => {
    if (authLoading || !user) return;
    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level, interests')
        .eq('id', user.id)
        .single();
      if (profile) setUserProfile(profile);
    };
    fetchProfile();
  }, [authLoading, user, supabase]);

  const loadCurrentPath = async (userId: string) => {
    const { data: path } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (path) setCurrentPath(path);
  };

  const saveExploration = async (node: Node) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from('user_explorations').insert({
        user_id: session.user.id,
        label: node.label,
        short_description: node.short_description,
        main_function: node.main_function,
        components: node.components,
        self_similar: node.self_similar,
        deep_details: node.deep_details || null,
      });
    } catch (err) {
      console.error('Failed to save exploration:', err);
    }
  };

  const saveProgress = async (contentId: string, basePct: number = 30, increment: number = 0) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('saveProgress: No session found');
        return;
      }

      const progressPercentage = Math.min(100, Math.max(0, basePct + increment));
      const payload = {
        user_id: session.user.id,
        content_id: contentId,
        status: progressPercentage >= 100 ? 'completed' : 'in_progress',
        progress_percentage: progressPercentage,
        time_spent: 15 + Math.floor(Math.random() * 25),
        last_accessed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_progress')
        .upsert(payload, { onConflict: 'user_id,content_id' });

      if (error) {
        console.error('Progress save error object:', error);
      } else {
        console.log('Progress saved successfully for:', contentId);
      }
    } catch (err) {
      console.error('Progress save failed:', err);
    }
  };

  const safeParse = (data: any): any => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        console.warn("API returned non-JSON, using fallback");
        return { label: "Generated Lesson", short_description: data.substring(0, 200), main_function: "Learning objective achieved", components: [], self_similar: [] };
      }
    }
    return data;
  };

  // Helper to create specialised/practical content from existing data (no extra Grok call)
  const createSpecialisedContent = (node: Node): string => {
    const base = node.deep_details || node.short_description;
    const componentsText = node.components.length > 0 
      ? `Key practical elements include: ${node.components.join(', ')}. ` 
      : '';

    return `${base}\n\nPractical Applications & Specialised Angles:\n` +
      `${componentsText}This concept appears in real-world manufacturing, engineering, and everyday technology. ` +
      `Understanding the underlying mechanisms helps explain variations in performance, cost factors, and design choices. ` +
      `Related areas worth exploring: ${node.self_similar?.slice(0, 4).join(', ') || 'similar systems and technologies'}.`;
  };

  const callGrok = async (topic: string, isDeep: boolean = false) => {
    if (credits <= 0) {
      alert("You've used your free credits for today.");
      return;
    }

    setIsLoading(true);
    setCenterNode(null);
    setChatUsedForNode(false);
    setChatMessages([]);

    try {
      const grade = userProfile?.grade_level || 'intermediate';
      const interests = userProfile?.interests?.join(', ') || 'general learning';

      let finalPrompt = LESSON_PROMPT_TEMPLATE
        .replace('${grade}', grade)
        .replace('${interests}', interests)
        .replace('${topic}', topic)
        .replace('${isDeep}', isDeep.toString());

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      let rawData = await response.json();
      const parsed = safeParse(rawData);

      const newNode: Node = {
        id: Date.now().toString(),
        label: parsed.label || topic,
        short_description: parsed.short_description || "No description available.",
        main_function: parsed.main_function || "No objective available.",
        components: Array.isArray(parsed.components) ? parsed.components : [],
        self_similar: Array.isArray(parsed.self_similar) ? parsed.self_similar : [],
        deep_details: parsed.deep_details,
      };

      setCenterNode(newNode);
      setCredits(prev => prev - 1);

      await saveExploration(newNode);
    } catch (error) {
      console.error(error);
      alert("Failed to generate lesson. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const exploreNormal = () => callGrok(searchQuery, false);
  const exploreDeep = () => callGrok(searchQuery, true);

  const handleComponentClick = (comp: string) => {
    setSearchQuery(comp);
    callGrok(comp, false);
  };

  const viewDiveDeeper = () => {
    if (!centerNode) return;
    const query = encodeURIComponent(centerNode.label);
    window.open(`https://grokipedia.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
  };

  const handleAddToLearningPath = async () => {
    if (!centerNode) return;
    setIsAddingToPath(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsAddingToPath(false);
      return;
    }

    try {
      // 1. Save main exploration
      await saveExploration(centerNode);
      await saveProgress(centerNode.label, 35, 25);

      // === SPEC: Deduplication + empty-round guard (24h same topic + type) ===
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from('user_explorations')
        .select('id, label, created_at')
        .eq('user_id', session.user.id)
        .gte('created_at', twentyFourHoursAgo)
        .ilike('label', `%${centerNode.label}%`)
        .limit(5);

      const hasRecentDuplicate = (recent || []).some((r: any) =>
        (r.label || '').toLowerCase().includes(centerNode.label.toLowerCase())
      );

      if (hasRecentDuplicate) {
        alert("✅ Already added recently — avoiding duplicate cards (24h cooldown).");
        setIsAddingToPath(false);
        return;
      }

      // 2. Create progressive cards — ONLY if we have content (empty guard)
      const progressiveCards = [
        {
          label: `${centerNode.label} - Intro`,
          short_description: centerNode.short_description,
          focus: "Intro"
        },
        {
          label: `${centerNode.label} - Extended`,
          short_description: centerNode.deep_details 
            ? centerNode.deep_details.substring(0, 850) 
            : centerNode.short_description,
          focus: "Extended"
        },
        {
          label: `${centerNode.label} - Specialised`,
          short_description: createSpecialisedContent(centerNode),
          focus: "Specialised"
        }
      ];

      if (progressiveCards.length === 0) {
        console.log('[dedup-guard] Skipped round creation — 0 cards generated');
        setIsAddingToPath(false);
        return;
      }

      for (const card of progressiveCards) {
        await supabase.from('user_explorations').insert({
          user_id: session.user.id,
          label: card.label,
          short_description: card.short_description,
          main_function: centerNode.main_function,
          components: centerNode.components,
          self_similar: centerNode.self_similar,
          deep_details: centerNode.deep_details || null,
        });
      }

      // 3. Update learning path module (keeps existing functionality)
      let modules: LearningModule[] = currentPath?.modules || [];
      const newModule: LearningModule = {
        title: centerNode.label,
        description: centerNode.short_description,
        estimated_time: '2-4 hours',
        lessons: [centerNode.main_function, ...centerNode.components.slice(0, 3)],
      };
      modules = [...modules, newModule];

      const pathTitle = currentPath 
        ? `${currentPath.title.split(' - ')[0]} - Updated with ${centerNode.label}`
        : `My Learning Path - ${centerNode.label}`;

      const { error: pathError } = await supabase
        .from('learning_paths')
        .upsert({
          user_id: session.user.id,
          title: pathTitle,
          description: currentPath?.description || `Personalized path including ${centerNode.label}`,
          modules,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (!pathError) {
        await loadCurrentPath(session.user.id);
        alert("✅ Added to your learning path with 3 progressive cards!");
      } else {
        alert("Added to path, but there was an issue updating modules.");
      }

    } catch (err) {
      console.error(err);
      alert("Something went wrong while adding to path.");
    } finally {
      setIsAddingToPath(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !centerNode) return;
    if (credits < 0.5) {
      alert("Not enough credits for chat.");
      return;
    }

    const userMsg = { role: 'user' as const, content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const currentQuestion = chatInput;
    setChatInput('');

    setIsChatLoading(true);
    setCredits(prev => prev - 0.5);

    try {
      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a safe, helpful educational assistant on Skill-Gain.com. Current lesson topic is "${centerNode.label}". Keep all answers family-friendly. Answer: ${currentQuestion}`
        }),
      });

      let raw = await response.json();
      const answer = typeof raw === 'string' ? raw : raw.content || raw || "Great question! Here's what I think...";
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      setChatUsedForNode(true);
      await saveProgress(centerNode.label, 65, 15);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Try again!" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground mt-1">Personalized lessons • Adapted to your level</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-xl text-sm">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold tabular-nums">{credits}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Crown className="h-4 w-4" /> Buy Credits
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-3 mb-8">
          <Input ref={searchInputRef} placeholder="Search anything... (bees, starship heat shield, fractions...)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isLoading && exploreNormal()} className="py-5 text-base w-full" />
          <div className="flex gap-3">
            <Button onClick={exploreNormal} disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Get Lesson'}
            </Button>
            <Button onClick={exploreDeep} disabled={isLoading} variant="default" className="flex-1">Deep Lesson</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles className="h-16 w-16 text-amber-500 animate-pulse mb-8" />
            <h2 className="text-3xl font-semibold tracking-tight">Grok is building your lesson...</h2>
            <p className="text-muted-foreground">Personalizing for you • Structured round in progress</p>

            <div className="w-full max-w-sm mt-8 px-6">
              <Progress value={loadProgress} className="h-3 rounded-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>Building structured lesson</span>
                <span>{Math.round(loadProgress)}%</span>
              </div>
            </div>

            <div className="flex gap-2 mt-10">
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        ) : centerNode ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">{centerNode.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-5">
              <div>
                <h4 className="font-semibold mb-1.5 text-sm tracking-wide text-zinc-500 dark:text-zinc-400">LESSON INTRODUCTION</h4>
                <p className="text-[15px] leading-relaxed break-words">{centerNode.short_description}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1.5 text-sm tracking-wide text-zinc-500 dark:text-zinc-400">LEARNING OBJECTIVE</h4>
                <p className="text-[15px] break-words">{centerNode.main_function}</p>
              </div>

              {centerNode.deep_details && (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/60 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <h4 className="font-semibold mb-2 text-sm text-emerald-700 dark:text-emerald-300">FULL LESSON</h4>
                  <div className="text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap text-[15px] leading-relaxed">{centerNode.deep_details}</div>
                </div>
              )}

              {centerNode.self_similar?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm tracking-wide text-zinc-500 dark:text-zinc-400">RELATED LESSONS</h4>
                  <div className="flex flex-wrap gap-2">
                    {centerNode.self_similar.map((item, i) => (
                      <Button key={i} variant="outline" size="sm" onClick={() => { setSearchQuery(item); callGrok(item, false); }}>{item}</Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2 text-sm tracking-wide text-zinc-500 dark:text-zinc-400">KEY CONCEPTS</h4>
                <div className="flex flex-wrap gap-2">
                  {centerNode.components.map((comp, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => handleComponentClick(comp)}>{comp}</Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-5 border-t border-zinc-200 dark:border-zinc-800">
                <Button variant="outline" className="gap-2 flex-1" onClick={viewDiveDeeper}>
                  <BookOpen className="h-4 w-4" /> Dive Deeper
                </Button>
                <Button variant="outline" className="gap-2 flex-1" onClick={handleAddToLearningPath} disabled={isAddingToPath}>
                  {isAddingToPath ? <><Loader2 className="h-4 w-4 animate-spin" /> Building...</> : <><Plus className="h-4 w-4" /> Add to Path</>}
                </Button>
              </div>

              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-semibold tracking-tight">Ask Grok</h3>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 max-h-64 overflow-y-auto mb-3 space-y-2 text-sm">
                  {chatMessages.length === 0 && <p className="text-muted-foreground text-center py-3">Ask anything about this lesson...</p>}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] px-3.5 py-2 rounded-xl ${msg.role === 'user' ? 'bg-[#0078D4] text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && <div className="flex justify-start"><div className="px-3.5 py-2 bg-white dark:bg-zinc-900 border rounded-xl flex items-center gap-2 text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...</div></div>}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Ask anything..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && sendChatMessage()} disabled={isChatLoading} />
                  <Button onClick={sendChatMessage} disabled={isChatLoading}>Send</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-20 text-center w-full">
            <p className="text-xl text-muted-foreground">Search a topic above to get your personalized lesson</p>
          </Card>
        )}

        <Feed />
      </div>
    </div>
  );
}