import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Brain, Bookmark, User, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="hidden sm:flex items-center gap-1 ml-6">
      {navItems.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="ml-2 text-muted-foreground hover:text-destructive gap-1.5"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden lg:inline">Sign out</span>
      </Button>
    </nav>
  );
}
