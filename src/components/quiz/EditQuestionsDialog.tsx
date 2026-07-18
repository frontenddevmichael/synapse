import { useState, useEffect } from 'react';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_index: number;
}

interface EditQuestionsDialogProps {
  quizId: string;
  quizTitle: string;
  canEdit: boolean;
}

export function EditQuestionsDialog({ quizId, quizTitle, canEdit }: EditQuestionsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setQuestions(data.map((q: any) => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
          })));
        }
        setLoading(false);
      });
  }, [open, quizId]);

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditForm({
      question_text: q.question_text,
      options: [...q.options],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveQuestion = async () => {
    if (!editingId || !editForm.question_text?.trim() || !editForm.correct_answer?.trim()) return;
    setSaving(true);
    const options = editForm.question_type === 'true_false'
      ? ['True', 'False']
      : editForm.options?.filter(Boolean) || [];
    const { error } = await supabase
      .from('questions')
      .update({
        question_text: editForm.question_text.trim(),
        options,
        correct_answer: editForm.correct_answer.trim(),
        explanation: editForm.explanation?.trim() || null,
      })
      .eq('id', editingId);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Question updated' });
      setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...editForm, options } as Question : q));
      setEditingId(null);
      setEditForm({});
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Qs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl mx-4 sm:mx-auto max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Questions</DialogTitle>
          <DialogDescription className="text-sm">{quizTitle}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No questions found</p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                {editingId === q.id ? (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1">
                      <Label className="text-xs">Question</Label>
                      <Textarea
                        value={editForm.question_text || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, question_text: e.target.value }))}
                        rows={2}
                        className="text-sm resize-y min-h-[40px]"
                      />
                    </div>
                    {q.question_type === 'multiple_choice' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Options</Label>
                        {editForm.options?.map((opt, oi) => (
                          <div key={oi} className="flex gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(editForm.options || [])];
                                newOpts[oi] = e.target.value;
                                setEditForm(f => ({ ...f, options: newOpts }));
                              }}
                              className="h-9 text-sm flex-1"
                              placeholder={`Option ${oi + 1}`}
                            />
                            {editForm.options && editForm.options.length > 2 && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setEditForm(f => ({ ...f, options: f.options?.filter((_, i) => i !== oi) }))}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Correct Answer</Label>
                        <Input value={editForm.correct_answer || ''} onChange={(e) => setEditForm(f => ({ ...f, correct_answer: e.target.value }))} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Explanation (optional)</Label>
                        <Input value={editForm.explanation || ''} onChange={(e) => setEditForm(f => ({ ...f, explanation: e.target.value }))} className="h-9 text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveQuestion} disabled={saving} className="gap-1.5 text-xs h-8 font-semibold">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-xs h-8">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium flex-1">{q.question_text}</p>
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); startEdit(q); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.map((opt) => (
                        <span key={opt} className={`text-[11px] px-2 py-0.5 rounded-full border ${opt === q.correct_answer ? 'bg-success/10 border-success/30 text-success font-medium' : 'border-border/30 text-muted-foreground'}`}>
                          {opt}
                        </span>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground">{q.explanation}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">#{q.order_index + 1} · {q.question_type === 'true_false' ? 'True/False' : 'MCQ'}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
