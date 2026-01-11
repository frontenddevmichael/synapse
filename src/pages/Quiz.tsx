import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, Lock } from 'lucide-react';
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

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Room mode and preferences
  const [roomMode, setRoomMode] = useState<RoomMode>('study');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [effectiveTimeLimit, setEffectiveTimeLimit] = useState<number | null>(null);
  
  // Study mode - track which questions have shown feedback
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  
  // Exam mode - check for previous attempts
  const [hasCompletedAttempt, setHasCompletedAttempt] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (quizId) {
      fetchQuizData();
    }
  }, [user, quizId, navigate]);

  const fetchQuizData = async () => {
    if (!quizId || !user) return;

    setIsLoading(true);

    // Fetch quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .maybeSingle();

    if (quizError || !quizData) {
      toast({
        title: 'Quiz not found',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    setQuiz(quizData as Quiz);

    // Fetch room to get mode
    const { data: roomData } = await supabase
      .from('rooms')
      .select('mode')
      .eq('id', quizData.room_id)
      .maybeSingle();

    if (roomData) {
      setRoomMode(roomData.mode as RoomMode);
    }

    // Fetch user preferences
    const { data: prefsData } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (prefsData) {
      setUserPreferences(prefsData as UserPreferences);
    }

    // Calculate effective time limit
    const timeLimit = quizData.time_limit_minutes || prefsData?.default_time_limit || null;
    // Only apply timer in challenge mode or if quiz explicitly has a time limit
    if (roomData?.mode === 'challenge' || quizData.time_limit_minutes) {
      setEffectiveTimeLimit(timeLimit);
    }

    // Fetch questions
    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index');

    if (questionsData) {
      const formattedQuestions = questionsData.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }));
      setQuestions(formattedQuestions);
    }

    // Check for existing attempt
    const { data: attemptData } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (attemptData && attemptData.length > 0) {
      const latestAttempt = attemptData[0] as QuizAttempt;
      
      // Check if user has a completed attempt (for exam mode)
      const hasCompleted = attemptData.some((a: any) => a.status === 'completed');
      setHasCompletedAttempt(hasCompleted);
      
      if (latestAttempt.status === 'completed') {
        setAttempt(latestAttempt);
        const savedAnswers = (latestAttempt.answers as Record<string, string>) || {};
        setShowResults(true);
        setAnswers(savedAnswers);
      } else if (latestAttempt.status === 'in_progress') {
        setAttempt(latestAttempt);
        const savedAnswers = (latestAttempt.answers as Record<string, string>) || {};
        setAnswers(savedAnswers);
        setAnsweredQuestions(new Set(Object.keys(savedAnswers)));
      }
    }

    setIsLoading(false);
  };

  const startQuiz = async () => {
    if (!quizId || !user) return;

    // Exam mode: prevent retake
    if (roomMode === 'exam' && hasCompletedAttempt) {
      toast({
        title: 'Quiz already completed',
        description: 'Exam mode only allows one attempt per quiz.',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        user_id: user.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        total_questions: questions.length,
        answers: {},
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Failed to start quiz',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setAttempt(data as QuizAttempt);
    setAnsweredQuestions(new Set());
  };

  const selectAnswer = async (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // In study mode, mark question as answered to show feedback
    if (roomMode === 'study') {
      setAnsweredQuestions(prev => new Set(prev).add(questionId));
    }

    // Save progress
    if (attempt) {
      await supabase
        .from('quiz_attempts')
        .update({ answers: newAnswers })
        .eq('id', attempt.id);
    }
  };

  const handleTimeUp = useCallback(async () => {
    if (!attempt || !user || isSubmitting) return;
    await submitQuiz();
  }, [attempt, user, isSubmitting]);

  const submitQuiz = async () => {
    if (!attempt || !user) return;

    setIsSubmitting(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    const { error } = await supabase
      .from('quiz_attempts')
      .update({
        status: 'completed',
        score,
        answers,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt.id);

    if (error) {
      toast({
        title: 'Failed to submit quiz',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    setAttempt({ ...attempt, status: 'completed', score });
    setShowResults(true);
    setIsSubmitting(false);

    toast({
      title: 'Quiz completed!',
      description: `You scored ${score}%`,
    });
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  
  // Study mode: check if current question has been answered
  const currentQuestionAnswered = currentQuestion && answeredQuestions.has(currentQuestion.id);
  
  // Check if we should show answer review (not in exam mode based on preferences)
  const shouldShowAnswerReview = roomMode !== 'exam' || (userPreferences?.show_answers_immediately ?? true);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success/10 text-success';
      case 'medium':
        return 'bg-warning/10 text-warning';
      case 'hard':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getModeDescription = (mode: RoomMode) => {
    switch (mode) {
      case 'study':
        return 'Answers are revealed immediately after each question';
      case 'challenge':
        return 'Timed quiz with leaderboard ranking';
      case 'exam':
        return 'Single attempt only, no answer review';
    }
  };

  if (isLoading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading quiz...</div>
      </div>
    );
  }

  // Quiz intro screen
  if (!attempt || attempt.status === 'not_started') {
    const isExamBlocked = roomMode === 'exam' && hasCompletedAttempt;
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Logo />
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              {quiz.description && (
                <CardDescription>{quiz.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap justify-center gap-2">
                <Badge className={getDifficultyColor(quiz.difficulty)}>
                  {quiz.difficulty}
                </Badge>
                <Badge variant="outline">
                  {questions.length} question{questions.length !== 1 ? 's' : ''}
                </Badge>
                {effectiveTimeLimit && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {effectiveTimeLimit} min
                  </Badge>
                )}
                <Badge variant="secondary" className="capitalize">
                  {roomMode} mode
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-sm text-muted-foreground">{getModeDescription(roomMode)}</p>
              </div>

              {isExamBlocked ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                    <Lock className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Quiz already completed</p>
                      <p className="text-sm opacity-80">Exam mode allows only one attempt</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
                    Back to Room
                  </Button>
                </div>
              ) : (
                <Button className="w-full" size="lg" onClick={startQuiz}>
                  Start Quiz
                </Button>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Results screen
  if (showResults && attempt.status === 'completed') {
    const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Logo />
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 container max-w-3xl py-8">
          <Card className="mb-8 animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
              <CardDescription>Here's how you did</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-6xl font-bold gradient-text">{attempt.score}%</div>
              <p className="text-muted-foreground">
                {correctCount} out of {questions.length} correct
              </p>
              <Button onClick={() => navigate(-1)}>Back to Room</Button>
            </CardContent>
          </Card>

          {/* Only show answer review if allowed by mode/preferences */}
          {shouldShowAnswerReview && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Review Answers</h2>
              {questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correct_answer;

                return (
                  <Card key={question.id}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {isCorrect ? (
                            <CheckCircle className="h-6 w-6 text-success" />
                          ) : (
                            <XCircle className="h-6 w-6 text-destructive" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {index + 1}. {question.question_text}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 ml-10">
                        {question.options.map((option) => (
                          <div
                            key={option}
                            className={cn(
                              'p-3 rounded-lg border',
                              option === question.correct_answer && 'bg-success/10 border-success/50',
                              option === userAnswer && option !== question.correct_answer && 'bg-destructive/10 border-destructive/50',
                              option !== userAnswer && option !== question.correct_answer && 'border-border'
                            )}
                          >
                            {option}
                            {option === question.correct_answer && (
                              <span className="ml-2 text-success text-sm">(Correct)</span>
                            )}
                            {option === userAnswer && option !== question.correct_answer && (
                              <span className="ml-2 text-destructive text-sm">(Your answer)</span>
                            )}
                          </div>
                        ))}
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Explanation: </span>
                            {question.explanation}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!shouldShowAnswerReview && (
            <Card>
              <CardContent className="flex flex-col items-center py-8 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Answer Review Hidden</h3>
                <p className="text-muted-foreground">
                  Exam mode does not allow answer review to maintain test integrity.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          {/* Timer - show in challenge mode or if quiz has time limit */}
          {effectiveTimeLimit && attempt.started_at && (
            <QuizTimer
              timeLimitMinutes={effectiveTimeLimit}
              startedAt={attempt.started_at}
              onTimeUp={handleTimeUp}
              isActive={!showResults && !isSubmitting}
            />
          )}
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Progress bar */}
      <Progress value={progress} className="h-1 rounded-none" />

      <main className="flex-1 container max-w-3xl py-8">
        {currentQuestion && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl">
                {currentQuestionIndex + 1}. {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  // In study mode after answering, highlight correct/incorrect
                  const showStudyFeedback = roomMode === 'study' && currentQuestionAnswered;
                  const isCorrect = option === currentQuestion.correct_answer;
                  const isSelected = answers[currentQuestion.id] === option;
                  const isWrongAnswer = showStudyFeedback && isSelected && !isCorrect;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => selectAnswer(currentQuestion.id, option)}
                      disabled={roomMode === 'study' && currentQuestionAnswered}
                      className={cn(
                        'w-full p-4 text-left rounded-lg border transition-colors',
                        // Default states
                        !showStudyFeedback && answers[currentQuestion.id] === option
                          ? 'border-primary bg-primary/10'
                          : !showStudyFeedback && 'border-border hover:border-primary/50',
                        // Study mode feedback states
                        showStudyFeedback && isCorrect && 'border-success bg-success/10',
                        showStudyFeedback && isWrongAnswer && 'border-destructive bg-destructive/10',
                        showStudyFeedback && !isCorrect && !isWrongAnswer && 'border-border opacity-50',
                        // Disabled state
                        roomMode === 'study' && currentQuestionAnswered && 'cursor-not-allowed'
                      )}
                    >
                      {option}
                      {showStudyFeedback && isCorrect && (
                        <span className="ml-2 text-success text-sm">(Correct)</span>
                      )}
                      {showStudyFeedback && isWrongAnswer && (
                        <span className="ml-2 text-destructive text-sm">(Incorrect)</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Study mode: show explanation after answering */}
              {roomMode === 'study' && currentQuestionAnswered && currentQuestion.explanation && (
                <StudyModeAnswer
                  options={currentQuestion.options}
                  selectedAnswer={answers[currentQuestion.id]}
                  correctAnswer={currentQuestion.correct_answer}
                  explanation={currentQuestion.explanation}
                  showFeedback={true}
                />
              )}

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={submitQuiz}
                    disabled={isSubmitting || Object.keys(answers).length < questions.length}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  >
                    Next
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question navigation dots */}
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(i)}
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                i === currentQuestionIndex
                  ? 'bg-primary'
                  : answers[q.id]
                  ? 'bg-primary/50'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default QuizPage;
