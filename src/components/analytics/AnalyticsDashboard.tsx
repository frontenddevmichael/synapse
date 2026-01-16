import { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';
import { StatsCard } from './StatsCard';
import { ProgressChart } from './ProgressChart';
import { XpProgress } from '@/components/gamification/XpProgress';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface QuizAttemptData {
  score: number;
  completed_at: string;
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const { stats, achievements, earnedAchievements, isLoading: gamificationLoading, getXpProgress } = useGamification();
  const [attempts, setAttempts] = useState<QuizAttemptData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  const fetchAttempts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('quiz_attempts')
      .select('score, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (data) {
      setAttempts(data as QuizAttemptData[]);
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

  if (isLoading || gamificationLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* XP and Streak Row */}
      <div className="flex flex-wrap items-center gap-4">
        <Card className="flex-1 min-w-[200px]">
          <CardContent className="p-4">
            <XpProgress
              level={stats?.level || 1}
              currentXp={xpProgress.current}
              maxXp={xpProgress.max}
              percentage={xpProgress.percentage}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center">
            <StreakBadge days={stats?.streak_days || 0} />
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Quizzes Completed"
          value={stats?.total_quizzes_completed || 0}
          icon={<Target className="h-6 w-6" />}
        />
        <StatsCard
          title="Average Score"
          value={`${averageScore}%`}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Accuracy"
          value={`${accuracy}%`}
          subtitle={`${stats?.total_correct_answers || 0} / ${stats?.total_questions_answered || 0} correct`}
          icon={<CheckCircle className="h-6 w-6" />}
        />
        <StatsCard
          title="Total XP"
          value={stats?.xp || 0}
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      {/* Progress Chart */}
      <ProgressChart data={chartData} />

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            {earnedAchievements.size} of {achievements.length} unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {achievements.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                id={achievement.id}
                name={achievement.name}
                description={achievement.description}
                icon={achievement.icon}
                earned={earnedAchievements.has(achievement.id)}
                earnedAt={achievement.earned_at}
                xpReward={achievement.xp_reward}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
