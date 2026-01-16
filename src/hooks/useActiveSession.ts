import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseActiveSessionProps {
  quizId: string;
  roomId: string;
  enabled: boolean;
}

export function useActiveSession({ quizId, roomId, enabled }: UseActiveSessionProps) {
  const { user } = useAuth();
  const sessionId = useRef<string | null>(null);

  const startSession = useCallback(async () => {
    if (!user || !enabled) return;

    const { data, error } = await supabase
      .from('active_sessions')
      .upsert({
        user_id: user.id,
        quiz_id: quizId,
        room_id: roomId,
        current_question: 0,
        answers_count: 0,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      }, {
        onConflict: 'user_id,quiz_id'
      })
      .select()
      .single();

    if (!error && data) {
      sessionId.current = data.id;
    }
  }, [user, quizId, roomId, enabled]);

  const updateProgress = useCallback(async (currentQuestion: number, answersCount: number) => {
    if (!user || !enabled) return;

    await supabase
      .from('active_sessions')
      .update({
        current_question: currentQuestion,
        answers_count: answersCount,
        last_activity: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('quiz_id', quizId);
  }, [user, quizId, enabled]);

  const endSession = useCallback(async () => {
    if (!user) return;

    await supabase
      .from('active_sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('quiz_id', quizId);

    sessionId.current = null;
  }, [user, quizId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId.current && user) {
        supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('quiz_id', quizId);
      }
    };
  }, [quizId, user]);

  return {
    startSession,
    updateProgress,
    endSession
  };
}
