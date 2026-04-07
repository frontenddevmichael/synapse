import { Home, Bookmark, Brain, User, Settings, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Rooms' },
  { path: '/recall', icon: Brain, label: 'Recall' },
  { path: '/bookmarks', icon: Bookmark, label: 'Deck' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/preferences', icon: Settings, label: 'Settings' },
];

export function DesktopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname.startsWith('/room/');
    return location.pathname === path;
  };

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-border/40 bg-background/50 backdrop-blur-sm shrink-0">
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => (
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
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border/40">
        <button
          onClick={async () => { await signOut(); navigate('/auth'); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
