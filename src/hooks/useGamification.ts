import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  xp: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
  total_quizzes_completed: number;
  total_correct_answers: number;
  total_questions_answered: number;
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

const XP_PER_LEVEL = 100;
const XP_PER_CORRECT = 10;
const XP_PER_QUIZ = 25;
const XP_BONUS_PERFECT = 50;

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
      .select('xp, level, streak_days, last_activity_date, total_quizzes_completed, total_correct_answers, total_questions_answered')
      .eq('id', user.id)
      .single();

    if (profile) {
      setStats(profile as UserStats);
    }
  }, [user]);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;

    // Fetch all achievements
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('xp_reward');

    // Fetch user's earned achievements
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

  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
  };

  const getXpProgress = (): { current: number; max: number; percentage: number } => {
    if (!stats) return { current: 0, max: XP_PER_LEVEL, percentage: 0 };
    const currentLevelXp = stats.xp % XP_PER_LEVEL;
    return {
      current: currentLevelXp,
      max: XP_PER_LEVEL,
      percentage: (currentLevelXp / XP_PER_LEVEL) * 100
    };
  };

  const checkAndAwardAchievements = async (
    newStats: Partial<UserStats>,
    score?: number,
    completionTimeSeconds?: number
  ) => {
    if (!user) return;

    const toAward: string[] = [];
    const totalQuizzes = newStats.total_quizzes_completed || stats?.total_quizzes_completed || 0;
    const streakDays = newStats.streak_days || stats?.streak_days || 0;

    // First quiz
    if (totalQuizzes >= 1 && !earnedAchievements.has('first_quiz')) {
      toAward.push('first_quiz');
    }

    // Quiz milestones
    if (totalQuizzes >= 10 && !earnedAchievements.has('quiz_master_10')) {
      toAward.push('quiz_master_10');
    }
    if (totalQuizzes >= 50 && !earnedAchievements.has('quiz_master_50')) {
      toAward.push('quiz_master_50');
    }

    // Perfect score
    if (score === 100 && !earnedAchievements.has('perfect_score')) {
      toAward.push('perfect_score');
    }

    // Streak achievements
    if (streakDays >= 3 && !earnedAchievements.has('streak_3')) {
      toAward.push('streak_3');
    }
    if (streakDays >= 7 && !earnedAchievements.has('streak_7')) {
      toAward.push('streak_7');
    }
    if (streakDays >= 30 && !earnedAchievements.has('streak_30')) {
      toAward.push('streak_30');
    }

    // Quick learner (under 2 minutes)
    if (completionTimeSeconds && completionTimeSeconds < 120 && !earnedAchievements.has('quick_learner')) {
      toAward.push('quick_learner');
    }

    // Award achievements
    for (const achievementId of toAward) {
      const { error } = await supabase.from('user_achievements').insert({
        user_id: user.id,
        achievement_id: achievementId
      });

      if (!error) {
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
          setNewAchievement(achievement);
          earnedAchievements.add(achievementId);
        }
      }
    }

    // Return total XP from achievements
    return achievements
      .filter(a => toAward.includes(a.id))
      .reduce((sum, a) => sum + a.xp_reward, 0);
  };

  const updateStatsOnQuizComplete = async (
    correctAnswers: number,
    totalQuestions: number,
    score: number,
    startedAt: string
  ) => {
    if (!user || !stats) return;

    const now = new Date();
    const startTime = new Date(startedAt);
    const completionTimeSeconds = (now.getTime() - startTime.getTime()) / 1000;

    // Calculate XP earned
    let xpEarned = XP_PER_QUIZ + (correctAnswers * XP_PER_CORRECT);
    if (score === 100) {
      xpEarned += XP_BONUS_PERFECT;
    }

    // Update streak
    const today = now.toISOString().split('T')[0];
    const lastActivity = stats.last_activity_date;
    let newStreak = stats.streak_days;

    if (lastActivity) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastActivity === yesterdayStr) {
        newStreak += 1;
      } else if (lastActivity !== today) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newStats = {
      xp: stats.xp + xpEarned,
      level: calculateLevel(stats.xp + xpEarned),
      streak_days: newStreak,
      total_quizzes_completed: stats.total_quizzes_completed + 1,
      total_correct_answers: stats.total_correct_answers + correctAnswers,
      total_questions_answered: stats.total_questions_answered + totalQuestions,
      last_activity_date: today
    };

    // Check achievements and get bonus XP
    const achievementXp = await checkAndAwardAchievements(newStats, score, completionTimeSeconds);
    if (achievementXp) {
      newStats.xp += achievementXp;
      newStats.level = calculateLevel(newStats.xp);
    }

    // Update profile
    await supabase
      .from('profiles')
      .update(newStats)
      .eq('id', user.id);

    setStats(prev => prev ? { ...prev, ...newStats } : null);

    return {
      xpEarned: xpEarned + (achievementXp || 0),
      levelUp: newStats.level > stats.level,
      newLevel: newStats.level
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
    getXpProgress,
    refetch: () => Promise.all([fetchStats(), fetchAchievements()])
  };
}
