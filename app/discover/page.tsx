'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BookOpen, Plus, CreditCard, Crown, Loader2, Sparkles } from 'lucide-react';
import Feed from '@/components/feed';  // ← Preserved for My Feed section

// TODO: Later we can move this to lib/prompts/discover-lesson-prompt.txt and load via API route for easier editing
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
  const supabase = createBrowserSupabaseClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [centerNode, setCenterNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState<number>(8);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [userProfile, setUserProfile] = useState<{ grade_level?: string; interests?: string[] } | null>(null);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [chatUsedForNode, setChatUsedForNode] = useState(false);
  const [isAddingToPath, setIsAddingToPath] = useState(false);

  // Auto-focus search input on load
  useEffect(() => {
    if (isSessionReady) {
      searchInputRef.current?.focus();
    }
  }, [isSessionReady]);

  // Session initialization
  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session && mounted) {
        setIsSessionReady(true);
        setIsCheckingAuth(false);
        await loadCurrentPath(session.user.id);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'SIGNED_IN' || session) && mounted) {
          setIsSessionReady(true);
          setIsCheckingAuth(false);
          if (session) loadCurrentPath(session.user.id);
          subscription.unsubscribe();
        }
      });

      setTimeout(async () => {
        if (!isSessionReady && mounted) {
          const { data: { session: latestSession } } = await supabase.auth.getSession();
          if (!latestSession) {
            router.push('/auth/login');
          } else {
            setIsSessionReady(true);
            setIsCheckingAuth(false);
            loadCurrentPath(latestSession.user.id);
          }
        }
      }, 800);

      return () => subscription.unsubscribe();
    };

    initializeSession();

    return () => { mounted = false; };
  }, [supabase, router]);

  // Fetch user profile for personalization
  useEffect(() => {
    if (!isSessionReady) return;

    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level, interests')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }
    };

    fetchProfile();
  }, [isSessionReady, supabase]);

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

  const saveProgress = async (topicLabel: string, progressPct: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('user_progress').upsert({
        user_id: session.user.id,
        content_id: topicLabel,
        status: 'in_progress',
        progress_percentage: progressPct,
        time_spent: 15,
        last_accessed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,content_id' });
    } catch (err) {
      console.error('Progress save failed:', err);
    }
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
        .replace('${topic}', topic);

      finalPrompt = finalPrompt.replace('${isDeep}', isDeep.toString());

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      const rawData = await response.json();
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

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
      alert("Failed to generate lesson.");
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
    const url = `https://grokipedia.com/search?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddToLearningPath = async () => {
    if (!centerNode) return;

    setIsAddingToPath(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsAddingToPath(false);
      return;
    }

    await saveExploration(centerNode);
    const baseProgress = chatUsedForNode ? 65 : 40;
    await saveProgress(centerNode.label, baseProgress);

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

    const { error } = await supabase
      .from('learning_paths')
      .upsert({
        user_id: session.user.id,
        title: pathTitle,
        description: currentPath?.description || `Personalized path including ${centerNode.label}`,
        modules,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (!error) {
      await loadCurrentPath(session.user.id);
      alert("✅ Grok updated your learning feed!");
    } else {
      alert("Failed to update path – please try again.");
    }

    setIsAddingToPath(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !centerNode) return;

    if (credits < 0.5) {
      alert("Not enough credits for chat. Each chat message costs 0.5 credits.");
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
          prompt: `You are a safe, helpful educational assistant on Skill-Gain.com.
Current lesson topic is "${centerNode.label}".
Keep all answers family-friendly, educational, and appropriate for students.
Answer this question helpfully and clearly: ${currentQuestion}`
        }),
      });

      const raw = await response.json();
      const answer = typeof raw === 'string' ? raw : raw.content || "Sorry, I couldn't generate a response.";
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);

      setChatUsedForNode(true);
      await saveProgress(centerNode.label, 65);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isCheckingAuth || !isSessionReady) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Navigation />
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground">Personalized lessons • Adapted to your level • Earn XP as you learn</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-5 py-3 rounded-3xl">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-2xl">{credits}</span>
              <span className="text-sm text-muted-foreground">credits</span>
            </div>
            <Button variant="outline" className="gap-2">
              <Crown className="h-4 w-4" />
              Buy Credits
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-4 mb-10">
          <Input
            ref={searchInputRef}
            placeholder="Search anything... (bees, starship heat shield, fractions...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && exploreNormal()}
            className="py-7 text-lg w-full"
          />
          <div className="flex gap-3">
            <Button onClick={exploreNormal} disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Get Lesson'}
            </Button>
            <Button onClick={exploreDeep} disabled={isLoading} variant="default" className="flex-1">
              Deep Lesson
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-8">
              <Sparkles className="h-16 w-16 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
              Grok is building your lesson.
            </h2>
            <p className="text-muted-foreground max-w-xs">Crafting personalized lessons just for you...</p>
            
            <div className="flex gap-2 mt-10">
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        ) : centerNode ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-3xl">{centerNode.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div>
                <h4 className="font-semibold mb-2">Lesson Introduction</h4>
                <p className="text-lg leading-relaxed break-words">{centerNode.short_description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Learning Objective</h4>
                <p className="text-lg break-words">{centerNode.main_function}</p>
              </div>

              {centerNode.deep_details && (
                <div className="bg-emerald-50 dark:bg-emerald-950 p-6 rounded-2xl">
                  <h4 className="font-semibold mb-3 text-emerald-700 dark:text-emerald-300">Full Lesson Content</h4>
                  <div className="text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap prose dark:prose-invert max-w-none">
                    {centerNode.deep_details}
                  </div>
                </div>
              )}

              {centerNode.self_similar?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Related Lessons</h4>
                  <div className="flex flex-wrap gap-2">
                    {centerNode.self_similar.map((item, i) => (
                      <Button key={i} variant="outline" size="sm" onClick={() => { setSearchQuery(item); callGrok(item, false); }}>
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Key Concepts &amp; Steps</h4>
                <div className="flex flex-wrap gap-2">
                  {centerNode.components.map((comp, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => handleComponentClick(comp)}>
                      {comp}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button variant="outline" className="gap-2 flex-1" onClick={viewDiveDeeper}>
                  <BookOpen className="h-4 w-4" />
                  Dive Deeper
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 flex-1" 
                  onClick={handleAddToLearningPath}
                  disabled={isAddingToPath}
                >
                  {isAddingToPath ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Grok is building your feed...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add to Learning Path
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-8 border-t">
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

                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 max-h-72 overflow-y-auto mb-4 space-y-3 w-full">
                  {chatMessages.length === 0 && <p className="text-muted-foreground text-center py-4">Ask anything about this lesson...</p>}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-800 border'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white dark:bg-zinc-800 border flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask anything about this lesson..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && sendChatMessage()}
                    disabled={isChatLoading}
                  />
                  <Button onClick={sendChatMessage} disabled={isChatLoading}>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-20 text-center w-full">
            <p className="text-xl text-muted-foreground">Search a topic above to get your personalized lesson</p>
          </Card>
        )}

        {/* My Feed Section - AI-generated personalized feed based on active learning paths */}
        <Feed />
      </div>
    </div>
  );
}