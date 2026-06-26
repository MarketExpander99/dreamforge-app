'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, BookOpen, Clock, CheckCircle2, Trophy, BarChart3 } from 'lucide-react';

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

interface Exploration {
  label: string;
  short_description: string;
  main_function: string;
}

interface EnhancedModule {
  title: string;
  description: string;
  estimatedTime: string;
  status: 'in_progress' | 'completed';
  progress_percentage: number;
  xp_earned: number;
  xp_total: number;
  last_accessed: string;
  quiz?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      userAnswer?: string;
      xpValue: number;
    }>;
  };
}

export default function LearningPathPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [enhancedModules, setEnhancedModules] = useState<EnhancedModule[]>([]);

  // DB-driven states
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalInProgress: 0,
    overallProgress: 0,
    totalTimeSpent: 0,
  });
  const [displayedCompleted, setDisplayedCompleted] = useState<EnhancedModule[]>([]);
  const [completedPage, setCompletedPage] = useState(1);
  const ITEMS_PER_PAGE = 4;
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('username, interests')
        .eq('id', session.user.id)
        .single();
      setProfile(prof);

      const { data: expl } = await supabase
        .from('user_explorations')
        .select('label, short_description, main_function')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(8);
      if (expl) setExplorations(expl);

      // Current saved path (unchanged)
      // Exclude "Learning Journey" cache rows created by /learning (prevents UI pollution)
      const { data: path } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', session.user.id)
        .neq('title', 'Learning Journey')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (path) {
        setCurrentPath({
          ...path,
          modules: path.modules || [],
        });
      }

      // Real progress from exact schema (status TEXT, content_id FK, time_spent in minutes, last_accessed_at)
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          status,
          progress_percentage,
          time_spent,
          last_accessed_at,
          content_items (
            title,
            quiz
          )
        `)
        .eq('user_id', session.user.id)
        .order('last_accessed_at', { ascending: false });

      if (progressData) {
        const mapped: EnhancedModule[] = progressData
          .filter((p: any) => p.status === 'in_progress' || p.status === 'completed')
          .map((p: any) => {
            const content = p.content_items || {};
            const lastAccessedDate = p.last_accessed_at ? new Date(p.last_accessed_at) : new Date();
            const lastAccessed = lastAccessedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ago';

            return {
              title: content.title || 'Untitled Item',
              description: 'Progress tracked via Skill Gain learning path',
              estimatedTime: 'Varies',
              status: p.status === 'completed' ? 'completed' : 'in_progress',
              progress_percentage: Number(p.progress_percentage) || 0,
              xp_earned: Math.floor((Number(p.progress_percentage) || 0) * 8),
              xp_total: 1000,
              last_accessed: lastAccessed,
              quiz: content.quiz || undefined,
            };
          });

        setEnhancedModules(mapped);

        // Accurate stats from real DB data
        const completedItems = mapped.filter(m => m.status === 'completed');
        const inProgressItems = mapped.filter(m => m.status === 'in_progress');
        const totalProgress = mapped.reduce((acc, m) => acc + m.progress_percentage, 0);
        const avgProgress = mapped.length > 0 ? Math.round(totalProgress / mapped.length) : 0;

        setStats({
          totalCompleted: completedItems.length,
          totalInProgress: inProgressItems.length,
          overallProgress: avgProgress,
          totalTimeSpent: progressData.reduce((acc: number, p: any) => acc + (p.time_spent || 0), 0),
        });

        // Initial lazy load batch for completed
        setDisplayedCompleted(completedItems.slice(0, ITEMS_PER_PAGE));
      }

      setLoading(false);
    };

    init();
  }, [supabase, router]);

  const loadMoreCompleted = () => {
    setLoadMoreLoading(true);
    const nextPage = completedPage + 1;
    const start = (nextPage - 1) * ITEMS_PER_PAGE;
    const allCompleted = enhancedModules.filter(m => m.status === 'completed');
    const end = start + ITEMS_PER_PAGE;
    setDisplayedCompleted(allCompleted.slice(0, end));
    setCompletedPage(nextPage);
    setLoadMoreLoading(false);
  };

  const inProgress = enhancedModules.filter(m => m.status === 'in_progress');
  const completed = enhancedModules.filter(m => m.status === 'completed');

  const proficiencyColor = (percent: number) => {
    if (percent >= 85) return 'text-emerald-600';
    if (percent >= 60) return 'text-amber-600';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Navigation />
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-amber-500" />
              My Learning Path
            </h1>
            <p className="text-muted-foreground">AI-generated • Personalized • Track progress, review tests & earn XP</p>
          </div>
        </div>

        {/* Current Path Header (unchanged) */}
        {currentPath && (
          <Card className="mb-10 border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {currentPath.title}
              </CardTitle>
              <CardDescription>{currentPath.description}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats Overview – styled to match existing cards */}
        <Card className="mb-12 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Your Learning Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.totalCompleted}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-amber-600">{stats.totalInProgress}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-3xl font-bold">{stats.overallProgress}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-3xl font-bold">{stats.totalTimeSpent} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Progress – now real DB data, exact same styling */}
        <div className="mb-12">
          <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6">
            <Clock className="h-6 w-6 text-amber-500" />
            In Progress
          </h2>
          {inProgress.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-0 shadow-sm">
              No modules in progress yet. Add discoveries on the Discover page to expand and build your path!
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {inProgress.map((module, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">In Progress</Badge>
                    </div>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span className="font-medium">{module.progress_percentage}%</span>
                      </div>
                      <Progress value={module.progress_percentage} className="h-2" />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span>XP Earned</span>
                      </div>
                      <span className="font-semibold">{module.xp_earned} / {module.xp_total}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Last accessed {module.last_accessed}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed – now real DB data + lazy loading, exact same styling */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold mb-6">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            Completed ({completed.length})
          </h2>
          {completed.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-0 shadow-sm">
              No completed modules yet. Finish modules to review tests and see XP breakdown.
            </Card>
          ) : (
            <div className="space-y-6">
              {displayedCompleted.map((module, index) => (
                <Card key={index} className="border-0 shadow-sm overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {module.title}
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Completed</Badge>
                        </CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${proficiencyColor(module.progress_percentage)}`}>
                          {module.progress_percentage}%
                        </div>
                        <p className="text-xs text-muted-foreground">Proficiency</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-6 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="h-4 w-4" />
                        XP Earned
                      </div>
                      <span className="font-semibold text-emerald-600">{module.xp_earned} / {module.xp_total} XP</span>
                    </div>

                    {module.quiz && (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="review">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Review Test Questions &amp; Answers
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-8 pt-4">
                              {module.quiz.questions.map((q, qIdx) => (
                                <div key={qIdx} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5">
                                  <p className="font-medium mb-3">{q.question}</p>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Your answer:</span>
                                      <span className={q.userAnswer === q.correctAnswer ? 'text-emerald-600' : 'text-red-500'}>
                                        {q.userAnswer}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Correct answer:</span>
                                      <span className="text-emerald-600 font-medium">{q.correctAnswer}</span>
                                    </div>
                                  </div>
                                  <div className="mt-4 text-xs flex items-center justify-between">
                                    <span className="text-muted-foreground">XP for this question</span>
                                    <Badge variant="outline">+{q.xpValue}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              ))}

              {displayedCompleted.length < completed.length && (
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={loadMoreCompleted}
                  disabled={loadMoreLoading}
                >
                  {loadMoreLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Load More Completed Items
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}