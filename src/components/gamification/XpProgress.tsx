import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XpProgressProps {
  level: number;
  currentXp: number;
  maxXp: number;
  percentage: number;
  className?: string;
  compact?: boolean;
}

export function XpProgress({ level, currentXp, maxXp, percentage, className, compact = false }: XpProgressProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
          <Zap className="h-4 w-4" />
          <span>Lv.{level}</span>
        </div>
        <div className="flex-1 max-w-24 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary xp-fill" style={{ '--xp-target': `${percentage}%` } as any} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-bold text-lg">Level {level}</p>
            <p className="text-sm text-muted-foreground font-mono">{currentXp} / {maxXp} XP</p>
          </div>
        </div>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary xp-fill transition-all" style={{ '--xp-target': `${percentage}%` } as any} />
      </div>
    </div>
  );
}
