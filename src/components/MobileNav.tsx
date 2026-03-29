import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Bookmark, User, Settings, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const baseNavItems = [
  { path: '/dashboard', icon: Home, label: 'Rooms' },
  { path: '/recall', icon: Brain, label: 'Recall' },
  { path: '/bookmarks', icon: Bookmark, label: 'Deck' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/preferences', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('recall_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString())
      .then(({ count }) => {
        setDueCount(count || 0);
      });
  }, [user]);

  const isActive = (path: string) => {
    if (path.includes('?')) return location.pathname + location.search === path;
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-background/90 backdrop-blur-md border-t border-border/40 pb-safe">
      <div className="flex items-center justify-around h-14">
        {baseNavItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path.split('?')[0])}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {path === '/recall' && dueCount > 0 && (
                <span className="absolute top-1 right-1/4 h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {dueCount > 99 ? '99+' : dueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
