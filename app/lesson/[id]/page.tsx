'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/user-context';
import { progressUtils } from '@/lib/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, Search } from 'lucide-react';

// Types matching the exact structure returned by lesson-cards mode in Phase 1
interface LessonCard {
  id: string;
  title: string;
  content: string;
}

interface Lesson {
  id: string;
  title: string;
  summary?: string;
  cards: LessonCard[];
  grade_level?: string;
  difficulty?: string;
  tags?: string[];
}

export default function LessonCardPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, authLoading } = useAuth();

  const lessonIdParam = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth guard - follow exact pattern from discover page
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Load lesson data from localStorage (bridge until persistence is added) + resume from user_progress
  useEffect(() => {
    const loadLessonAndProgress = async () => {
      if (!lessonIdParam || !user) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const storageKey = `lesson-data-${lessonIdParam}`;
        const stored = localStorage.getItem(storageKey);

        if (!stored) {
          setError('Lesson data not found for this ID. Generate a lesson using mode "lesson-cards" and load it to begin.');
          setLoading(false);
          return;
        }

        const parsed: Lesson = JSON.parse(stored);

        if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
          setError('Invalid lesson data: no cards present.');
          setLoading(false);
          return;
        }

        setLesson(parsed);

        // Determine resume position by checking which cards have been completed in user_progress
        let resumeIndex = 0;
        for (let i = 0; i < parsed.cards.length; i++) {
          const card = parsed.cards[i];
          try {
            const prog = await progressUtils.getProgress(card.id);
            const isCompleted = !!(prog && (prog.status === 'completed' || (prog.progress_percentage ?? 0) >= 100));
            if (!isCompleted) {
              resumeIndex = i;
              break;
            }
            if (i === parsed.cards.length - 1) {
              // All cards were completed
              resumeIndex = parsed.cards.length;
            }
          } catch (progErr) {
            // On any progress lookup issue, start at current card safely
            console.warn('Progress check failed for card, starting at 0', progErr);
            resumeIndex = 0;
            break;
          }
        }

        if (resumeIndex >= parsed.cards.length) {
          setCurrentIndex(Math.max(0, parsed.cards.length - 1));
          setAllCompleted(true);
        } else {
          setCurrentIndex(resumeIndex);
          setAllCompleted(false);
        }
      } catch (err) {
        console.error('Lesson load error:', err);
        setError('Failed to load the lesson. Please try generating it again.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      loadLessonAndProgress();
    }
  }, [lessonIdParam, user, authLoading]);

  const totalCards = lesson?.cards.length ?? 0;
  const currentCard = lesson && currentIndex < totalCards ? lesson.cards[currentIndex] : null;
  const progressPercent = totalCards > 0
    ? Math.round(((currentIndex + (allCompleted ? 1 : 0)) / totalCards) * 100)
    : 0;

  const handleCompleteCard = async () => {
    if (!lesson || !currentCard || advancing) return;

    setAdvancing(true);

    try {
      // Use existing progress pattern exactly (lib/progress.ts + update API under the hood)
      await progressUtils.markAsCompleted(currentCard.id);

      const next = currentIndex + 1;
      if (next < totalCards) {
        setCurrentIndex(next);
      } else {
        setAllCompleted(true);
      }
    } catch (err) {
      console.error('Failed to record card completion:', err);
      // Advance anyway so the user is not stuck (progress will still be queryable on refresh)
      const next = currentIndex + 1;
      if (next < totalCards) {
        setCurrentIndex(next);
      } else {
        setAllCompleted(true);
      }
    } finally {
      setAdvancing(false);
    }
  };

  const handleStartAnother = () => router.push('/discover');
  const handleBackToDiscover = () => router.push('/discover');
  const handleAddToPath = () => router.push('/path');

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Preparing your lesson cards…</p>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (error || !lesson) {
    return (
      <div className="max-w-lg mx-auto p-6 pt-12">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">{error || 'Lesson not available.'}</p>
            <div className="flex justify-center">
              <Button onClick={handleBackToDiscover} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Discover
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: After generating with mode=lesson-cards, store the lesson in localStorage as <code>lesson-data-{'{id}'}</code> for testing this player.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exact end state required
  if (allCompleted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="space-y-3">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
          <p className="text-2xl font-semibold tracking-tight">
            All discovery cards completed, search for a new lesson to add.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={handleStartAnother} variant="success" size="lg">
            Start another lesson
          </Button>
          <Button onClick={handleBackToDiscover} variant="outline" size="lg">
            Back to Discover
          </Button>
          <Button onClick={handleAddToPath} variant="outline" size="lg">
            Add to my path
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">Your progress was saved automatically.</p>
      </div>
    );
  }

  // Active sequential player — one card visible, only the green button advances
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Minimal focused header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{lesson.title}</h1>
          {lesson.summary && (
            <p className="mt-1 text-muted-foreground line-clamp-2">{lesson.summary}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleBackToDiscover} className="shrink-0">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Discover
        </Button>
      </div>

      {/* Progress indicator: "Card X of Y" */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span className="text-muted-foreground">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Single active card */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/40 border-b">
          <CardTitle className="text-xl leading-tight">{currentCard?.title}</CardTitle>
        </CardHeader>

        <CardContent className="pt-6 pb-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none text-[15px] leading-relaxed whitespace-pre-wrap">
            {currentCard?.content}
          </div>
        </CardContent>

        {/* Only action: the green button */}
        <div className="border-t bg-muted/30 px-6 py-5">
          <Button
            onClick={handleCompleteCard}
            disabled={advancing}
            variant="success"
            size="lg"
            className="w-full sm:w-auto px-8"
          >
            {advancing ? 'Saving progress…' : 'Complete this card & continue →'}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            This is the only button that advances the lesson.
          </p>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Refresh the page anytime — you will resume at the next uncompleted card.
      </p>
    </div>
  );
}
