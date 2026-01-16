import { useEffect } from 'react';
import { Trophy, Star, Crown, Target, Flame, Zap, Medal, Clock, Home, Users, X, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AchievementToastProps {
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  onClose: () => void;
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

export function AchievementToast({ name, description, icon, xpReward, onClose }: AchievementToastProps) {
  const Icon = iconMap[icon] || Trophy;

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-lg shadow-xl p-4 flex items-center gap-4 max-w-sm">
        <div className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shrink-0",
          "bg-gradient-to-br from-primary to-accent text-primary-foreground glow"
        )}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary uppercase tracking-wide">Achievement Unlocked!</p>
          <p className="font-semibold truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
          <p className="text-xs text-accent font-medium mt-1">+{xpReward} XP</p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
