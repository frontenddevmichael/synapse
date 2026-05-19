import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock, Share2, Star, XCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatedScore } from '@/components/quiz/AnimatedScore';
import { PersonalBest } from '@/components/quiz/PersonalBest';
import { RetryMistakesButton } from '@/components/quiz/RetryMistakesButton';
import { fadeUp, stagger } from '@/lib/motion';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

interface QuizResultsProps {
  score: number;
  questions: Question[];
  answers: Record<string, string>;
  previousBestScore: number | null;
  xpEarned: number | null;
  leveledUp: boolean;
  newLevel: number | null;
  shouldShowAnswerReview: boolean;
  modeBackground: string;
  onRetryMistakes: () => void;
  onShareScore: () => void;
}

function QuizResultsImpl({
  score, questions, answers, previousBestScore, xpEarned, leveledUp, newLevel,
  shouldShowAnswerReview, modeBackground, onRetryMistakes, onShareScore,
}: QuizResultsProps) {
  const navigate = useNavigate();
  const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length;
  const incorrectCount = questions.length - correctCount;
  const isNewBest = previousBestScore !== null && score >= previousBestScore;

  return (
    <div className={`min-h-screen flex flex-col bg-background dot-grid ${modeBackground}`}>
      <header className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Logo />
        </div>
        <ThemeToggle />
      </header>
      <main className="flex-1 container max-w-3xl py-6 sm:py-8 px-4">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} className="rounded-sm border border-border/50 bg-card p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8 text-center shadow-lg">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 sm:mb-4">Quiz Complete</p>
            <div className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-3 sm:mb-4 text-electric">
              <AnimatedScore score={score} />
            </div>
            <p className="text-base sm:text-lg text-muted-foreground mb-2">{correctCount} out of {questions.length} correct</p>

            <div className="flex justify-center mb-4">
              <PersonalBest currentScore={score} previousBest={previousBestScore} isNewBest={isNewBest} />
            </div>

            {xpEarned !== null && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6">
                <div className="flex items-center gap-2 text-primary font-bold animate-count-up">
                  <Zap className="h-5 w-5" />
                  +{xpEarned} XP
                </div>
                {leveledUp && newLevel && (
                  <div className="flex items-center gap-2 text-gold font-bold animate-count-up gold-shimmer">
                    <Star className="h-5 w-5" />
                    Level {newLevel}!
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 sm:mt-8">
              <Button onClick={() => navigate(-1)} className="h-11 px-8 font-semibold w-full sm:w-auto">Back to Room</Button>
              <RetryMistakesButton incorrectCount={incorrectCount} onClick={onRetryMistakes} />
              <Button variant="ghost" size="sm" onClick={onShareScore} className="gap-2 text-muted-foreground">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </motion.div>

          {shouldShowAnswerReview ? (
            <motion.div variants={fadeUp} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Review</h2>
              {questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correct_answer;
                return (
                  <div key={question.id} className="rounded-sm border border-border/50 bg-card p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      {isCorrect
                        ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success flex-shrink-0 mt-0.5" />
                        : <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5" />}
                      <p className="font-serif text-base sm:text-lg">{index + 1}. {question.question_text}</p>
                    </div>
                    <div className="space-y-2 sm:ml-10">
                      {question.options.map((option) => (
                        <div key={option} className={cn('p-2.5 sm:p-3 rounded-lg border transition-all text-sm',
                          option === question.correct_answer && 'bg-success/10 border-success/30',
                          option === userAnswer && option !== question.correct_answer && 'bg-destructive/10 border-destructive/30',
                          option !== userAnswer && option !== question.correct_answer && 'border-border/30'
                        )}>
                          {option}
                          {option === question.correct_answer && <span className="ml-2 text-success text-xs sm:text-sm font-medium">(Correct)</span>}
                          {option === userAnswer && option !== question.correct_answer && <span className="ml-2 text-destructive text-xs sm:text-sm font-medium">(Your answer)</span>}
                        </div>
                      ))}
                      {question.explanation && (
                        <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl text-xs sm:text-sm text-muted-foreground">
                          <span className="font-bold text-foreground">Explanation: </span>{question.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div variants={fadeUp} className="rounded-sm border border-border/50 bg-card p-8 sm:p-12 text-center">
              <Lock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Review Hidden</h3>
              <p className="text-muted-foreground text-sm">Exam mode does not allow answer review.</p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export const QuizResults = memo(QuizResultsImpl);
