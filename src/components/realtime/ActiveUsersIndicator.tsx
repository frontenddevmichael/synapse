import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ActiveUser {
  user_id: string;
  username: string;
  current_question: number;
  answers_count: number;
}

interface ActiveUsersIndicatorProps {
  quizId: string;
  roomId: string;
  className?: string;
}

export function ActiveUsersIndicator({ quizId, roomId, className }: ActiveUsersIndicatorProps) {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    // Fetch initial active sessions
    const fetchActiveSessions = async () => {
      const { data } = await supabase
        .from('active_sessions')
        .select(`
          user_id,
          current_question,
          answers_count,
          profile:profiles(username)
        `)
        .eq('quiz_id', quizId)
        .neq('user_id', user?.id || '');

      if (data) {
        const users = data.map((s: any) => ({
          user_id: s.user_id,
          username: s.profile?.username || 'Unknown',
          current_question: s.current_question,
          answers_count: s.answers_count
        }));
        setActiveUsers(users);
      }
    };

    fetchActiveSessions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`active-sessions-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `quiz_id=eq.${quizId}`
        },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizId, user?.id]);

  if (activeUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-sm",
            className
          )}>
            <div className="relative">
              <Users className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-success pulse-live" />
            </div>
            <span>{activeUsers.length} active</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <p className="font-medium">Taking this quiz now:</p>
            {activeUsers.map(u => (
              <p key={u.user_id} className="text-sm text-muted-foreground">
                {u.username} - Q{u.current_question + 1} ({u.answers_count} answered)
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
