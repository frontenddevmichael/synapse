import { ArrowLeft, LogOut, Home, User as UserIcon, Settings, MailCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  backTo?: string;
  title?: string;
  actions?: React.ReactNode;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Rooms',
  '/recall': 'Recall',
  '/bookmarks': 'Deck',
  '/profile': 'Profile',
  '/preferences': 'Settings',
};

export function PageHeader({ backTo, title, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, resendConfirmation } = useAuth();
  const { toast } = useToast();

  const pageTitle = title || routeTitles[location.pathname] || '';

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

  return (
    <header className="lg:hidden flex items-center justify-between px-4 h-12 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {backTo && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backTo)}
            className="h-8 w-8 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        {pageTitle && (
          <h1 className="text-sm font-semibold truncate">{pageTitle}</h1>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {actions}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label="Account menu"
            >
              <span className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center">
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
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserIcon className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/preferences')}>
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
