import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Bookmark, BookmarkCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { StudyModeAnswer } from '@/components/quiz/StudyModeAnswer';
import { useGamification } from '@/hooks/useGamification';
import { useActiveSession } from '@/hooks/useActiveSession';
import { AchievementToast } from '@/components/gamification/AchievementToast';
import { LevelUpOverlay } from '@/components/gamification/LevelUpOverlay';
import { TypewriterText } from '@/components/quiz/TypewriterText';
import { QuizIntro } from '@/components/quiz/QuizIntro';
import { QuizResults } from '@/components/quiz/QuizResults';
import { useConfetti } from '@/hooks/useConfetti';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit_minutes: number | null;
  room_id: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  explanation: string | null;
  order_index: number;
}

interface QuizAttempt {
  id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;
  answers: Record<string, string>;
  started_at: string | null;
  completed_at: string | null;
}

interface UserPreferences {
  show_answers_immediately: boolean;
  default_time_limit: number;
  preferred_difficulty: string;
}

type RoomMode = 'study' | 'challenge' | 'exam';

const QuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStatsOnQuizComplete, newAchievement, clearNewAchievement } = useGamification();
  const { firePerfectScore, fireSmall } = useConfetti();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [roomMode, setRoomMode] = useState<RoomMode>('study');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [effectiveTimeLimit, setEffectiveTimeLimit] = useState<number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [previousBestScore, setPreviousBestScore] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<Map<string, { correct: boolean; correctAnswer: string; explanation: string | null }>>(new Map());
  const [correctAnswersMap, setCorrectAnswersMap] = useState<Record<string, { correct_answer: string; explanation: string | null }>>({});
  const [showTypewriter, setShowTypewriter] = useState(true);

  const fetchBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookmarked_questions')
      .select('question_id')
      .eq('user_id', user.id);
    if (data) setBookmarkedQuestions(new Set(data.map(b => b.question_id)));
  };

  const toggleBookmark = async (questionId: string) => {
    if (!user) return;
    if (bookmarkedQuestions.has(questionId)) {
      await supabase.from('bookmarked_questions').delete().eq('user_id', user.id).eq('question_id', questionId);
      setBookmarkedQuestions(prev => { const next = new Set(prev); next.delete(questionId); return next; });
    } else {
      await supabase.from('bookmarked_questions').insert({ user_id: user.id, question_id: questionId });
      setBookmarkedQuestions(prev => new Set(prev).add(questionId));
    }
  };

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (quizId) { fetchQuizData(); fetchBookmarks(); }
  }, [user, quizId, navigate]);

  const fetchQuizData = async () => {
    if (!quizId || !user) return;
    setIsLoading(true);
    const { data: quizData, error: quizError } = await supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle();
    if (quizError || !quizData) { toast({ title: 'Quiz not found', variant: 'destructive' }); navigate('/dashboard'); return; }
    setQuiz(quizData as Quiz);
    const { data: roomData } = await supabase.from('rooms').select('mode').eq('id', quizData.room_id).maybeSingle();
    if (roomData) setRoomMode(roomData.mode as RoomMode);
    const { data: prefsData } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
    if (prefsData) setUserPreferences(prefsData as UserPreferences);
    const timeLimit = quizData.time_limit_minutes || prefsData?.default_time_limit || null;
    if (roomData?.mode === 'challenge' || quizData.time_limit_minutes) setEffectiveTimeLimit(timeLimit);
    const { data: questionsData } = await supabase.from('questions_public').select('*').eq('quiz_id', quizId).order('order_index');
    if (questionsData) {
      setQuestions(questionsData.map((q: any) => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options })));
    }
    const { data: attemptData } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('user_id', user.id).order('created_at', { ascending: false });
    if (attemptData && attemptData.length > 0) {
      const latestAttempt = attemptData[0] as QuizAttempt;
      const completedAttempts = attemptData.filter((a: any) => a.status === 'completed');
      setHasCompletedAttempt(completedAttempts.length > 0);
      
      // Track personal best
      if (completedAttempts.length > 0) {
        const best = Math.max(...completedAttempts.map((a: any) => a.score || 0));
        setPreviousBestScore(best);
      }
      
      if (latestAttempt.status === 'completed') {
        setAttempt(latestAttempt); setShowResults(true); setAnswers((latestAttempt.answers as Record<string, string>) || {});
      } else if (latestAttempt.status === 'in_progress') {
        setAttempt(latestAttempt);
        const savedAnswers = (latestAttempt.answers as Record<string, string>) || {};
        setAnswers(savedAnswers); setAnsweredQuestions(new Set(Object.keys(savedAnswers)));
      }
    }
    setIsLoading(false);
  };

  const { startSession, updateProgress, endSession } = useActiveSession({
    quizId: quizId || '',
    roomId: quiz?.room_id || '',
    enabled: !!attempt && attempt.status === 'in_progress',
  });

  const startQuiz = async () => {
    if (!quizId || !user) return;
    if (roomMode === 'exam' && hasCompletedAttempt) { toast({ title: 'Quiz already completed', description: 'Exam mode only allows one attempt.', variant: 'destructive' }); return; }
    const { data, error } = await supabase.from('quiz_attempts').insert({ quiz_id: quizId, user_id: user.id, status: 'in_progress', started_at: new Date().toISOString(), total_questions: questions.length, answers: {} }).select().single();
    if (error) { toast({ title: 'Failed to start quiz', description: error.message, variant: 'destructive' }); return; }
    setAttempt(data as QuizAttempt); setAnsweredQuestions(new Set()); setShowTypewriter(true);
    startSession();
  };

  const selectAnswer = async (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    if (roomMode === 'study') {
      setAnsweredQuestions(prev => new Set(prev).add(questionId));
      const { data: feedback } = await supabase.rpc('check_answer', { _question_id: questionId, _answer: answer });
      if (feedback && !feedback.error) {
        setAnswerFeedback(prev => new Map(prev).set(questionId, { correct: feedback.correct, correctAnswer: feedback.correct_answer, explanation: feedback.explanation }));
      }
    }
    if (attempt) await supabase.from('quiz_attempts').update({ answers: newAnswers }).eq('id', attempt.id);
    updateProgress(currentQuestionIndex, Object.keys(newAnswers).length);
  };

  const handleTimeUp = useCallback(async () => {
    if (!attempt || !user || isSubmitting) return;
    await submitQuiz();
  }, [attempt, user, isSubmitting]);

  const submitQuiz = async () => {
    if (!attempt || !user) return;
    setIsSubmitting(true);

    const { data: gradeResult, error: gradeError } = await supabase.rpc('grade_quiz', { _attempt_id: attempt.id });
    if (gradeError || gradeResult?.error) {
      toast({ title: 'Failed to grade quiz', description: gradeResult?.error || gradeError?.message || 'Unknown error', variant: 'destructive' });
      setIsSubmitting(false); return;
    }

    const { score, correct_answers } = gradeResult;
    setCorrectAnswersMap(correct_answers);

    if (score === 100) {
      setTimeout(() => firePerfectScore(), 300);
    } else if (score >= 80) {
      setTimeout(() => fireSmall(), 300);
    }

    try {
      const { data: prevAttempts } = await supabase.from('quiz_attempts').select('score').eq('quiz_id', quizId).eq('user_id', user.id).eq('status', 'completed').neq('id', attempt.id).order('completed_at', { ascending: false }).limit(1);
      const prevScore = prevAttempts?.[0]?.score ?? null;
      const gamResult = await updateStatsOnQuizComplete(attempt.id, score, attempt.started_at || new Date().toISOString(), questions.map(q => ({ id: q.id, correct_answer: correct_answers[q.id]?.correct_answer })), answers, prevScore);
      if (gamResult) { setXpEarned(gamResult.xpEarned); if (gamResult.levelUp) { setLeveledUp(true); setNewLevel(gamResult.newLevel); } }
    } catch (err) { console.error('Gamification update error:', err); }

    try {
      const wrongQuestionIds = questions.filter(q => correct_answers[q.id] && answers[q.id] !== correct_answers[q.id].correct_answer).map(q => q.id);
      if (wrongQuestionIds.length > 0) {
        for (const qId of wrongQuestionIds) {
          await supabase.from('recall_cards').upsert({ user_id: user.id, question_id: qId, interval_days: 1, ease_factor: 2.5, repetitions: 0, next_review_at: new Date().toISOString() }, { onConflict: 'user_id,question_id' });
        }
      }
    } catch (err) { console.error('Recall auto-populate error:', err); }

    const isNewBest = previousBestScore === null || score > previousBestScore;
    if (isNewBest) setPreviousBestScore(score);

    setAttempt({ ...attempt, status: 'completed', score } as QuizAttempt); setShowResults(true); setIsSubmitting(false);
    endSession();
    toast({ title: score === 100 ? '🎉 Perfect score!' : 'Quiz completed!', description: `You scored ${score}%` });
  };

  // Retry only incorrect questions
  const handleRetryMistakes = async () => {
    if (!quizId || !user) return;
    const incorrectQuestionIds = questions
      .filter(q => correctAnswersMap[q.id] && answers[q.id] !== correctAnswersMap[q.id].correct_answer)
      .map(q => q.id);
    
    if (incorrectQuestionIds.length === 0) return;
    
    const { data, error } = await supabase.from('quiz_attempts').insert({
      quiz_id: quizId, user_id: user.id, status: 'in_progress',
      started_at: new Date().toISOString(), total_questions: questions.length, answers: {}
    }).select().single();
    
    if (error) { toast({ title: 'Failed to start retry', variant: 'destructive' }); return; }
    
    setAttempt(data as QuizAttempt);
    const prefilledAnswers: Record<string, string> = {};
    questions.forEach(q => {
      if (correctAnswersMap[q.id] && answers[q.id] === correctAnswersMap[q.id].correct_answer) {
        prefilledAnswers[q.id] = correctAnswersMap[q.id].correct_answer;
      }
    });
    setAnswers(prefilledAnswers);
    setAnsweredQuestions(new Set(Object.keys(prefilledAnswers)));
    setShowResults(false);
    
    const firstIncorrectIndex = questions.findIndex(q => incorrectQuestionIds.includes(q.id));
    setCurrentQuestionIndex(firstIncorrectIndex >= 0 ? firstIncorrectIndex : 0);
    setShowTypewriter(true);
    startSession();
  };

  // Share score
  const handleShareScore = () => {
    const score = attempt?.score || 0;
    const text = `I scored ${score}% on "${quiz?.title}" on Synapse! 🧠⚡`;
    if (navigator.share) {
      navigator.share({ title: 'Synapse Quiz Result', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: 'Score copied to clipboard!' });
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const currentQuestionAnswered = currentQuestion && answeredQuestions.has(currentQuestion.id);
  const shouldShowAnswerReview = roomMode !== 'exam' || (userPreferences?.show_answers_immediately ?? true);

  // Keyboard navigation
  useKeyboardNav({
    options: currentQuestion?.options || [],
    onSelect: (option) => currentQuestion && selectAnswer(currentQuestion.id, option),
    onNext: () => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1)),
    onPrev: () => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1)),
    onSubmit: submitQuiz,
    enabled: !!attempt && attempt.status === 'in_progress' && !showResults,
    isLastQuestion: currentQuestionIndex === questions.length - 1,
    canSubmit: Object.keys(answers).length >= questions.length && !isSubmitting,
    disabled: roomMode === 'study' && currentQuestionAnswered,
  });

  // Reset typewriter on question change
  useEffect(() => {
    setShowTypewriter(true);
  }, [currentQuestionIndex]);

  const getModeBackground = () => {
    switch (roomMode) {
      case 'study': return 'mode-bg-study';
      case 'challenge': return 'mode-bg-challenge';
      case 'exam': return 'mode-bg-exam';
    }
  };

  const getModeAccentColor = () => {
    switch (roomMode) {
      case 'study': return 'text-mode-study';
      case 'challenge': return 'text-mode-challenge';
      case 'exam': return 'text-mode-exam';
    }
  };

  if (isLoading || !quiz) {
    return (
      <div className={`min-h-screen flex flex-col bg-background dot-grid ${getModeBackground()}`}>
        <header className="flex items-center justify-between p-4 sm:p-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-48 w-full rounded-sm" />
            <Skeleton className="h-11 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Quiz intro screen
  if (!attempt || attempt.status === 'not_started') {
    return (
      <QuizIntro
        title={quiz.title}
        description={quiz.description}
        difficulty={quiz.difficulty}
        questionCount={questions.length}
        effectiveTimeLimit={effectiveTimeLimit}
        roomMode={roomMode}
        isExamBlocked={roomMode === 'exam' && hasCompletedAttempt}
        modeBackground={getModeBackground()}
        modeAccentColor={getModeAccentColor()}
        onStart={startQuiz}
      />
    );
  }

  // Results screen
  if (showResults && attempt.status === 'completed') {
    return (
      <>
        <LevelUpOverlay level={newLevel || 1} show={leveledUp} onClose={() => setLeveledUp(false)} />
        {newAchievement && <AchievementToast name={newAchievement.name} description={newAchievement.description} icon={newAchievement.icon} xpReward={newAchievement.xp_reward} onClose={clearNewAchievement} />}
        <QuizResults
          score={attempt.score || 0}
          questions={questions}
          answers={answers}
          correctAnswers={correctAnswersMap}
          previousBestScore={previousBestScore}
          xpEarned={xpEarned}
          leveledUp={leveledUp}
          newLevel={newLevel}
          shouldShowAnswerReview={shouldShowAnswerReview}
          modeBackground={getModeBackground()}
          onRetryMistakes={handleRetryMistakes}
          onShareScore={handleShareScore}
        />
      </>
    );
  }


  // Quiz in progress — fullscreen focus
  return (
    <div className={`min-h-screen flex flex-col bg-background dot-grid ${getModeBackground()}`}>
      {newAchievement && <AchievementToast name={newAchievement.name} description={newAchievement.description} icon={newAchievement.icon} xpReward={newAchievement.xp_reward} onClose={clearNewAchievement} />}

      <header className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <Logo showText={false} />
          <div className="flex items-center gap-2 sm:gap-4">
            {effectiveTimeLimit && attempt.started_at && (
              <QuizTimer timeLimitMinutes={effectiveTimeLimit} startedAt={attempt.started_at} onTimeUp={handleTimeUp} isActive={!showResults && !isSubmitting} />
            )}
            <Badge variant="outline" className={`${roomMode === 'study' ? 'mode-study' : roomMode === 'challenge' ? 'mode-challenge' : 'mode-exam'} font-semibold text-[10px] sm:text-xs`}>
              {roomMode}
            </Badge>
            <span className="text-xs sm:text-sm text-muted-foreground font-mono">
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-8">
        <Progress value={progress} className="h-1 sm:h-1.5 rounded-full" />
      </div>

      <main className="flex-1 flex items-center justify-center p-3 sm:p-8">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl"
          >
            {/* Question text with typewriter effect in exam mode */}
            <p className="font-serif text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-relaxed text-center text-balance mb-2 sm:mb-0">
              {roomMode === 'exam' && showTypewriter ? (
                <TypewriterText
                  text={currentQuestion.question_text}
                  speed={15}
                  onComplete={() => setShowTypewriter(false)}
                />
              ) : (
                currentQuestion.question_text
              )}
            </p>
            <div className="flex items-center justify-center gap-2 mb-6 sm:mb-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleBookmark(currentQuestion.id)}
                className="text-xs gap-1 min-h-[44px]"
                title={bookmarkedQuestions.has(currentQuestion.id) ? 'Remove bookmark' : 'Bookmark question'}
              >
                {bookmarkedQuestions.has(currentQuestion.id) ? (
                  <><BookmarkCheck className="h-4 w-4 text-primary" /> Bookmarked</>
                ) : (
                  <><Bookmark className="h-4 w-4 text-muted-foreground" /> Bookmark</>
                )}
              </Button>
            </div>

            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-10">
              {currentQuestion.options.map((option, i) => {
                const feedback = answerFeedback.get(currentQuestion.id);
                const showStudyFeedback = roomMode === 'study' && currentQuestionAnswered;
                const isCorrectOption = feedback ? option === feedback.correctAnswer : false;
                const isSelected = answers[currentQuestion.id] === option;
                const isWrongAnswer = showStudyFeedback && isSelected && !isCorrectOption;

                return (
                  <motion.button
                    key={option}
                    whileHover={!currentQuestionAnswered ? { scale: 1.01 } : {}}
                    whileTap={!currentQuestionAnswered ? { scale: 0.98 } : {}}
                    onClick={() => selectAnswer(currentQuestion.id, option)}
                    disabled={roomMode === 'study' && currentQuestionAnswered}
                    className={cn(
                      'w-full p-4 sm:p-5 text-left rounded-lg border-2 transition-all duration-200 font-medium text-sm sm:text-base min-h-[52px]',
                      !showStudyFeedback && isSelected
                        ? 'border-primary bg-primary/10 shadow-md'
                        : !showStudyFeedback && 'border-border/50 hover:border-primary/40 hover:bg-primary/5',
                      showStudyFeedback && isCorrectOption && 'border-success bg-success/10',
                      showStudyFeedback && isWrongAnswer && 'border-destructive bg-destructive/10',
                      showStudyFeedback && !isCorrectOption && !isWrongAnswer && 'border-border/30 opacity-50',
                      roomMode === 'study' && currentQuestionAnswered && 'cursor-not-allowed'
                    )}
                  >
                    <span className="flex items-center gap-2.5 sm:gap-3">
                      <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-current/20 flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{option}</span>
                    </span>
                    {showStudyFeedback && isCorrectOption && <span className="ml-8 sm:ml-10 text-success text-xs sm:text-sm font-bold">✓ Correct</span>}
                    {showStudyFeedback && isWrongAnswer && <span className="ml-8 sm:ml-10 text-destructive text-xs sm:text-sm font-bold">✗ Incorrect</span>}
                  </motion.button>
                );
              })}
            </div>

            {roomMode === 'study' && currentQuestionAnswered && answerFeedback.get(currentQuestion.id)?.explanation && (
              <StudyModeAnswer options={currentQuestion.options} selectedAnswer={answers[currentQuestion.id]} correctAnswer={answerFeedback.get(currentQuestion.id)!.correctAnswer} explanation={answerFeedback.get(currentQuestion.id)!.explanation} showFeedback={true} />
            )}

            <div className="flex justify-between items-center gap-3">
              <Button variant="ghost" onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} className="font-semibold min-h-[44px] flex-1 sm:flex-none">
                Previous
              </Button>
              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={submitQuiz} disabled={isSubmitting || Object.keys(answers).length < questions.length} className="font-bold h-11 px-6 sm:px-8 flex-1 sm:flex-none">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
              ) : (
                <Button onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))} className="font-semibold min-h-[44px] flex-1 sm:flex-none">
                  Next
                </Button>
              )}
            </div>

            {/* Keyboard hint */}
            <div className="hidden sm:flex justify-center mt-4 text-2xs text-muted-foreground/50">
              Press A-D to answer · ←→ to navigate
            </div>
          </motion.div>
        )}
      </main>

      <div className="hidden sm:flex justify-center gap-1.5 pb-6 flex-wrap px-4">
        {questions.map((q, i) => (
          <button key={q.id} onClick={() => setCurrentQuestionIndex(i)}
            className={cn('w-3 h-3 rounded-full transition-all duration-200',
              i === currentQuestionIndex ? 'bg-primary scale-125' : answers[q.id] ? 'bg-primary/40' : 'bg-muted-foreground/20'
            )} />
        ))}
      </div>
    </div>
  );
};

export default QuizPage;
