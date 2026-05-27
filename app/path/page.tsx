'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Sparkles, BookOpen, Clock, Save, RotateCcw, RefreshCw, Plus } from 'lucide-react';

interface LearningModule {
  title: string;
  description?: string;
  lessons: string[];
  estimated_time: string;
}

interface LearningPath {
  id?: string;
  title: string;
  description: string;
  modules: LearningModule[];
  generated_at?: string;
  created_at?: string;
}

interface Exploration {
  label: string;
  short_description: string;
  main_function: string;
}

export default function LearningPathPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [selectedExplorations, setSelectedExplorations] = useState<Exploration[]>([]);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [generatedPath, setGeneratedPath] = useState<LearningPath | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUserId(session.user.id);

      // Get profile (interests)
      const { data: prof } = await supabase
        .from('profiles')
        .select('username, interests')
        .eq('id', session.user.id)
        .single();

      setProfile(prof);

      // Get recent explorations
      const { data: expl } = await supabase
        .from('user_explorations')
        .select('label, short_description, main_function')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (expl) {
        setExplorations(expl);
        setSelectedExplorations(expl); // default all checked
      }

      // Get latest saved learning path
      const { data: path } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (path) {
        setCurrentPath({
          id: path.id,
          title: path.title,
          description: path.description || '',
          modules: Array.isArray(path.modules) ? path.modules : [],
          generated_at: path.generated_at,
          created_at: path.created_at,
        });
      }

      setLoading(false);
    };

    init();
  }, [supabase, router]);

  const generatePath = async (customExplorations?: Exploration[]) => {
    setGenerating(true);
    setGeneratedPath(null);

    try {
      const interestsText = profile?.interests?.join(', ') || 'general learning';
      const explorationText = (customExplorations || explorations).length > 0 
        ? (customExplorations || explorations).map(e => `${e.label}: ${e.short_description}`).join('\n')
        : 'no previous explorations yet';

      const prompt = `You are an expert learning path designer.

Student interests: ${interestsText}

Recent topics they have explored:
${explorationText}

Create a complete, engaging, and realistic personalized learning path.

Return ONLY valid JSON with this exact structure. Do not include any explanations, markdown, or code blocks:

{
  "title": "Short catchy title for the entire path",
  "description": "2-3 sentence overview of why this path is perfect for them",
  "modules": [
    {
      "title": "Module name",
      "description": "Short description of this module",
      "lessons": ["Lesson 1 title", "Lesson 2 title", ...],
      "estimated_time": "X hours"
    }
  ]
}

Aim for 4-6 modules with 3-6 lessons each. Make it practical, exciting and connected to what they've already explored.`;

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Failed to generate path');

      const raw = await response.json();
      let parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

      const newPath: LearningPath = {
        title: parsed.title || "My Personalized Learning Path",
        description: parsed.description || "",
        modules: Array.isArray(parsed.modules) ? parsed.modules : [],
        generated_at: new Date().toISOString(),
      };

      setGeneratedPath(newPath);
    } catch (error) {
      console.error('Generate path error:', error);
      alert("Failed to generate learning path. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const updatePathWithRecent = async () => {
    if (selectedExplorations.length === 0) {
      alert("Please select at least one recent discovery to update your path.");
      return;
    }

    setUpdating(true);
    await generatePath(selectedExplorations);
    setUpdating(false);
  };

  const toggleExploration = (exploration: Exploration) => {
    setSelectedExplorations(prev => {
      const isSelected = prev.some(e => e.label === exploration.label);
      if (isSelected) {
        return prev.filter(e => e.label !== exploration.label);
      } else {
        return [...prev, exploration];
      }
    });
  };

  const savePath = async () => {
    if (!generatedPath || !userId) {
      alert("Cannot save: missing data or not logged in");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('learning_paths')
        .insert({
          user_id: userId,
          title: generatedPath.title,
          description: generatedPath.description || "",
          modules: generatedPath.modules,
        });

      if (error) throw error;

      alert("✅ Learning path saved successfully!");

      const { data: freshPath } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (freshPath) {
        setCurrentPath({
          id: freshPath.id,
          title: freshPath.title,
          description: freshPath.description || '',
          modules: Array.isArray(freshPath.modules) ? freshPath.modules : [],
          generated_at: freshPath.generated_at,
          created_at: freshPath.created_at,
        });
      }

      setGeneratedPath(null);
    } catch (error: any) {
      console.error('Save path error:', error);
      alert(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
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
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-amber-500" />
              My Learning Path
            </h1>
            <p className="text-muted-foreground">AI-generated • Personalized • Based on your discoveries</p>
          </div>
        </div>

        {/* Current Saved Path */}
        {currentPath && (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Current Saved Path: {currentPath.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{currentPath.description}</p>
              <div className="space-y-6">
                {(currentPath.modules ?? []).map((module: LearningModule, i: number) => (
                  <div key={i} className="border rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{module.title}</h3>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {module.estimated_time}
                      </Badge>
                    </div>
                    {module.description && <p className="text-sm text-muted-foreground mt-1">{module.description}</p>}
                    <ul className="mt-4 space-y-2">
                      {(module.lessons ?? []).map((lesson, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-mono">0{idx + 1}</span>
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate New Path */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate New Learning Path</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedPath ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold">{generatedPath.title}</h2>
                  <p className="text-muted-foreground mt-2">{generatedPath.description}</p>
                </div>

                <div className="space-y-6">
                  {(generatedPath.modules ?? []).map((module: LearningModule, i: number) => (
                    <div key={i} className="border rounded-2xl p-5">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{module.title}</h3>
                        <Badge>{module.estimated_time}</Badge>
                      </div>
                      {module.description && <p className="text-sm mt-2">{module.description}</p>}
                      <ul className="mt-4 list-disc pl-5 space-y-1">
                        {(module.lessons ?? []).map((lesson, idx) => (
                          <li key={idx}>{lesson}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={savePath} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    Save This Learning Path
                  </Button>
                  <Button variant="outline" onClick={() => setGeneratedPath(null)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Generate Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-amber-400 mb-4" />
                <p className="text-lg font-medium">Ready to create your personalized learning journey?</p>
                <p className="text-muted-foreground mt-2 mb-8">
                  Based on your interests + {explorations.length} recent discoveries
                </p>
                <Button onClick={() => generatePath()} disabled={generating} size="lg">
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Generating your path...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2" />
                      Generate My Learning Path
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Path with Recent Searches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Update Path with Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Select which recent discoveries you want to include in your next learning path.
            </p>

            <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
              {explorations.length > 0 ? (
                explorations.map((exploration, index) => {
                  const isChecked = selectedExplorations.some(e => e.label === exploration.label);
                  return (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`exp-${index}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleExploration(exploration)}
                      />
                      <div className="flex-1">
                        <label htmlFor={`exp-${index}`} className="font-medium cursor-pointer">
                          {exploration.label}
                        </label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {exploration.short_description}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No recent discoveries yet. Go explore on the Discover page!
                </p>
              )}
            </div>

            <Button 
              onClick={updatePathWithRecent} 
              disabled={updating || selectedExplorations.length === 0}
              className="w-full"
              size="lg"
            >
              {updating ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Updating your learning path...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Update & Regenerate Learning Path
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}