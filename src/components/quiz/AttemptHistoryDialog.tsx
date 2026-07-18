import { useState, useEffect } from 'react';
import { Clock, Target, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

interface Attempt {
  id: string;
  score: number | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  total_questions: number | null;
}

interface AttemptHistoryDialogProps {
  quizId: string;
  quizTitle: string;
}

export function AttemptHistoryDialog({ quizId, quizTitle }: AttemptHistoryDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from('quiz_attempts')
      .select('id, score, status, started_at, completed_at, total_questions')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAttempts(data as Attempt[]);
        setLoading(false);
      });
  }, [open, quizId, user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          <Clock className="h-3.5 w-3.5" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Attempt History</DialogTitle>
          <DialogDescription className="text-sm">{quizTitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))
          ) : attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No attempts yet</p>
          ) : (
            attempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === 'completed' ? 'default' : 'outline'} className="text-[10px]">
                      {a.status}
                    </Badge>
                    {a.score != null && (
                      <span className="text-sm font-bold">{Math.round(a.score)}%</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {a.started_at ? new Date(a.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {a.total_questions && (
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {a.total_questions} Q
                    </span>
                  )}
                  {a.score != null && a.score >= 80 ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : a.score != null ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
