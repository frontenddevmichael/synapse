import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  backTo?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ backTo = '/dashboard', actions }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(backTo)}
          className="min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Logo />
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
