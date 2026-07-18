import { useState, useEffect } from 'react';
import { Home, Brain, Bookmark, User, Settings, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const studyItems = [
  { path: '/dashboard', icon: Home, label: 'Rooms' },
  { path: '/recall', icon: Brain, label: 'Recall', badge: 'recall' as const },
  { path: '/bookmarks', icon: Bookmark, label: 'Deck', badge: 'bookmarks' as const },
];

const accountItems = [
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/preferences', icon: Settings, label: 'Settings' },
];

export function DesktopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [recallDue, setRecallDue] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('recall_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString())
      .then(({ count }) => setRecallDue(count || 0));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('bookmarked_questions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setBookmarkCount(count || 0));
  }, [user]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname.startsWith('/room/');
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out' });
    navigate('/');
  };

  const initial = (user?.user_metadata?.username || user?.email || '?')
    .toString()
    .charAt(0)
    .toUpperCase();

  const renderNavItem = ({ path, icon: Icon, label, badge }: typeof studyItems[number]) => (
    <button
      key={path}
      onClick={() => navigate(path)}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        isActive(path)
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate flex-1 text-left">{label}</span>
      {badge === 'recall' && recallDue > 0 && (
        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {recallDue > 99 ? '99+' : recallDue}
        </span>
      )}
      {badge === 'bookmarks' && bookmarkCount > 0 && (
        <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-muted-foreground/20 text-muted-foreground text-[10px] font-bold flex items-center justify-center">
          {bookmarkCount}
        </span>
      )}
    </button>
  );

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/40 bg-background/50 backdrop-blur-sm">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center px-5 h-16 border-b border-border/40 hover:bg-muted/30 transition-colors shrink-0"
        aria-label="Dashboard"
      >
        <Logo size="lg" />
      </button>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">
          Study
        </p>
        {studyItems.map(renderNavItem)}

        <p className="px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">
          Account
        </p>
        {accountItems.map(renderNavItem)}
      </nav>

      <div className="p-3 border-t border-border/40 flex items-center gap-2.5 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0 hover:bg-primary/25 transition-colors">
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-semibold truncate">{user?.user_metadata?.username || 'Account'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" /> Profile
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
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{user?.user_metadata?.username || 'Account'}</p>
          <p className="text-[11px] text-muted-foreground truncate leading-tight">{user?.email}</p>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}