import { Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
        <div className="flex items-center gap-1 text-primary font-semibold">
          <Zap className="h-4 w-4" />
          <span>Lv.{level}</span>
        </div>
        <div className="flex-1 max-w-24">
          <Progress value={percentage} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Level {level}</p>
            <p className="text-xs text-muted-foreground">{currentXp} / {maxXp} XP</p>
          </div>
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
