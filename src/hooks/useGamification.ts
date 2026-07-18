import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getXpProgress } from '@/utils/level';

interface UserStats {
  xp: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
  total_quizzes_completed: number;
  total_correct_answers: number;
  total_questions_answered: number;
  hot_streak: number;
  best_hot_streak: number;
  streak_freeze_count: number;
  streak_freeze_available: boolean;
  xp_multiplier: number;
  perfect_scores: number;
  daily_goal_completed: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  requirement_value: number;
  earned_at?: string;
}

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedAchievements, setEarnedAchievements] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level, streak_days, last_activity_date, total_quizzes_completed, total_correct_answers, total_questions_answered, hot_streak, best_hot_streak, streak_freeze_count, streak_freeze_available, xp_multiplier, perfect_scores, daily_goal_completed')
      .eq('id', user.id)
      .single();

    if (profile) {
      setStats(profile as UserStats);
    }
  }, [user]);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('xp_reward');

    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, earned_at')
      .eq('user_id', user.id);

    const earnedIds = new Set(userAchievements?.map(a => a.achievement_id) || []);
    setEarnedAchievements(earnedIds);

    if (allAchievements) {
      const merged = allAchievements.map(a => ({
        ...a,
        earned_at: userAchievements?.find(ua => ua.achievement_id === a.id)?.earned_at
      }));
      setAchievements(merged as Achievement[]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([fetchStats(), fetchAchievements()]).finally(() => setIsLoading(false));
    }
  }, [user, fetchStats, fetchAchievements]);

  const getXpProgressHook = (): { current: number; max: number; percentage: number } => {
    return stats ? getXpProgress(stats.xp) : { current: 0, max: 100, percentage: 0 };
  };

  /**
   * Calculate hot streak from per-question answers.
   * Hot streak = longest consecutive correct answers ending at the last question.
   */
  const calculateHotStreak = (
    questionsInOrder: { id: string; correct_answer: string }[],
    answers: Record<string, string>
  ): number => {
    let streak = 0;
    // Count consecutive correct from the end
    for (let i = questionsInOrder.length - 1; i >= 0; i--) {
      const q = questionsInOrder[i];
      if (answers[q.id] === q.correct_answer) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const awardAchievement = async (achievementId: string): Promise<boolean> => {
    if (!user || earnedAchievements.has(achievementId)) return false;

    const { error } = await supabase.from('user_achievements').insert({
      user_id: user.id,
      achievement_id: achievementId
    });

    if (!error) {
      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement) {
        setNewAchievement(achievement);
        earnedAchievements.add(achievementId);
        return true;
      }
    }
    return false;
  };

  const checkAndAwardAchievements = async (
    newStats: Partial<UserStats>,
    score: number,
    _completionTimeSeconds: number,
    _hotStreakInQuiz: number
  ) => {
    if (!user) return 0;

    const toAward: string[] = [];
    const totalQuizzes = newStats.total_quizzes_completed || stats?.total_quizzes_completed || 0;
    const streakDays = newStats.streak_days || stats?.streak_days || 0;
    const currentHotStreak = newStats.hot_streak || 0;

    if (totalQuizzes >= 1 && !earnedAchievements.has('first_quiz')) toAward.push('first_quiz');
    if (score === 100 && !earnedAchievements.has('perfect_score')) toAward.push('perfect_score');
    if (streakDays >= 7 && !earnedAchievements.has('streak_7')) toAward.push('streak_7');
    if (currentHotStreak >= 5 && !earnedAchievements.has('hot_hand')) toAward.push('hot_hand');
    if (streakDays >= 7 && !earnedAchievements.has('fortress')) toAward.push('fortress');

    if (!earnedAchievements.has('collaborator')) {
      const { data: memberRooms } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id);

      if (memberRooms && memberRooms.length >= 3 && !earnedAchievements.has('collaborator')) {
        toAward.push('collaborator');
      }
    }

    let totalXp = 0;
    for (const achievementId of toAward) {
      const awarded = await awardAchievement(achievementId);
      if (awarded) {
        const a = achievements.find(x => x.id === achievementId);
        if (a) totalXp += a.xp_reward;
      }
    }

    return totalXp;
  };

  const updateStatsOnQuizComplete = async (
    attemptId: string,
    score: number,
    startedAt: string,
    questionsData?: { id: string; correct_answer: string }[],
    answersMap?: Record<string, string>,
    previousScore?: number | null
  ) => {
    if (!user || !stats) return;

    const now = new Date();
    const startTime = new Date(startedAt);
    const completionTimeSeconds = (now.getTime() - startTime.getTime()) / 1000;

    let hotStreakInQuiz = 0;
    if (questionsData && answersMap) {
      hotStreakInQuiz = calculateHotStreak(questionsData, answersMap);
    }

    const { data: xpResult, error: xpError } = await supabase.rpc('award_xp', {
      _attempt_id: attemptId,
    });

    if (xpError || xpResult?.error) {
      console.error('Failed to award XP:', xpError || xpResult?.error);
      return null;
    }

    const newStats: Partial<UserStats> = {
      xp: xpResult.new_xp,
      level: xpResult.new_level,
      streak_days: xpResult.new_streak,
      total_quizzes_completed: (stats.total_quizzes_completed || 0) + 1,
      perfect_scores: score === 100 ? (stats.perfect_scores || 0) + 1 : stats.perfect_scores || 0,
      hot_streak: score === 100 ? (stats.hot_streak || 0) + (questionsData?.length || 0) : hotStreakInQuiz,
    };

    const achievementXp = await checkAndAwardAchievements(
      newStats as Partial<UserStats>,
      score,
      completionTimeSeconds,
      hotStreakInQuiz
    );

    setStats(prev => prev ? {
      ...prev,
      xp: newStats.xp || prev.xp,
      level: newStats.level || prev.level,
      streak_days: newStats.streak_days ?? prev.streak_days,
      total_quizzes_completed: newStats.total_quizzes_completed || prev.total_quizzes_completed,
      hot_streak: newStats.hot_streak || prev.hot_streak,
      perfect_scores: newStats.perfect_scores || prev.perfect_scores,
    } as UserStats : null);

    return {
      xpEarned: xpResult.xp_earned + (achievementXp || 0),
      levelUp: xpResult.level_up,
      newLevel: xpResult.new_level,
    };
  };

  const clearNewAchievement = () => setNewAchievement(null);

  return {
    stats,
    achievements,
    earnedAchievements,
    isLoading,
    newAchievement,
    clearNewAchievement,
    updateStatsOnQuizComplete,
    getXpProgress: getXpProgressHook,
    refetch: () => Promise.all([fetchStats(), fetchAchievements()])
  };
}
