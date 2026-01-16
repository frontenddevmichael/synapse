import { 
  Trophy, Star, Crown, Target, Flame, Zap, Medal, Clock, Home, Users,
  LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AchievementBadgeProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  xpReward: number;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  star: Star,
  crown: Crown,
  target: Target,
  flame: Flame,
  zap: Zap,
  medal: Medal,
  clock: Clock,
  home: Home,
  users: Users,
};

export function AchievementBadge({
  name,
  description,
  icon,
  earned,
  earnedAt,
  xpReward,
  size = 'md'
}: AchievementBadgeProps) {
  const Icon = iconMap[icon] || Trophy;
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "rounded-full flex items-center justify-center transition-all",
              sizeClasses[size],
              earned
                ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg glow"
                : "bg-muted text-muted-foreground opacity-50 grayscale"
            )}
          >
            <Icon className={iconSizes[size]} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            <p className="text-xs text-primary">+{xpReward} XP</p>
            {earned && earnedAt && (
              <p className="text-xs text-muted-foreground">
                Earned {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
