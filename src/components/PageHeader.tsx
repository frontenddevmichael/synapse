import { ArrowLeft, LogOut, Home, User as UserIcon, Settings, MailCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PageHeaderProps {
  backTo?: string;
  showBackOnMobile?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({ backTo, showBackOnMobile = false, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, resendConfirmation } = useAuth();
  const { toast } = useToast();

  const initial = (user?.user_metadata?.username || user?.email || '?')
    .toString()
    .charAt(0)
    .toUpperCase();
  const emailVerified = !!user?.email_confirmed_at;

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out' });
    navigate('/');
  };

  const handleResend = async () => {
    if (!user?.email) return;
    const { error } = await resendConfirmation(user.email);
    if (error) toast({ title: 'Failed to resend', description: error.message, variant: 'destructive' });
    else toast({ title: 'Confirmation email sent', description: 'Check your inbox.' });
  };

  const onAuthRoute = location.pathname === '/profile' || location.pathname === '/preferences';

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {showBackOnMobile && backTo && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backTo)}
            className="min-h-[44px] min-w-[44px] sm:hidden"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <button onClick={() => navigate('/dashboard')} className="lg:hidden shrink-0" aria-label="Dashboard">
          <Logo />
        </button>
        {/* Spacer on desktop since DesktopNav already shows the brand */}
        <div className="hidden lg:block" />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {actions}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[40px] min-w-[40px] rounded-full"
              aria-label="Account menu"
            >
              <span className="h-8 w-8 rounded-full bg-primary/15 text-primary font-bold text-sm flex items-center justify-center">
                {initial}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold truncate">
                  {user?.user_metadata?.username || 'Account'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                {!emailVerified && user?.email && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleResend(); }}
                    className="text-[11px] text-warning mt-1 inline-flex items-center gap-1 hover:underline self-start"
                  >
                    <MailCheck className="h-3 w-3" />
                    Email not verified — resend
                  </button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/?landing=1')}>
              <Home className="h-4 w-4 mr-2" /> Home
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/profile')} disabled={onAuthRoute && location.pathname === '/profile'}>
              <UserIcon className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/preferences')} disabled={onAuthRoute && location.pathname === '/preferences'}>
              <Settings className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
