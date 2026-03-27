import { useState, useEffect } from 'react';
import { Clock, FileText, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'upload' | 'quiz_complete';
  username: string;
  detail: string;
  timestamp: string;
}

interface ActivityFeedProps {
  roomId: string;
}

export function ActivityFeed({ roomId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchActivity();
  }, [roomId]);

  const fetchActivity = async () => {
    // Fetch recent document uploads
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, created_at, uploaded_by, profile:profiles!documents_uploaded_by_fkey(username)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent quiz completions
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('id, score, completed_at, user_id, quiz:quizzes!inner(room_id, title), profile:profiles!quiz_attempts_user_id_fkey(username)')
      .eq('quiz.room_id', roomId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);

    const items: ActivityItem[] = [];

    docs?.forEach((d: any) => {
      items.push({
        id: `doc-${d.id}`,
        type: 'upload',
        username: d.profile?.username || 'Someone',
        detail: d.name,
        timestamp: d.created_at,
      });
    });

    attempts?.forEach((a: any) => {
      if (a.completed_at) {
        items.push({
          id: `attempt-${a.id}`,
          type: 'quiz_complete',
          username: a.profile?.username || 'Someone',
          detail: `${a.score}% on ${a.quiz?.title || 'quiz'}`,
          timestamp: a.completed_at,
        });
      }
    });

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(items.slice(0, 8));
  };

  if (activities.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        Recent activity
      </h4>
      <div className="space-y-1">
        {activities.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
            {item.type === 'upload' ? (
              <FileText className="h-3 w-3 shrink-0" />
            ) : (
              <Trophy className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">
              <span className="font-medium text-foreground">{item.username}</span>
              {item.type === 'upload' ? ' uploaded ' : ' scored '}
              <span className="font-medium">{item.detail}</span>
            </span>
            <span className="shrink-0 text-2xs">
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
