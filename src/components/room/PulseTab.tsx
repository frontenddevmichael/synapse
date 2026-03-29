import { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, BarChart3, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getMemberActivity, getWeakQuestions, getUntouchedDocuments, getDifficultyCurve } from '@/utils/pulse';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

interface PulseTabProps {
  roomId: string;
  ownerId: string;
  currentUserId: string;
}

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getDifficultyLabel(score: number | null) {
  if (score === null) return { label: 'No data', class: 'text-muted-foreground' };
  if (score < 50) return { label: 'Struggling', class: 'text-destructive' };
  if (score < 75) return { label: 'Developing', class: 'text-warning' };
  return { label: 'Solid', class: 'text-success' };
}

export function PulseTab({ roomId, ownerId, currentUserId }: PulseTabProps) {
  const navigate = useNavigate();
  const [memberActivity, setMemberActivity] = useState<any[]>([]);
  const [weakQuestions, setWeakQuestions] = useState<any[]>([]);
  const [untouched, setUntouched] = useState<any[]>([]);
  const [curve, setCurve] = useState<any>({ easy: null, medium: null, hard: null });
  const [isLoading, setIsLoading] = useState(true);
  const isNonOwner = currentUserId !== ownerId;

  useEffect(() => {
    if (isNonOwner) return;
    loadData();
    const channel = supabase
      .channel(`pulse-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quiz_attempts' },
        () => {
          // Re-fetch member activity only
          getMemberActivity(roomId).then(setMemberActivity);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, isNonOwner]);

  // Guard: non-owner sees nothing
  if (isNonOwner) {
    return (
      <div className="bento-card py-16 flex flex-col items-center text-center">
        <p className="text-muted-foreground">Nothing to see here.</p>
      </div>
    );
  }

  const loadData = async () => {
    setIsLoading(true);
    const [activity, weak, untouchedDocs, difficultyCurve] = await Promise.all([
      getMemberActivity(roomId),
      getWeakQuestions(roomId),
      getUntouchedDocuments(roomId),
      getDifficultyCurve(roomId),
    ]);
    setMemberActivity(activity);
    setWeakQuestions(weak);
    setUntouched(untouchedDocs);
    setCurve(difficultyCurve);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bento-card animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Member Activity */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bento-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Member Activity</h3>
        </div>
        <div className="divide-y divide-border/20">
          {memberActivity.map((m: any) => (
            <div key={m.user_id} className="px-6 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold truncate">{m.display_name || m.username}</p>
                <p className="text-xs text-muted-foreground">
                  {m.total_attempts > 0
                    ? `Last active ${formatRelativeTime(m.last_attempt_date)}`
                    : 'No activity yet'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold">{m.total_attempts} <span className="text-xs text-muted-foreground font-normal">attempts</span></p>
                {m.total_attempts > 0 && (
                  <p className="text-xs text-muted-foreground">avg {m.average_score}%</p>
                )}
              </div>
            </div>
          ))}
          {memberActivity.length === 0 && (
            <p className="px-6 py-8 text-center text-muted-foreground">No members in this room.</p>
          )}
        </div>
      </motion.div>

      {/* Weak Spots */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bento-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h3 className="font-bold">Weak Spots</h3>
        </div>
        {weakQuestions.length === 0 ? (
          <p className="px-6 py-8 text-center text-muted-foreground">Not enough data yet.</p>
        ) : (
          <div className="divide-y divide-border/20">
            {weakQuestions.map((q: any) => (
              <div key={q.id} className="px-6 py-3">
                <p className="font-medium text-sm truncate mb-1">{q.question_text}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{q.difficulty}</Badge>
                  <span className="text-xs text-destructive font-semibold">
                    {q.wrong_count} / {q.total_attempts} got it wrong ({q.failure_ratio}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Untouched Documents */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bento-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-bold">Untouched Documents</h3>
        </div>
        {untouched.length === 0 ? (
          <p className="px-6 py-8 text-center text-muted-foreground">All documents have been used — great job!</p>
        ) : (
          <div className="divide-y divide-border/20">
            {untouched.map((d: any) => (
              <div key={d.id} className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => {/* scroll to quiz gen — handled by parent tab switch */}}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Quiz
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Difficulty Curve */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bento-card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Difficulty Curve</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {(['easy', 'medium', 'hard'] as const).map((diff) => {
            const score = curve[diff];
            const info = getDifficultyLabel(score);
            return (
              <div key={diff} className="space-y-1">
                <Badge variant="outline" className={`text-xs ${
                  diff === 'easy' ? 'bg-success/10 text-success border-success/20' :
                  diff === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                  {diff}
                </Badge>
                <p className="text-2xl font-black">
                  {score !== null ? `${score}%` : '—'}
                </p>
                <p className={`text-xs font-semibold ${info.class}`}>{info.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
