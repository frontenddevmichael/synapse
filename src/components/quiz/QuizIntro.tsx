import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fadeUp, stagger } from '@/lib/motion';

type RoomMode = 'study' | 'challenge' | 'exam';

interface QuizIntroProps {
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  effectiveTimeLimit: number | null;
  roomMode: RoomMode;
  isExamBlocked: boolean;
  modeBackground: string;
  modeAccentColor: string;
  onStart: () => void;
}

function QuizIntroImpl({
  title, description, difficulty, questionCount, effectiveTimeLimit,
  roomMode, isExamBlocked, modeBackground, modeAccentColor, onStart,
}: QuizIntroProps) {
  const navigate = useNavigate();
  const difficultyClass =
    difficulty === 'easy' ? 'bg-success/10 text-success' :
    difficulty === 'medium' ? 'bg-warning/10 text-warning' :
    'bg-destructive/10 text-destructive';

  return (
    <div className={`min-h-screen flex flex-col bg-background dot-grid ${modeBackground}`}>
      <header className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${roomMode === 'study' ? 'mode-study' : roomMode === 'challenge' ? 'mode-challenge' : 'mode-exam'} font-semibold`}>
            {roomMode} mode
          </Badge>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="w-full max-w-md">
          <motion.div variants={fadeUp} className="rounded-sm border border-border/50 bg-card p-8 shadow-lg text-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{title}</h1>
            {description && <p className="text-muted-foreground mb-6">{description}</p>}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge className={difficultyClass}>{difficulty}</Badge>
              <Badge variant="outline">{questionCount} question{questionCount !== 1 ? 's' : ''}</Badge>
              {effectiveTimeLimit && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />{effectiveTimeLimit} min
                </Badge>
              )}
            </div>

            <div className="hidden sm:flex items-center justify-center gap-2 mb-4 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">A-D</kbd>
              <span>to answer</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">←→</kbd>
              <span>to navigate</span>
            </div>

            <div className={`p-4 rounded-xl border border-border/30 mb-6 ${modeBackground}`}>
              <p className={`text-sm font-medium ${modeAccentColor}`}>
                {roomMode === 'study' ? 'Answers revealed after each question' :
                  roomMode === 'challenge' ? 'Timed quiz with leaderboard' :
                  'Single attempt, no review'}
              </p>
            </div>
            {isExamBlocked ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                  <Lock className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-bold">Already completed</p>
                    <p className="text-sm opacity-80">Exam mode allows one attempt</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>Back to Room</Button>
              </div>
            ) : (
              <Button className="w-full h-12 text-base font-bold" size="lg" onClick={onStart}>Start Quiz</Button>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export const QuizIntro = memo(QuizIntroImpl);
