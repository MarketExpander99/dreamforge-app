'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateUserProgress(
  contentId: string,
  updates: {
    status?: 'not_started' | 'in_progress' | 'completed';
    progress_percentage?: number;
    time_spent?: number;
    incrementMinutes?: number;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User must be authenticated');

  const timeSpentFinal = updates.time_spent ?? (updates.incrementMinutes || 0);

  const payload = {
    user_id: user.id,
    content_id: contentId,
    status: updates.status || 'in_progress',
    progress_percentage: updates.progress_percentage ?? 100,
    time_spent: timeSpentFinal,
    last_accessed_at: new Date().toISOString(),
    ...(updates.status === 'completed' && { completed_at: new Date().toISOString() }),
  };

  const { error } = await supabase
    .from('user_progress')
    .upsert(payload, { 
      onConflict: 'user_id,content_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('❌ user_progress upsert failed:', error);
    throw new Error(`Progress save failed: ${error.message}`);
  }

  if (updates.status === 'completed') {
    console.log(`🎉 Content ${contentId} marked complete — achievements can trigger here later`);
  }

  revalidatePath('/');
  revalidatePath('/learning');
  revalidatePath('/discover');
  revalidatePath('/feed');

  return { success: true, contentId };
}

export async function markContentComplete(contentId: string) {
  return updateUserProgress(contentId, { 
    status: 'completed', 
    progress_percentage: 100,
    incrementMinutes: 10 
  });
}

export async function recordQuestionAnswer(contentId: string, isCorrect: boolean, minutesSpent = 5) {
  return updateUserProgress(contentId, {
    status: 'in_progress',
    progress_percentage: isCorrect ? 85 : 45,
    incrementMinutes: minutesSpent,
  });
}

export async function completeAIChatSession(contentId: string) {
  return updateUserProgress(contentId, {
    status: 'completed',
    progress_percentage: 100,
    incrementMinutes: 12,
  });
}