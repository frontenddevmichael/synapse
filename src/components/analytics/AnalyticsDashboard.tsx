import { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, TrendingUp, Flame, Calendar as CalendarIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';
import { StatsCard } from './StatsCard';
import { ProgressChart } from './ProgressChart';
import { XpProgress } from '@/components/gamification/XpProgress';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { StreakBadgeEnhanced } from '@/components/gamification/StreakCounter';
import { ActivityCalendar } from '@/components/gamification/ActivityCalendar';
import { AchievementShowcase } from '@/components/gamification/AchievementShowcase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeUp, staggerFast, viewportEager } from '@/lib/motion';

interface QuizAttemptData {
  score: number;
  completed_at: string;
}

interface DailyActivityData {
  date: string;
  quizzes_completed: number;
  xp_earned: number;
  correct_answers: number;
  total_answers: number;
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const { stats, achievements, earnedAchievements, isLoading: gamificationLoading, getXpProgress } = useGamification();
  const [attempts, setAttempts] = useState<QuizAttemptData[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [attemptsRes, activityRes] = await Promise.all([
      supabase
        .from('quiz_attempts')
        .select('score, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: true }),
      supabase
        .from('daily_activity')
        .select('date, quizzes_completed, xp_earned, correct_answers, total_answers')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(84) // 12 weeks
    ]);

    if (attemptsRes.data) {
      setAttempts(attemptsRes.data as QuizAttemptData[]);
    }
    if (activityRes.data) {
      setDailyActivity(activityRes.data as DailyActivityData[]);
    }
    setIsLoading(false);
  };

  const chartData = attempts
    .filter(a => a.score !== null && a.completed_at)
    .map(a => ({
      date: a.completed_at,
      score: a.score || 0,
      quizzes: 1
    }));

  const averageScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
    : 0;

  const accuracy = stats
    ? Math.round((stats.total_correct_answers / Math.max(stats.total_questions_answered, 1)) * 100)
    : 0;

  const xpProgress = getXpProgress();

  // Transform daily activity for calendar
  const calendarActivities = dailyActivity.map(d => ({
    date: new Date(d.date),
    quizzes: d.quizzes_completed || 0,
    xp: d.xp_earned || 0,
    accuracy: d.total_answers > 0 ? (d.correct_answers / d.total_answers) * 100 : 0
  }));

  // Animation props
  const containerProps = prefersReducedMotion 
    ? {} 
    : { 
        variants: staggerFast, 
        initial: 'hidden', 
        whileInView: 'visible', 
        viewport: viewportEager 
      };

  const itemProps = prefersReducedMotion ? {} : { variants: fadeUp };

  if (isLoading || gamificationLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 sm:h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64 sm:h-80" />
      </div>
    );
  }

  return (
    <motion.div {...containerProps} className="space-y-6">
      {/* XP and Level Progress */}
      <motion.div {...itemProps} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <XpProgress
              level={stats?.level || 1}
              currentXp={xpProgress.current}
              maxXp={xpProgress.max}
              percentage={xpProgress.percentage}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <StreakBadgeEnhanced
              offensiveStreak={0}
              defensiveStreak={0}
              dailyStreak={stats?.streak_days || 0}
              hasStreakFreeze={false}
              compact
            />
            <div className="mt-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">
                {stats?.streak_days || 0} day streak
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div {...itemProps} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Quizzes"
          value={stats?.total_quizzes_completed || 0}
          icon={<Target className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
        <StatsCard
          title="Avg Score"
          value={`${averageScore}%`}
          icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
        <StatsCard
          title="Accuracy"
          value={`${accuracy}%`}
          subtitle={`${stats?.total_correct_answers || 0}/${stats?.total_questions_answered || 0}`}
          icon={<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
        <StatsCard
          title="Total XP"
          value={stats?.xp || 0}
          icon={<Clock className="h-5 w-5 sm:h-6 sm:w-6" />}
        />
      </motion.div>

      {/* Activity Calendar and Achievements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Activity Calendar */}
        <motion.div {...itemProps} className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base sm:text-lg">Activity</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Your study activity over the past 12 weeks
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <ActivityCalendar activities={calendarActivities} weeks={12} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievement Showcase */}
        <motion.div {...itemProps} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Achievements</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {earnedAchievements.size} of {achievements.length} unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AchievementShowcase
                achievements={achievements}
                userAchievements={Array.from(earnedAchievements)}
                maxDisplay={8}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress Chart */}
      <motion.div {...itemProps}>
        <ProgressChart data={chartData} />
      </motion.div>

      {/* Detailed Streaks Section */}
      <motion.div {...itemProps}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Streak Details</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Track your consistency and momentum
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StreakBadgeEnhanced
              offensiveStreak={0}
              defensiveStreak={0}
              dailyStreak={stats?.streak_days || 0}
              hasStreakFreeze={false}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
