'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { markContentComplete, recordQuestionAnswer, completeAIChatSession } from '@/lib/progress-utils';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedCardProps {
  id: string;
  title: string;
  type: 'lesson' | 'qa' | 'quiz' | 'ai-chat';
  description: string;
  // Optional callback so parent can react (e.g. re-fetch authoritative feed list or optimistic remove)
  onCompleted?: (id: string) => void;
}

export default function FeedCard({ id, title, type, description, onCompleted }: FeedCardProps) {
  const [loading, setLoading] = useState(false);
  // Local isCompleted for optimistic hide (spec requirement: instant feedback even before revalidation)
  const [isCompleted, setIsCompleted] = useState(false);

  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      await markContentComplete(id);
      setIsCompleted(true);
      toast.success(`🎉 ${title} marked complete • Progress saved to user_progress`);
      if (onCompleted) onCompleted(id);
    } catch (err: any) {
      toast.error('Save failed — check console');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAnswer = async (correct: boolean) => {
    setLoading(true);
    try {
      await recordQuestionAnswer(id, correct);
      const msg = correct ? '✅ Correct! Progress updated' : '📈 Answer recorded • Keep going';
      toast.success(msg);
      // For quiz correctness we do not auto-complete the card here (parent decides)
    } catch (err) {
      toast.error('Write blocked — progress-utils active');
    } finally {
      setLoading(false);
    }
  };

  const handleAIChatDone = async () => {
    setLoading(true);
    try {
      await completeAIChatSession(id);
      setIsCompleted(true);
      toast.success('💬 AI chat counted • user_progress updated');
      if (onCompleted) onCompleted(id);
    } catch (err) {
      toast.error('Error — verify auth & table RLS');
    } finally {
      setLoading(false);
    }
  };

  // Optimistic hide of the entire card after completion (framer exit friendly)
  if (isCompleted) {
    return null;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base flex justify-between items-center">
            {title}
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">{type}</span>
          </CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button 
            onClick={handleMarkComplete} 
            disabled={loading}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            ✅ Mark as Complete
          </Button>

          {type === 'quiz' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleTestAnswer(true)} disabled={loading}>
                ✅ Right
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleTestAnswer(false)} disabled={loading}>
                ❌ Wrong
              </Button>
            </>
          )}

          {type === 'ai-chat' && (
            <Button variant="secondary" size="sm" onClick={handleAIChatDone} disabled={loading}>
              💬 Finish Chat
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.alert('Opened in full learning view (placeholder)')}
          >
            View
          </Button>
        </CardContent>
        <p className="px-5 pb-4 text-[10px] text-zinc-400">Progress saved to Supabase</p>
      </Card>
    </motion.div>
  );
}