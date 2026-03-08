import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  days: number;
  className?: string;
}

export function StreakBadge({ days, className }: StreakBadgeProps) {
  const isActive = days > 0;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold",
      isActive
        ? "bg-warning/10 text-warning border border-warning/20"
        : "bg-muted text-muted-foreground",
      isActive && "streak-pulse",
      className
    )}>
      <Flame className={cn("h-4 w-4", isActive && "animate-bounce-subtle")} />
      <span>{days}</span>
    </div>
  );
}
