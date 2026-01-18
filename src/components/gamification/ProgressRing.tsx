import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  color?: 'primary' | 'accent' | 'success' | 'warning';
  showValue?: boolean;
  label?: string;
  animated?: boolean;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  max = 100,
  size = 'md',
  strokeWidth,
  color = 'primary',
  showValue = true,
  label,
  animated = true,
  children
}: ProgressRingProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizeConfig = {
    sm: { dimension: 48, defaultStroke: 4, fontSize: 'text-xs' },
    md: { dimension: 64, defaultStroke: 5, fontSize: 'text-sm' },
    lg: { dimension: 96, defaultStroke: 6, fontSize: 'text-lg' },
    xl: { dimension: 128, defaultStroke: 8, fontSize: 'text-2xl' }
  };

  const config = sizeConfig[size];
  const actualStrokeWidth = strokeWidth || config.defaultStroke;
  const radius = (config.dimension - actualStrokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'text-primary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning'
  };

  const gradientId = useMemo(() => `gradient-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={config.dimension}
        height={config.dimension}
        className={cn('transform -rotate-90', animated && 'transition-all duration-500')}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          strokeWidth={actualStrokeWidth}
          className="fill-none stroke-muted"
        />
        
        {/* Progress circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          strokeWidth={actualStrokeWidth}
          className={cn('fill-none transition-all duration-700 ease-out', colorClasses[color])}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: animated ? strokeDashoffset : 0,
            strokeLinecap: 'round',
            stroke: `url(#${gradientId})`
          }}
        />
        
        {/* Glow effect for high values */}
        {percentage >= 75 && (
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            strokeWidth={actualStrokeWidth + 4}
            className={cn('fill-none opacity-20', colorClasses[color])}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              strokeLinecap: 'round',
              filter: 'blur(4px)'
            }}
          />
        )}
      </svg>
      
      {/* Center content */}
      <div className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        config.fontSize
      )}>
        {children ? children : (
          <>
            {showValue && (
              <span className="font-bold">{Math.round(percentage)}%</span>
            )}
            {label && (
              <span className="text-2xs text-muted-foreground">{label}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface DailyGoalRingProps {
  completed: number;
  goal: number;
  label?: string;
}

export function DailyGoalRing({ completed, goal, label = 'Daily Goal' }: DailyGoalRingProps) {
  const percentage = Math.min((completed / goal) * 100, 100);
  const isComplete = completed >= goal;

  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing
        value={percentage}
        color={isComplete ? 'success' : 'accent'}
        size="lg"
        showValue={false}
      >
        <div className="text-center">
          <div className="text-xl font-bold">
            {completed}/{goal}
          </div>
          <div className="text-2xs text-muted-foreground">quizzes</div>
        </div>
      </ProgressRing>
      
      <div className="text-center">
        <div className="text-sm font-medium">{label}</div>
        {isComplete && (
          <div className="text-xs text-success">✓ Complete!</div>
        )}
      </div>
    </div>
  );
}
