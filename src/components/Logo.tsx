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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="2" className="fill-current opacity-60" />
  </svg>
);

export const Logo = ({ size = 'md', showText = true, className }: LogoProps) => {
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="text-primary">
        <SynapseMark className={cn(iconSizes[size])} />
      </div>
      {showText && (
        <span className={cn(
          'font-bold tracking-tighter text-foreground',
          textSizes[size]
        )}>
          Synapse
        </span>
      )}
    </div>
  );
};
