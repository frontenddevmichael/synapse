import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseQuizTimerProps {
  timeLimitMinutes: number | null;
  startedAt: string | null;
  isActive: boolean;
  onTimeUp: () => void;
}

export const useQuizTimer = ({
  timeLimitMinutes,
  startedAt,
  isActive,
  onTimeUp,
}: UseQuizTimerProps) => {
  const { toast } = useToast();
  const [hasWarned, setHasWarned] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    if (!timeLimitMinutes || !startedAt) return null;
    
    const startTime = new Date(startedAt).getTime();
    const endTime = startTime + timeLimitMinutes * 60 * 1000;
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    return remaining;
  }, [startedAt, timeLimitMinutes]);

  useEffect(() => {
    if (!isActive || !timeLimitMinutes || !startedAt) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      if (remaining === null) return;

      // Warn when 1 minute left
      if (remaining === 60 && !hasWarned) {
        setHasWarned(true);
        toast({
          title: '⏰ 1 minute remaining!',
          description: 'Hurry up and finish your quiz.',
          variant: 'destructive',
        });
      }

      if (remaining <= 0) {
        clearInterval(interval);
        toast({
          title: "⏱️ Time's up!",
          description: 'Your quiz has been auto-submitted.',
          variant: 'destructive',
        });
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, calculateTimeRemaining, onTimeUp, hasWarned, toast, timeLimitMinutes, startedAt]);

  return {
    timeRemaining: calculateTimeRemaining(),
    hasTimeLimit: !!timeLimitMinutes,
  };
};
