import { useState, useEffect } from 'react';
import { Swords, Shield, Trophy, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BattleAnimationProps {
  opponentName: string;
  yourScore: number;
  opponentScore: number;
  isWin: boolean;
  onComplete?: () => void;
}

export function BattleAnimation({
  opponentName,
  yourScore,
  opponentScore,
  isWin,
  onComplete
}: BattleAnimationProps) {
  const [phase, setPhase] = useState<'intro' | 'battle' | 'result'>('intro');

  useEffect(() => {
    const introTimer = setTimeout(() => setPhase('battle'), 1000);
    const battleTimer = setTimeout(() => setPhase('result'), 2500);
    const completeTimer = setTimeout(() => onComplete?.(), 4500);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(battleTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 text-center">
        {phase === 'intro' && (
          <div className="animate-scale-in">
            <Swords className="h-16 w-16 mx-auto text-warning mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Battle Complete!</h2>
            <p className="text-muted-foreground">vs {opponentName}</p>
          </div>
        )}

        {phase === 'battle' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-right">
                <p className="text-sm text-muted-foreground mb-1">You</p>
                <div className="text-4xl font-bold text-primary animate-count-up">
                  {yourScore}%
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Swords className="h-10 w-10 text-muted-foreground/50 animate-pulse" />
                </div>
                <span className="text-xl font-bold text-muted-foreground">VS</span>
              </div>
              
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground mb-1">{opponentName}</p>
                <div className="text-4xl font-bold text-muted-foreground animate-count-up">
                  {opponentScore}%
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className={cn(
            'animate-scale-in space-y-4',
            isWin ? 'text-success' : 'text-muted-foreground'
          )}>
            {isWin ? (
              <>
                <Trophy className="h-20 w-20 mx-auto animate-bounce text-warning" />
                <h2 className="text-3xl font-bold">Victory!</h2>
                <p className="text-muted-foreground">You defeated {opponentName}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning">
                  <Star className="h-4 w-4" />
                  <span className="font-semibold">+50 XP Bonus</span>
                </div>
              </>
            ) : (
              <>
                <Shield className="h-20 w-20 mx-auto opacity-50" />
                <h2 className="text-3xl font-bold">Defeated</h2>
                <p>{opponentName} won this round</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Keep practicing!</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface LivePositionIndicatorProps {
  position: number;
  total: number;
  change?: 'up' | 'down' | 'none';
}

export function LivePositionIndicator({ position, total, change = 'none' }: LivePositionIndicatorProps) {
  const getPositionColor = () => {
    if (position === 1) return 'bg-warning text-warning-foreground';
    if (position === 2) return 'bg-muted text-foreground';
    if (position === 3) return 'bg-orange-600/80 text-white';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-sm',
      getPositionColor(),
      change !== 'none' && 'animate-pulse'
    )}>
      <span className="font-bold">#{position}</span>
      <span className="text-xs opacity-80">of {total}</span>
      {change === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
      {change === 'down' && <TrendingUp className="h-3 w-3 text-destructive rotate-180" />}
    </div>
  );
}
