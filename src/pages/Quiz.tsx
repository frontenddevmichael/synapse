import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, Lock, Star, Zap, Bookmark, BookmarkCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { QuizTimer } from '@/components/quiz/QuizTimer';
import { StudyModeAnswer } from '@/components/quiz/StudyModeAnswer';
import { useGamification } from '@/hooks/useGamification';
import { useActiveSession } from '@/hooks/useActiveSession';
import { AchievementToast } from '@/components/gamification/AchievementToast';
import { fadeUp, stagger } from '@/lib/motion';

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
  correct_answer: string;
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

  // Fetch bookmarks for current user
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
    const { data: questionsData } = await supabase.from('questions').select('*').eq('quiz_id', quizId).order('order_index');
    if (questionsData) {
      setQuestions(questionsData.map((q: any) => ({ ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options })));
    }
    const { data: attemptData } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('user_id', user.id).order('created_at', { ascending: false });
    if (attemptData && attemptData.length > 0) {
      const latestAttempt = attemptData[0] as QuizAttempt;
      setHasCompletedAttempt(attemptData.some((a: any) => a.status === 'completed'));
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

  const startQuiz = async () => {
    if (!quizId || !user) return;
    if (roomMode === 'exam' && hasCompletedAttempt) { toast({ title: 'Quiz already completed', description: 'Exam mode only allows one attempt.', variant: 'destructive' }); return; }
    const { data, error } = await supabase.from('quiz_attempts').insert({ quiz_id: quizId, user_id: user.id, status: 'in_progress', started_at: new Date().toISOString(), total_questions: questions.length, answers: {} }).select().single();
    if (error) { toast({ title: 'Failed to start quiz', description: error.message, variant: 'destructive' }); return; }
    setAttempt(data as QuizAttempt); setAnsweredQuestions(new Set());
  };

  const selectAnswer = async (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    if (roomMode === 'study') setAnsweredQuestions(prev => new Set(prev).add(questionId));
    if (attempt) await supabase.from('quiz_attempts').update({ answers: newAnswers }).eq('id', attempt.id);
  };

  const handleTimeUp = useCallback(async () => {
    if (!attempt || !user || isSubmitting) return;
    await submitQuiz();
  }, [attempt, user, isSubmitting]);

  const submitQuiz = async () => {
    if (!attempt || !user) return;
    setIsSubmitting(true);
    let correctCount = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct_answer) correctCount++; });
    const score = Math.round((correctCount / questions.length) * 100);
    const { error } = await supabase.from('quiz_attempts').update({ status: 'completed', score, answers, completed_at: new Date().toISOString() }).eq('id', attempt.id);
    if (error) { toast({ title: 'Failed to submit', description: error.message, variant: 'destructive' }); setIsSubmitting(false); return; }
    try {
      const { data: prevAttempts } = await supabase.from('quiz_attempts').select('score').eq('quiz_id', quizId).eq('user_id', user.id).eq('status', 'completed').neq('id', attempt.id).order('completed_at', { ascending: false }).limit(1);
      const previousScore = prevAttempts?.[0]?.score ?? null;
      const gamResult = await updateStatsOnQuizComplete(correctCount, questions.length, score, attempt.started_at || new Date().toISOString(), questions.map(q => ({ id: q.id, correct_answer: q.correct_answer })), answers, previousScore);
      if (gamResult) { setXpEarned(gamResult.xpEarned); if (gamResult.levelUp) { setLeveledUp(true); setNewLevel(gamResult.newLevel); } }
      const today = new Date().toISOString().split('T')[0];
      const { data: existingActivity } = await supabase.from('daily_activity').select('*').eq('user_id', user.id).eq('date', today).maybeSingle();
      if (existingActivity) {
        await supabase.from('daily_activity').update({ quizzes_completed: (existingActivity.quizzes_completed || 0) + 1, correct_answers: (existingActivity.correct_answers || 0) + correctCount, total_answers: (existingActivity.total_answers || 0) + questions.length, xp_earned: (existingActivity.xp_earned || 0) + (gamResult?.xpEarned || 0), perfect_quizzes: (existingActivity.perfect_quizzes || 0) + (score === 100 ? 1 : 0) }).eq('id', existingActivity.id);
      } else {
        await supabase.from('daily_activity').insert({ user_id: user.id, date: today, quizzes_completed: 1, correct_answers: correctCount, total_answers: questions.length, xp_earned: gamResult?.xpEarned || 0, perfect_quizzes: score === 100 ? 1 : 0 });
      }
    } catch (err) { console.error('Gamification update error:', err); }
    setAttempt({ ...attempt, status: 'completed', score }); setShowResults(true); setIsSubmitting(false);
    toast({ title: 'Quiz completed!', description: `You scored ${score}%` });
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const currentQuestionAnswered = currentQuestion && answeredQuestions.has(currentQuestion.id);
  const shouldShowAnswerReview = roomMode !== 'exam' || (userPreferences?.show_answers_immediately ?? true);

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
      <div className={`min-h-screen flex items-center justify-center bg-background noise-bg ${getModeBackground()}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Quiz intro screen
  if (!attempt || attempt.status === 'not_started') {
    const isExamBlocked = roomMode === 'exam' && hasCompletedAttempt;
    return (
      <div className={`min-h-screen flex flex-col bg-background noise-bg ${getModeBackground()}`}>
        <header className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
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
            <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 shadow-xl text-center">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">{quiz.title}</h1>
              {quiz.description && <p className="text-muted-foreground mb-6">{quiz.description}</p>}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <Badge className={`${quiz.difficulty === 'easy' ? 'bg-success/10 text-success' : quiz.difficulty === 'medium' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>{quiz.difficulty}</Badge>
                <Badge variant="outline">{questions.length} question{questions.length !== 1 ? 's' : ''}</Badge>
                {effectiveTimeLimit && <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{effectiveTimeLimit} min</Badge>}
              </div>
              <div className={`p-4 rounded-xl border border-border/30 mb-6 ${getModeBackground()}`}>
                <p className={`text-sm font-medium ${getModeAccentColor()}`}>
                  {roomMode === 'study' ? 'Answers revealed after each question' : roomMode === 'challenge' ? 'Timed quiz with leaderboard' : 'Single attempt, no review'}
                </p>
              </div>
              {isExamBlocked ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                    <Lock className="h-5 w-5" />
                    <div className="text-left"><p className="font-bold">Already completed</p><p className="text-sm opacity-80">Exam mode allows one attempt</p></div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>Back to Room</Button>
                </div>
              ) : (
                <Button className="w-full h-12 text-base font-bold" size="lg" onClick={startQuiz}>Start Quiz</Button>
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Results screen
  if (showResults && attempt.status === 'completed') {
    const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length;
    return (
      <div className={`min-h-screen flex flex-col bg-background noise-bg ${getModeBackground()}`}>
        {leveledUp && <div className="level-up-flash" />}
        {newAchievement && <AchievementToast name={newAchievement.name} description={newAchievement.description} icon={newAchievement.icon} xpReward={newAchievement.xp_reward} onClose={clearNewAchievement} />}
        <header className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
            <Logo />
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 container max-w-3xl py-8 px-4">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp} className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 sm:p-12 mb-8 text-center shadow-xl">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Quiz Complete</p>
              <div className="score-reveal text-7xl sm:text-8xl font-black tracking-tighter mb-4">
                {attempt.score}%
              </div>
              <p className="text-lg text-muted-foreground mb-6">{correctCount} out of {questions.length} correct</p>
              {xpEarned !== null && (
                <div className="flex items-center justify-center gap-6">
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
              <Button onClick={() => navigate(-1)} className="mt-8 h-11 px-8 font-semibold">Back to Room</Button>
            </motion.div>

            {shouldShowAnswerReview && (
              <motion.div variants={fadeUp} className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight">Review</h2>
                {questions.map((question, index) => {
                  const userAnswer = answers[question.id];
                  const isCorrect = userAnswer === question.correct_answer;
                  return (
                    <div key={question.id} className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6">
                      <div className="flex items-start gap-4 mb-4">
                        {isCorrect ? <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" /> : <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />}
                        <p className="font-serif text-lg">{index + 1}. {question.question_text}</p>
                      </div>
                      <div className="space-y-2 ml-10">
                        {question.options.map((option) => (
                          <div key={option} className={cn('p-3 rounded-lg border transition-all',
                            option === question.correct_answer && 'bg-success/10 border-success/30',
                            option === userAnswer && option !== question.correct_answer && 'bg-destructive/10 border-destructive/30',
                            option !== userAnswer && option !== question.correct_answer && 'border-border/30'
                          )}>
                            {option}
                            {option === question.correct_answer && <span className="ml-2 text-success text-sm font-medium">(Correct)</span>}
                            {option === userAnswer && option !== question.correct_answer && <span className="ml-2 text-destructive text-sm font-medium">(Your answer)</span>}
                          </div>
                        ))}
                        {question.explanation && (
                          <div className="mt-3 p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
                            <span className="font-bold text-foreground">Explanation: </span>{question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {!shouldShowAnswerReview && (
              <motion.div variants={fadeUp} className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-12 text-center">
                <Lock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Review Hidden</h3>
                <p className="text-muted-foreground">Exam mode does not allow answer review.</p>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  // Quiz in progress — fullscreen focus
  return (
    <div className={`min-h-screen flex flex-col bg-background noise-bg ${getModeBackground()}`}>
      {newAchievement && <AchievementToast name={newAchievement.name} description={newAchievement.description} icon={newAchievement.icon} xpReward={newAchievement.xp_reward} onClose={clearNewAchievement} />}

      {/* Minimal header */}
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Logo showText={false} />
        <div className="flex items-center gap-4">
          {effectiveTimeLimit && attempt.started_at && (
            <QuizTimer timeLimitMinutes={effectiveTimeLimit} startedAt={attempt.started_at} onTimeUp={handleTimeUp} isActive={!showResults && !isSubmitting} />
          )}
          <Badge variant="outline" className={`${roomMode === 'study' ? 'mode-study' : roomMode === 'challenge' ? 'mode-challenge' : 'mode-exam'} font-semibold text-xs`}>
            {roomMode}
          </Badge>
          <span className="text-sm text-muted-foreground font-mono">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-4 sm:px-8">
        <Progress value={progress} className="h-1.5 rounded-full" />
      </div>

      {/* Question — near fullscreen */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl"
          >
            <div className="flex items-start justify-between mb-10">
              <p className="font-serif text-2xl sm:text-3xl lg:text-4xl leading-relaxed text-center text-balance flex-1">
                {currentQuestion.question_text}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleBookmark(currentQuestion.id)}
                className="shrink-0 ml-4 mt-1"
                title={bookmarkedQuestions.has(currentQuestion.id) ? 'Remove bookmark' : 'Bookmark question'}
              >
                {bookmarkedQuestions.has(currentQuestion.id) ? (
                  <BookmarkCheck className="h-5 w-5 text-primary" />
                ) : (
                  <Bookmark className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>

            <div className="space-y-3 mb-10">
              {currentQuestion.options.map((option, i) => {
                const showStudyFeedback = roomMode === 'study' && currentQuestionAnswered;
                const isCorrectOption = option === currentQuestion.correct_answer;
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
                      'w-full p-5 text-left rounded-xl border-2 transition-all duration-200 font-medium text-base',
                      !showStudyFeedback && isSelected
                        ? 'border-primary bg-primary/10 shadow-md'
                        : !showStudyFeedback && 'border-border/50 hover:border-primary/40 hover:bg-primary/5',
                      showStudyFeedback && isCorrectOption && 'border-success bg-success/10',
                      showStudyFeedback && isWrongAnswer && 'border-destructive bg-destructive/10',
                      showStudyFeedback && !isCorrectOption && !isWrongAnswer && 'border-border/30 opacity-50',
                      roomMode === 'study' && currentQuestionAnswered && 'cursor-not-allowed'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-full border-2 border-current/20 flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </span>
                    {showStudyFeedback && isCorrectOption && <span className="ml-10 text-success text-sm font-bold">✓ Correct</span>}
                    {showStudyFeedback && isWrongAnswer && <span className="ml-10 text-destructive text-sm font-bold">✗ Incorrect</span>}
                  </motion.button>
                );
              })}
            </div>

            {roomMode === 'study' && currentQuestionAnswered && currentQuestion.explanation && (
              <StudyModeAnswer options={currentQuestion.options} selectedAnswer={answers[currentQuestion.id]} correctAnswer={currentQuestion.correct_answer} explanation={currentQuestion.explanation} showFeedback={true} />
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} className="font-semibold">
                Previous
              </Button>
              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={submitQuiz} disabled={isSubmitting || Object.keys(answers).length < questions.length} className="font-bold h-11 px-8">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Quiz
                </Button>
              ) : (
                <Button onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))} className="font-semibold">
                  Next
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Question dots */}
      <div className="flex justify-center gap-1.5 pb-6 flex-wrap px-4">
        {questions.map((q, i) => (
          <button key={q.id} onClick={() => setCurrentQuestionIndex(i)}
            className={cn('w-2.5 h-2.5 rounded-full transition-all duration-200',
              i === currentQuestionIndex ? 'bg-primary scale-125' : answers[q.id] ? 'bg-primary/40' : 'bg-muted-foreground/20'
            )} />
        ))}
      </div>
    </div>
  );
};

export default QuizPage;
