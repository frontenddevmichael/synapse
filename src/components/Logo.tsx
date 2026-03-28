import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const SynapseMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="16" cy="8" r="3" className="fill-current" />
    <circle cx="8" cy="24" r="3" className="fill-current" />
    <circle cx="24" cy="24" r="3" className="fill-current" />
    <path
      d="M16 11V16M16 16L10 22M16 16L22 22"
      className="stroke-current"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="2" className="fill-current opacity-60" />
  </svg>
);

export const Logo = ({ size = 'md', showText = true, className }: LogoProps) => {
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="text-primary">
        <SynapseMark className={cn(iconSizes[size])} />
      </div>
      {showText && (
        <span className={cn(
          'font-black uppercase tracking-[0.15em] text-foreground',
          textSizes[size]
        )}>
          Synapse
        </span>
      )}
    </div>
  );
};
