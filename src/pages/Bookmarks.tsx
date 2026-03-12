import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Trash2, Loader2 } from 'lucide-react';
import { EmptyDeckIllustration } from '@/components/illustrations/EmptyDeckIllustration';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { fadeUp, staggerFast } from '@/lib/motion';

interface BookmarkedQuestion {
  id: string;
  notes: string | null;
  created_at: string;
  question: {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string | null;
    question_type: string;
  };
}

const Bookmarks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchBookmarks();
  }, [user, navigate]);

  const fetchBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookmarked_questions')
      .select(`
        id, notes, created_at,
        question:questions(id, question_text, options, correct_answer, explanation, question_type)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBookmarks(data.filter((b: any) => b.question).map((b: any) => ({
        ...b,
        question: {
          ...b.question,
          options: typeof b.question.options === 'string' ? JSON.parse(b.question.options) : b.question.options
        }
      })));
    }
    setIsLoading(false);
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    const { error } = await supabase.from('bookmarked_questions').delete().eq('id', bookmarkId);
    if (error) toast({ title: 'Failed to remove bookmark', variant: 'destructive' });
    else { toast({ title: 'Bookmark removed' }); setBookmarks(prev => prev.filter(b => b.id !== bookmarkId)); }
  };

  const toggleReveal = (id: string) => {
    setRevealedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background noise-bg mesh-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background noise-bg mesh-gradient pb-14 sm:pb-0">
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-border/30 bg-background/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="min-h-[44px] min-w-[44px]"><ArrowLeft className="h-4 w-4" /></Button>
          <Logo />
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 container max-w-3xl py-6 sm:py-8 px-4 sm:px-8">
        <motion.div variants={staggerFast} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-primary/10">
                <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter">Study Deck</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-lg">
              {bookmarks.length} bookmarked question{bookmarks.length !== 1 ? 's' : ''} for review
            </p>
          </motion.div>

          {bookmarks.length === 0 ? (
            <motion.div variants={fadeUp} className="bento-card py-12 sm:py-16 flex flex-col items-center text-center">
              <EmptyDeckIllustration className="w-40 h-32 mb-3 sm:mb-4" />
              <h3 className="font-bold text-base sm:text-lg mb-1">Your deck is empty</h3>
              <p className="text-sm text-muted-foreground">Bookmark questions during quizzes to build your personal review deck</p>
            </motion.div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {bookmarks.map((bookmark, index) => {
                const revealed = revealedAnswers.has(bookmark.id);
                return (
                  <motion.div
                    key={bookmark.id}
                    variants={fadeUp}
                    transition={{ delay: index * 0.05 }}
                    className="bento-card p-4 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                      <p className="font-serif text-base sm:text-lg leading-relaxed flex-1">{bookmark.question.question_text}</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-destructive min-h-[44px] min-w-[44px]">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4 sm:mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove bookmark?</AlertDialogTitle>
                            <AlertDialogDescription>This question will be removed from your study deck.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveBookmark(bookmark.id)} className="min-h-[44px]">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {bookmark.question.options.map((option: string) => (
                        <div
                          key={option}
                          className={`p-2.5 sm:p-3 rounded-lg border transition-all text-xs sm:text-sm ${
                            revealed && option === bookmark.question.correct_answer
                              ? 'bg-success/10 border-success/30 font-medium'
                              : 'border-border/30'
                          }`}
                        >
                          {option}
                          {revealed && option === bookmark.question.correct_answer && (
                            <span className="ml-2 text-success text-xs font-bold">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" onClick={() => toggleReveal(bookmark.id)} className="font-semibold min-h-[44px]">
                        {revealed ? 'Hide Answer' : 'Reveal Answer'}
                      </Button>
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        {bookmark.question.question_type === 'true_false' ? 'True/False' : 'MCQ'}
                      </Badge>
                    </div>

                    {revealed && bookmark.question.explanation && (
                      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl text-xs sm:text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">Explanation: </span>
                        {bookmark.question.explanation}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Bookmarks;
