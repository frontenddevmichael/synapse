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
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
      isActive 
        ? "bg-warning/10 text-warning" 
        : "bg-muted text-muted-foreground",
      className
    )}>
      <Flame className={cn("h-4 w-4", isActive && "animate-pulse")} />
      <span>{days} day{days !== 1 ? 's' : ''}</span>
    </div>
  );
}
