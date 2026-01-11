import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizTimerProps {
  timeLimitMinutes: number;
  startedAt: string;
  onTimeUp: () => void;
  isActive: boolean;
}

export const QuizTimer = ({ timeLimitMinutes, startedAt, onTimeUp, isActive }: QuizTimerProps) => {
  const calculateTimeRemaining = useCallback(() => {
    const startTime = new Date(startedAt).getTime();
    const endTime = startTime + timeLimitMinutes * 60 * 1000;
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    return remaining;
  }, [startedAt, timeLimitMinutes]);

  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, calculateTimeRemaining, onTimeUp]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLowTime = timeRemaining <= 60;
  const isCriticalTime = timeRemaining <= 30;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-medium transition-colors',
        isCriticalTime && 'bg-destructive/20 text-destructive animate-pulse',
        isLowTime && !isCriticalTime && 'bg-warning/20 text-warning',
        !isLowTime && 'bg-muted text-foreground'
      )}
    >
      {isCriticalTime ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};
