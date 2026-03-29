import { useState, useEffect } from 'react';
import { Hammer, Check, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ForgeTabProps {
  roomId: string;
  ownerId: string;
}

interface UserQuestion {
  id: string;
  question_text: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
  question_type: string;
  difficulty: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  author_id: string;
  author_username?: string;
}

export function ForgeTab({ roomId, ownerId }: ForgeTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.id === ownerId;

  // Form state
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false'>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const [mySubmissions, setMySubmissions] = useState<UserQuestion[]>([]);
  const [pendingReviews, setPendingReviews] = useState<UserQuestion[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [roomId]);

  const fetchSubmissions = async () => {
    if (!user) return;

    // Fetch my submissions
    const { data: mine } = await supabase
      .from('user_questions')
      .select('*')
      .eq('room_id', roomId)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    setMySubmissions((mine as UserQuestion[]) || []);

    // If owner, fetch all pending
    if (isOwner) {
      const { data: pending } = await supabase
        .from('user_questions')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (pending) {
        // Fetch author usernames
        const authorIds = [...new Set(pending.map((p: any) => p.author_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', authorIds);

        const profileMap: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p.username; });

        setPendingReviews(pending.map((p: any) => ({
          ...p,
          author_username: profileMap[p.author_id] || 'Unknown',
        })));
      }
    }
  };

  const resetForm = () => {
    setQuestionText('');
    setOptionA(''); setOptionB(''); setOptionC(''); setOptionD('');
    setCorrectAnswer('');
    setDifficulty('medium');
    setQuestionType('multiple_choice');
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('user_questions').insert({
      room_id: roomId,
      author_id: user.id,
      question_text: questionText.trim(),
      option_a: questionType === 'multiple_choice' ? optionA.trim() : 'True',
      option_b: questionType === 'multiple_choice' ? optionB.trim() : 'False',
      option_c: questionType === 'multiple_choice' ? optionC.trim() : null,
      option_d: questionType === 'multiple_choice' ? optionD.trim() : null,
      correct_answer: correctAnswer,
      question_type: questionType,
      difficulty,
      status: 'pending',
    });

    if (error) {
      toast({ title: 'Submission failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Question submitted for review.' });
      resetForm();
      fetchSubmissions();
    }
    setIsSubmitting(false);
  };

  const handleApprove = async (id: string) => {
    await supabase.from('user_questions').update({ status: 'approved' }).eq('id', id);
    setPendingReviews(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Question approved!' });
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) return;
    await supabase.from('user_questions').update({ status: 'rejected', rejection_reason: rejectionReason.trim() }).eq('id', id);
    setPendingReviews(prev => prev.filter(p => p.id !== id));
    setRejectingId(null);
    setRejectionReason('');
    toast({ title: 'Question rejected.' });
  };

  // Validation
  const isMCValid = questionType === 'multiple_choice' &&
    questionText.trim().length > 0 &&
    optionA.trim().length > 0 && optionB.trim().length > 0 &&
    optionC.trim().length > 0 && optionD.trim().length > 0 &&
    correctAnswer.length > 0;

  const isTFValid = questionType === 'true_false' &&
    questionText.trim().length > 0 && correctAnswer.length > 0;

  const canSubmit = (isMCValid || isTFValid) && difficulty;

  const pendingCount = mySubmissions.filter(s => s.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-[10px]">Pending</Badge>;
      case 'approved': return <Badge variant="outline" className="text-success border-success/30 bg-success/10 text-[10px]">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10 text-[10px]">Rejected</Badge>;
      default: return null;
    }
  };

  const getDiffBadge = (diff: string) => {
    const cls = diff === 'easy' ? 'bg-success/10 text-success border-success/20' :
      diff === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
      'bg-destructive/10 text-destructive border-destructive/20';
    return <Badge variant="outline" className={`${cls} text-[10px]`}>{diff}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Owner review section */}
      {isOwner && pendingReviews.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bento-card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hammer className="h-4 w-4 text-primary" />
              <h3 className="font-bold">Pending Review</h3>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20">{pendingReviews.length}</Badge>
          </div>
          <div className="divide-y divide-border/20">
            {pendingReviews.map((q) => (
              <div key={q.id} className="px-6 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{q.question_text}</p>
                    <p className="text-xs text-muted-foreground mt-1">by @{q.author_username} · {new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                  {getDiffBadge(q.difficulty)}
                </div>
                {/* Show options */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'A', value: q.option_a },
                    { label: 'B', value: q.option_b },
                    { label: 'C', value: q.option_c },
                    { label: 'D', value: q.option_d },
                  ].filter(o => o.value).map(opt => (
                    <div key={opt.label} className={cn(
                      "text-xs px-3 py-2 rounded-sm border",
                      opt.value === q.correct_answer
                        ? "border-success/40 bg-success/10 text-success font-semibold"
                        : "border-border/40 text-muted-foreground"
                    )}>
                      <span className="font-bold mr-1">{opt.label}.</span> {opt.value}
                    </div>
                  ))}
                </div>
                {/* Actions */}
                {rejectingId === q.id ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Rejection reason (required)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="h-9 text-sm flex-1"
                    />
                    <Button size="sm" variant="destructive" onClick={() => handleReject(q.id)} disabled={!rejectionReason.trim()}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1.5" onClick={() => handleApprove(q.id)}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => setRejectingId(q.id)}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Submission form */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bento-card">
        <div className="flex items-center gap-2 mb-5">
          <Hammer className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Submit a Question</h3>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-[10px] ml-auto">
              {pendingCount} pending
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {/* Question type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={questionType === 'multiple_choice' ? 'default' : 'outline'}
                onClick={() => { setQuestionType('multiple_choice'); setCorrectAnswer(''); }}
                className="flex-1"
              >
                Multiple Choice
              </Button>
              <Button
                size="sm"
                variant={questionType === 'true_false' ? 'default' : 'outline'}
                onClick={() => {
                  setQuestionType('true_false');
                  setOptionA('True'); setOptionB('False'); setOptionC(''); setOptionD('');
                  setCorrectAnswer('');
                }}
                className="flex-1"
              >
                True / False
              </Button>
            </div>
          </div>

          {/* Question text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question</Label>
              <span className="text-[10px] text-muted-foreground">{questionText.length}/500</span>
            </div>
            <Textarea
              placeholder="Write your question..."
              value={questionText}
              onChange={(e) => e.target.value.length <= 500 && setQuestionText(e.target.value)}
              rows={3}
            />
          </div>

          {/* Answer options */}
          {questionType === 'multiple_choice' ? (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Options (click to mark correct)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'A', value: optionA, set: setOptionA },
                  { label: 'B', value: optionB, set: setOptionB },
                  { label: 'C', value: optionC, set: setOptionC },
                  { label: 'D', value: optionD, set: setOptionD },
                ].map(({ label, value, set }) => (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center gap-2 border rounded-sm p-2 cursor-pointer transition-colors",
                      correctAnswer === value && value.trim()
                        ? "border-success/50 bg-success/10"
                        : "border-border/60 hover:border-border"
                    )}
                    onClick={() => value.trim() && setCorrectAnswer(value)}
                  >
                    <span className="font-bold text-xs text-muted-foreground w-5">{label}.</span>
                    <Input
                      placeholder={`Option ${label}`}
                      value={value}
                      onChange={(e) => {
                        set(e.target.value);
                        if (correctAnswer === value) setCorrectAnswer(e.target.value);
                      }}
                      className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {correctAnswer === value && value.trim() && (
                      <Check className="h-4 w-4 text-success shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correct Answer</Label>
              <div className="flex gap-2">
                {['True', 'False'].map(val => (
                  <Button
                    key={val}
                    size="sm"
                    variant={correctAnswer === val ? 'default' : 'outline'}
                    onClick={() => setCorrectAnswer(val)}
                    className={cn("flex-1", correctAnswer === val && "bg-success text-success-foreground hover:bg-success/90")}
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</Label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <Button
                  key={d}
                  size="sm"
                  variant={difficulty === d ? 'default' : 'outline'}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "flex-1 capitalize",
                    difficulty === d && d === 'easy' && "bg-success text-success-foreground hover:bg-success/90",
                    difficulty === d && d === 'medium' && "bg-warning text-warning-foreground hover:bg-warning/90",
                    difficulty === d && d === 'hard' && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  )}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full gap-2 font-semibold h-11"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <Send className="h-4 w-4" />
            Submit for Review
          </Button>
        </div>
      </motion.div>

      {/* My submissions history */}
      {mySubmissions.length > 0 && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bento-card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30">
            <h3 className="font-bold">My Submissions</h3>
          </div>
          <div className="divide-y divide-border/20">
            {mySubmissions.map((q) => (
              <div key={q.id} className="px-6 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm truncate flex-1">{q.question_text}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {getDiffBadge(q.difficulty)}
                    {getStatusBadge(q.status)}
                  </div>
                </div>
                {q.status === 'rejected' && q.rejection_reason && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Reason: {q.rejection_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
