import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, CheckCircle, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { calculateNextReview } from '@/utils/recall';
import { fadeUp } from '@/lib/motion';

interface RecallCard {
  id: string;
  question_id: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  question_text: string;
  correct_answer: string;
  options: string[];
}

const Recall = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<RecallCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchDueCards();
  }, [user]);

  const fetchDueCards = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('recall_cards')
      .select('id, question_id, interval_days, ease_factor, repetitions, next_review_at')
      .eq('user_id', user.id)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true });

    if (!data?.length) {
      setCards([]);
      setIsLoading(false);
      return;
    }

    // Fetch question details
    const questionIds = data.map((c: any) => c.question_id);
    const { data: questions } = await supabase
      .from('questions')
      .select('id, question_text, correct_answer, options')
      .in('id', questionIds);

    const questionMap: Record<string, any> = {};
    (questions || []).forEach((q: any) => {
      questionMap[q.id] = q;
    });

    const enriched: RecallCard[] = data
      .filter((c: any) => questionMap[c.question_id])
      .map((c: any) => ({
        id: c.id,
        question_id: c.question_id,
        interval_days: c.interval_days,
        ease_factor: c.ease_factor,
        repetitions: c.repetitions,
        question_text: questionMap[c.question_id].question_text,
        correct_answer: questionMap[c.question_id].correct_answer,
        options: typeof questionMap[c.question_id].options === 'string'
          ? JSON.parse(questionMap[c.question_id].options)
          : questionMap[c.question_id].options,
      }));

    setCards(enriched);
    setIsLoading(false);
  };

  const handleRate = async (quality: number) => {
    const card = cards[currentIndex];
    if (!card) return;

    const update = calculateNextReview(
      { interval_days: card.interval_days, ease_factor: card.ease_factor, repetitions: card.repetitions },
      quality
    );

    // Update in Supabase
    await supabase
      .from('recall_cards')
      .update({
        interval_days: update.interval_days,
        ease_factor: update.ease_factor,
        repetitions: update.repetitions,
        next_review_at: update.next_review_at,
      })
      .eq('id', card.id);

    if (quality <= 2) setResetCount(prev => prev + 1);
    setReviewedCount(prev => prev + 1);

    // Track earliest next review
    if (!nextReviewDate || update.next_review_at < nextReviewDate) {
      setNextReviewDate(update.next_review_at);
    }

    // Move to next card
    setIsFlipped(false);
    if (currentIndex + 1 >= cards.length) {
      setCompleted(true);
    } else {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  };

  const progress = cards.length > 0 ? ((reviewedCount) / cards.length) * 100 : 0;
  const currentCard = cards[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dot-grid">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Empty state
  if (cards.length === 0 && !completed) {
    return (
      <div className="min-h-screen flex flex-col bg-background dot-grid">
        <header className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /></Button>
            <Logo />
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center max-w-md">
            <Brain className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-2xl font-black tracking-tight mb-2">Nothing due today</h2>
            <p className="text-muted-foreground mb-6">Take a quiz to start building your review deck.</p>
            <Button onClick={() => navigate('/dashboard')} className="font-semibold">Back to rooms</Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Completion summary
  if (completed) {
    const nextDate = nextReviewDate ? new Date(nextReviewDate) : null;
    return (
      <div className="min-h-screen flex flex-col bg-background dot-grid">
        <header className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /></Button>
            <Logo />
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center max-w-md">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-black tracking-tight mb-2">Review complete!</h2>
            <div className="space-y-2 text-muted-foreground mb-6">
              <p><span className="font-bold text-foreground">{reviewedCount}</span> cards reviewed</p>
              {resetCount > 0 && (
                <p><span className="font-bold text-destructive">{resetCount}</span> reset (Again)</p>
              )}
              {nextDate && (
                <p>Next review: <span className="font-bold text-foreground">
                  {nextDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span></p>
              )}
            </div>
            <Button onClick={() => navigate('/dashboard')} className="font-semibold">Back to rooms</Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Review UI
  return (
    <div className="min-h-screen flex flex-col bg-background dot-grid">
      <header className="flex items-center justify-between p-4 sm:p-6 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-4 w-4" /></Button>
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-mono">
            {reviewedCount + 1}/{cards.length}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-4 sm:px-8 pt-4">
        <Progress value={progress} className="h-2" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Flashcard with 3D flip */}
        <div
          className="w-full max-w-lg perspective-1000 cursor-pointer mb-8"
          style={{ perspective: '1000px' }}
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="relative w-full min-h-[280px] sm:min-h-[320px] transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 bento-card flex flex-col items-center justify-center p-8 text-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <Badge variant="outline" className="mb-4 text-xs">Question</Badge>
                  <p className="font-question text-lg sm:text-xl leading-relaxed">
                    {currentCard?.question_text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-6">Tap to reveal answer</p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 bento-card flex flex-col items-center justify-center p-8 text-center"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <Badge variant="outline" className="mb-4 text-xs text-success border-success/30">Answer</Badge>
                  <p className="text-xl sm:text-2xl font-bold text-electric">
                    {currentCard?.correct_answer}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rating buttons — only visible when flipped */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Button
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 min-w-[80px]"
              onClick={() => handleRate(0)}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Again
            </Button>
            <Button
              variant="outline"
              className="min-w-[80px]"
              onClick={() => handleRate(2)}
            >
              Hard
            </Button>
            <Button
              variant="outline"
              className="border-success/30 text-success hover:bg-success/10 min-w-[80px]"
              onClick={() => handleRate(4)}
            >
              Good
            </Button>
            <Button
              className="min-w-[80px]"
              onClick={() => handleRate(5)}
            >
              Easy
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Recall;
