import { Flame, Zap, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  type: 'hot' | 'daily';
  count: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function StreakCounter({ 
  type, 
  count, 
  label, 
  size = 'md',
  animated = true 
}: StreakCounterProps) {
  const getStreakColor = () => {
    if (type === 'hot') {
      if (count >= 20) return 'from-purple-500 via-pink-500 to-red-500';
      if (count >= 10) return 'from-red-500 via-orange-500 to-yellow-500';
      if (count >= 5) return 'from-orange-400 to-yellow-400';
      return 'from-amber-400 to-orange-400';
    }
    // Daily streak
    if (count >= 30) return 'from-violet-500 via-purple-500 to-indigo-500';
    if (count >= 14) return 'from-blue-500 via-cyan-500 to-teal-500';
    if (count >= 7) return 'from-emerald-400 to-teal-400';
    return 'from-green-400 to-emerald-400';
  };

  const sizeClasses = {
    sm: 'h-8 px-2 gap-1 text-xs',
    md: 'h-10 px-3 gap-2 text-sm',
    lg: 'h-12 px-4 gap-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const Icon = type === 'hot' ? Flame : Zap;

  return (
    <div 
      className={cn(
        'relative inline-flex items-center rounded-full font-semibold',
        'bg-gradient-to-r text-white shadow-md',
        getStreakColor(),
        sizeClasses[size],
        animated && count > 0 && 'streak-pulse'
      )}
    >
      <Icon className={cn(iconSizes[size], animated && count >= 5 && 'animate-bounce-subtle')} />
      <span>{count}</span>
      {label && <span className="text-white/80 font-normal">{label}</span>}
      
      {/* Fire particles for hot streaks */}
      {animated && type === 'hot' && count >= 10 && (
        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <span 
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full opacity-75 animate-particle"
              style={{
                left: `${20 + i * 30}%`,
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StreakBadgeEnhancedProps {
  offensiveStreak: number;
  defensiveStreak: number;
  dailyStreak: number;
  hasStreakFreeze?: boolean;
  compact?: boolean;
}

export function StreakBadgeEnhanced({
  offensiveStreak,
  defensiveStreak,
  dailyStreak,
  hasStreakFreeze = false,
  compact = false
}: StreakBadgeEnhancedProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {dailyStreak > 0 && <StreakCounter type="daily" count={dailyStreak} size="sm" />}
        {offensiveStreak > 0 && <StreakCounter type="hot" count={offensiveStreak} size="sm" />}
        {hasStreakFreeze && (
          <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-blue-400" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border">
      <h3 className="text-sm font-medium text-muted-foreground">Active Streaks</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <StreakCard
          icon={Zap}
          label="Daily Streak"
          value={dailyStreak}
          color="emerald"
          description="Days in a row"
        />
        <StreakCard
          icon={Flame}
          label="Hot Streak"
          value={offensiveStreak}
          color="orange"
          description="Correct answers"
        />
        {defensiveStreak > 0 && (
          <StreakCard
            icon={Shield}
            label="Defensive"
            value={defensiveStreak}
            color="blue"
            description="80%+ accuracy days"
          />
        )}
        {hasStreakFreeze && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Streak Freeze Ready</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface StreakCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'emerald' | 'orange' | 'blue' | 'purple';
  description: string;
}

function StreakCard({ icon: Icon, label, value, color, description }: StreakCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
  };

  return (
    <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-60">{description}</div>
    </div>
  );
}
