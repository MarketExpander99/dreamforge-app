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
    <Card className="w-full border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="text-lg flex justify-between">
          {title}
          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">{type}</span>
        </CardTitle>
        <p className="text-sm text-zinc-500">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button 
          onClick={handleMarkComplete} 
          disabled={loading}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          ✅ Mark as Complete + Save
        </Button>

        {type === 'quiz' && (
          <>
            <Button variant="outline" size="sm" onClick={() => handleTestAnswer(true)} disabled={loading}>
              ✅ Right Answer
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleTestAnswer(false)} disabled={loading}>
              ❌ Wrong Answer
            </Button>
          </>
        )}

        {type === 'ai-chat' && (
          <Button variant="secondary" size="sm" onClick={handleAIChatDone} disabled={loading}>
            💬 Finish AI Chat Session
          </Button>
        )}

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.alert('Opened in full learning view (placeholder)')}
        >
          View Full
        </Button>
      </CardContent>
      <p className="px-6 pb-4 text-[10px] text-zinc-400">Progress now writes live • Check Supabase user_progress</p>
    </Card>
  );
}