import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Bookmark, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Rooms' },
  { path: '/dashboard?tab=analytics', icon: BarChart3, label: 'Progress' },
  { path: '/bookmarks', icon: Bookmark, label: 'Deck' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/preferences', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path.includes('?')) return location.pathname + location.search === path;
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-background/90 backdrop-blur-md border-t border-border/40 pb-safe">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path.split('?')[0])}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
