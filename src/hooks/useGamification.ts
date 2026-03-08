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
    completionTimeSeconds: number,
    hotStreakInQuiz: number
  ) => {
    if (!user) return 0;

    const toAward: string[] = [];
    const totalQuizzes = newStats.total_quizzes_completed || stats?.total_quizzes_completed || 0;
    const streakDays = newStats.streak_days || stats?.streak_days || 0;
    const currentHotStreak = newStats.hot_streak || 0;
    const perfectScores = newStats.perfect_scores || stats?.perfect_scores || 0;

    // === General achievements ===
    if (totalQuizzes >= 1 && !earnedAchievements.has('first_quiz')) toAward.push('first_quiz');
    if (totalQuizzes >= 10 && !earnedAchievements.has('quiz_master_10')) toAward.push('quiz_master_10');
    if (totalQuizzes >= 50 && !earnedAchievements.has('quiz_master_50')) toAward.push('quiz_master_50');
    if (score === 100 && !earnedAchievements.has('perfect_score')) toAward.push('perfect_score');

    // === Streak achievements ===
    if (streakDays >= 3 && !earnedAchievements.has('streak_3')) toAward.push('streak_3');
    if (streakDays >= 7 && !earnedAchievements.has('streak_7')) toAward.push('streak_7');
    if (streakDays >= 30 && !earnedAchievements.has('streak_30')) toAward.push('streak_30');

    // === Speed achievements ===
    if (completionTimeSeconds < 120 && !earnedAchievements.has('quick_learner')) toAward.push('quick_learner');
    if (completionTimeSeconds < 60 && score >= 80 && !earnedAchievements.has('blitz')) toAward.push('blitz');

    // === Hot streak (offensive) achievements ===
    if (currentHotStreak >= 5 && !earnedAchievements.has('hot_hand')) toAward.push('hot_hand');
    if (currentHotStreak >= 10 && !earnedAchievements.has('rampage')) toAward.push('rampage');

    // === Perfect score streak ===
    if (perfectScores >= 3 && !earnedAchievements.has('perfection_streak')) toAward.push('perfection_streak');

    // === Time-based achievements ===
    const hour = new Date().getHours();
    if (hour < 8 && !earnedAchievements.has('early_bird')) toAward.push('early_bird');
    if (hour >= 22 && !earnedAchievements.has('night_owl')) toAward.push('night_owl');
    const day = new Date().getDay();
    if ((day === 0 || day === 6) && !earnedAchievements.has('weekend_warrior')) toAward.push('weekend_warrior');

    // === Defensive achievements ===
    if (streakDays >= 7 && !earnedAchievements.has('fortress')) toAward.push('fortress');

    // === Social achievements (check room count) ===
    if (!earnedAchievements.has('collaborator') || !earnedAchievements.has('room_creator')) {
      const { data: memberRooms } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id);

      if (memberRooms && memberRooms.length >= 3 && !earnedAchievements.has('collaborator')) {
        toAward.push('collaborator');
      }

      const { data: ownedRooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (ownedRooms && ownedRooms.length > 0 && !earnedAchievements.has('room_creator')) {
        toAward.push('room_creator');
      }
    }

    // === Comeback kid: check if score improved by 30%+ from last attempt on same quiz ===
    // This is handled externally by passing previous score

    // Award all
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
    correctAnswers: number,
    totalQuestions: number,
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

    // Calculate hot streak from answers
    let hotStreakInQuiz = 0;
    if (questionsData && answersMap) {
      hotStreakInQuiz = calculateHotStreak(questionsData, answersMap);
    }

    // Update cumulative hot streak
    const newHotStreak = score === 100
      ? stats.hot_streak + totalQuestions  // Perfect = extend streak by all questions
      : hotStreakInQuiz; // Reset to trailing streak from this quiz
    const newBestHotStreak = Math.max(stats.best_hot_streak, newHotStreak);

    // Perfect scores counter
    const newPerfectScores = score === 100 ? stats.perfect_scores + 1 : 0; // Reset on non-perfect

    // XP multiplier based on daily streak
    const streakMultiplier = stats.streak_days >= 7 ? 1.5 : stats.streak_days >= 3 ? 1.25 : 1.0;

    // Calculate XP earned
    let xpEarned = Math.round((XP_PER_QUIZ + (correctAnswers * XP_PER_CORRECT)) * streakMultiplier);
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

    const newStats: Record<string, any> = {
      xp: stats.xp + xpEarned,
      level: calculateLevel(stats.xp + xpEarned),
      streak_days: newStreak,
      total_quizzes_completed: stats.total_quizzes_completed + 1,
      total_correct_answers: stats.total_correct_answers + correctAnswers,
      total_questions_answered: stats.total_questions_answered + totalQuestions,
      last_activity_date: today,
      hot_streak: newHotStreak,
      best_hot_streak: newBestHotStreak,
      perfect_scores: newPerfectScores,
      xp_multiplier: streakMultiplier,
    };

    // Check achievements and get bonus XP
    const achievementXp = await checkAndAwardAchievements(
      newStats as Partial<UserStats>,
      score,
      completionTimeSeconds,
      hotStreakInQuiz
    );

    // Comeback kid check
    if (previousScore !== null && previousScore !== undefined && score - previousScore >= 30) {
      const awarded = await awardAchievement('comeback_kid');
      if (awarded) {
        const a = achievements.find(x => x.id === 'comeback_kid');
        if (a && achievementXp !== undefined) {
          newStats.xp += a.xp_reward;
        }
      }
    }

    if (achievementXp) {
      newStats.xp += achievementXp;
      newStats.level = calculateLevel(newStats.xp);
    }

    // Update profile
    await supabase
      .from('profiles')
      .update(newStats)
      .eq('id', user.id);

    setStats(prev => prev ? { ...prev, ...newStats } as UserStats : null);

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
