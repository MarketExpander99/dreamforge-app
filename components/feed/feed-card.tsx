'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { markContentComplete, recordQuestionAnswer, completeAIChatSession } from '@/lib/progress-utils';
import { toast } from 'sonner';
import { useState } from 'react';

interface FeedCardProps {
  id: string;
  title: string;
  type: 'lesson' | 'quiz' | 'ai-chat';
  description: string;
}

export default function FeedCard({ id, title, type, description }: FeedCardProps) {
  const [loading, setLoading] = useState(false);

  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      await markContentComplete(id);
      toast.success(`🎉 ${title} marked complete • Progress saved to user_progress`);
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
      toast.success(correct ? '✅ Correct! Progress updated' : '📈 Answer recorded • Keep going');
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
      toast.success('💬 AI chat counted • user_progress updated');
    } catch (err) {
      toast.error('Error — verify auth & table RLS');
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}