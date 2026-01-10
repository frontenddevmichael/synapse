import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = 'md', showText = true, className }: LogoProps) => {
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <Brain className={cn(iconSizes[size], 'text-primary')} />
        <div className="absolute inset-0 blur-sm opacity-50">
          <Brain className={cn(iconSizes[size], 'text-primary')} />
        </div>
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight gradient-text', textSizes[size])}>
          Synapse
        </span>
      )}
    </div>
  );
};
