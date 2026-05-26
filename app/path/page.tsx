'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, BookOpen, Clock, Save, RotateCcw } from 'lucide-react';

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

export default function LearningPathPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [generatedPath, setGeneratedPath] = useState<LearningPath | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Get profile (for interests)
      const { data: prof } = await supabase
        .from('profiles')
        .select('username, interests')
        .eq('id', session.user.id)
        .single();

      setProfile(prof);

      // Load existing saved learning path
      const { data: path } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (path) setCurrentPath(path);

      setLoading(false);
    };

    init();
  }, [supabase, router]);

  const generatePath = async () => {
    if (!profile?.interests || profile.interests.length === 0) {
      alert("Please add some interests in your profile first!");
      return;
    }

    setGenerating(true);
    setGeneratedPath(null);

    try {
      const interestsText = profile.interests.join(', ');

      const prompt = `You are an expert learning path designer.
Create a complete, engaging, and realistic learning path for a student whose interests are: ${interestsText}.

Return ONLY valid JSON with this exact structure (no extra text):

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

Aim for 4-6 modules with 3-6 lessons each. Make it practical and exciting.`;

      const response = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const raw = await response.json();
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

      const newPath: LearningPath = {
        title: parsed.title || "My Personalized Learning Path",
        description: parsed.description || "",
        modules: parsed.modules || [],
        generated_at: new Date().toISOString(),
      };

      setGeneratedPath(newPath);
    } catch (error) {
      console.error(error);
      alert("Failed to generate learning path. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const savePath = async () => {
    if (!generatedPath) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase
        .from('learning_paths')
        .insert({
          user_id: session?.user.id,
          title: generatedPath.title,
          description: generatedPath.description,
          modules: generatedPath.modules,
          generated_at: generatedPath.generated_at,
        });

      if (error) throw error;

      alert("Learning path saved successfully!");
      setCurrentPath({ ...generatedPath, id: 'just-saved' }); // optimistic update
      setGeneratedPath(null);
    } catch (error) {
      console.error(error);
      alert("Failed to save path");
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
            <p className="text-muted-foreground">AI-generated • Personalized • Trackable</p>
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
                {currentPath.modules.map((module: LearningModule, i: number) => (
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
                      {module.lessons.map((lesson, idx) => (
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
        <Card>
          <CardHeader>
            <CardTitle>Generate a New Learning Path</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedPath ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold">{generatedPath.title}</h2>
                  <p className="text-muted-foreground mt-2">{generatedPath.description}</p>
                </div>

                <div className="space-y-6">
                  {generatedPath.modules.map((module: LearningModule, i: number) => (
                    <div key={i} className="border rounded-2xl p-5">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{module.title}</h3>
                        <Badge>{module.estimated_time}</Badge>
                      </div>
                      {module.description && <p className="text-sm mt-2">{module.description}</p>}
                      <ul className="mt-4 list-disc pl-5 space-y-1">
                        {module.lessons.map((lesson, idx) => (
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
                  Based on your interests: <strong>{profile?.interests?.join(', ') || 'None added yet'}</strong>
                </p>
                <Button onClick={generatePath} disabled={generating} size="lg">
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
      </div>
    </div>
  );
}