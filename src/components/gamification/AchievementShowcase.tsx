import { 
  Trophy, Star, Crown, Target, Flame, Zap, Medal, Clock, Shield, Users,
  TrendingUp, Heart, Calendar, Moon, Sun,
  LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  earned?: boolean;
  earned_at?: string;
}

interface AchievementShowcaseProps {
  achievements: Achievement[];
  userAchievements: string[];
  maxDisplay?: number;
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
  shield: Shield,
  users: Users,
  'trending-up': TrendingUp,
  heart: Heart,
  calendar: Calendar,
  moon: Moon,
  sun: Sun,
};

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  offensive: { 
    bg: 'bg-orange-500/10', 
    border: 'border-orange-500/30', 
    text: 'text-orange-500' 
  },
  defensive: { 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30', 
    text: 'text-blue-400' 
  },
  special: { 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/30', 
    text: 'text-purple-400' 
  },
  general: { 
    bg: 'bg-primary/10', 
    border: 'border-primary/30', 
    text: 'text-primary' 
  },
};

const rarityFromXp = (xp: number): 'common' | 'rare' | 'epic' | 'legendary' => {
  if (xp >= 200) return 'legendary';
  if (xp >= 100) return 'epic';
  if (xp >= 50) return 'rare';
  return 'common';
};

const rarityStyles: Record<string, { ring: string; glow: string; badge: string }> = {
  common: { 
    ring: 'ring-muted', 
    glow: '', 
    badge: 'bg-muted text-muted-foreground' 
  },
  rare: { 
    ring: 'ring-blue-400/50', 
    glow: 'shadow-blue-400/20 shadow-lg', 
    badge: 'bg-blue-500/20 text-blue-400' 
  },
  epic: { 
    ring: 'ring-purple-400/50', 
    glow: 'shadow-purple-400/30 shadow-lg', 
    badge: 'bg-purple-500/20 text-purple-400' 
  },
  legendary: { 
    ring: 'ring-yellow-400/50', 
    glow: 'shadow-yellow-400/40 shadow-xl legendary-glow', 
    badge: 'bg-yellow-500/20 text-yellow-400' 
  },
};

export function AchievementShowcase({ achievements, userAchievements, maxDisplay = 6 }: AchievementShowcaseProps) {
  const earnedAchievements = achievements.filter(a => userAchievements.includes(a.id));
  const displayAchievements = earnedAchievements.slice(0, maxDisplay);
  const remainingCount = Math.max(0, earnedAchievements.length - maxDisplay);

  if (earnedAchievements.length === 0) {
    return (
      <div className="text-center p-6 rounded-lg border border-dashed border-border">
        <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No achievements yet</p>
        <p className="text-xs text-muted-foreground/70">Complete quizzes to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Achievements</h3>
        <span className="text-xs text-muted-foreground">
          {earnedAchievements.length} of {achievements.length} unlocked
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <TooltipProvider delayDuration={0}>
          {displayAchievements.map((achievement) => {
            const Icon = iconMap[achievement.icon] || Trophy;
            const colors = categoryColors[achievement.category] || categoryColors.general;
            const rarity = rarityFromXp(achievement.xp_reward);
            const styles = rarityStyles[rarity];

            return (
              <Tooltip key={achievement.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      'relative h-12 w-12 rounded-xl flex items-center justify-center',
                      'ring-2 transition-all hover:scale-110 cursor-pointer',
                      colors.bg,
                      colors.border,
                      styles.ring,
                      styles.glow
                    )}
                  >
                    <Icon className={cn('h-6 w-6', colors.text)} />
                    
                    {/* Rarity indicator */}
                    {rarity !== 'common' && (
                      <div className={cn(
                        'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                        rarity === 'rare' && 'bg-blue-400',
                        rarity === 'epic' && 'bg-purple-400',
                        rarity === 'legendary' && 'bg-yellow-400 animate-pulse'
                      )} />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{achievement.name}</span>
                      <span className={cn(
                        'text-2xs px-1.5 py-0.5 rounded-full capitalize',
                        styles.badge
                      )}>
                        {rarity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-primary font-medium">+{achievement.xp_reward} XP</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          {remainingCount > 0 && (
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-muted text-muted-foreground text-sm font-medium">
              +{remainingCount}
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

export function TrophyCase({ achievements, userAchievements }: AchievementShowcaseProps) {
  const earnedAchievements = achievements.filter(a => userAchievements.includes(a.id));
  
  const groupedByCategory = earnedAchievements.reduce((acc, achievement) => {
    const category = achievement.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryLabels: Record<string, string> = {
    offensive: '⚔️ Offensive',
    defensive: '🛡️ Defensive',
    special: '✨ Special',
    general: '🏆 General'
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByCategory).map(([category, categoryAchievements]) => (
        <div key={category}>
          <h4 className="text-sm font-medium mb-3">{categoryLabels[category] || category}</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            <TooltipProvider delayDuration={0}>
              {categoryAchievements.map((achievement) => {
                const Icon = iconMap[achievement.icon] || Trophy;
                const colors = categoryColors[category] || categoryColors.general;
                const rarity = rarityFromXp(achievement.xp_reward);
                const styles = rarityStyles[rarity];

                return (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          'aspect-square rounded-lg flex items-center justify-center',
                          'ring-1 transition-all hover:scale-105 cursor-pointer',
                          colors.bg,
                          styles.ring,
                          styles.glow
                        )}
                      >
                        <Icon className={cn('h-5 w-5', colors.text)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      ))}
    </div>
  );
}
