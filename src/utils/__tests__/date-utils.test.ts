import { describe, it, expect } from 'vitest';

// Replicate the award_xp RPC's streak calculation logic in pure JS for testing
function calculateStreak(
  lastActivityDate: string | null,
  today: string,
  currentStreak: number
): number {
  if (!lastActivityDate) return 1;

  const lastDate = new Date(lastActivityDate).toISOString().slice(0, 10);
  const todayDate = new Date(today).toISOString().slice(0, 10);
  const yesterdayDate = new Date(new Date(today).getTime() - 86400000).toISOString().slice(0, 10);

  if (lastDate === yesterdayDate) return currentStreak + 1;
  if (lastDate !== todayDate) return 1;
  return currentStreak; // already logged today
}

function calculateXp(
  correctCount: number,
  totalCount: number,
  streakDays: number,
  score: number
): { xp: number; multiplier: number } {
  const multiplier = streakDays >= 7 ? 1.5 : streakDays >= 3 ? 1.25 : 1.0;
  let xp = Math.round((25 + (correctCount * 10)) * multiplier);
  if (score === 100) xp += 50;
  return { xp, multiplier };
}

function calculateHotStreak(score: number, totalCount: number, correctCount: number, currentHotStreak: number): number {
  return score === 100 ? currentHotStreak + totalCount : correctCount;
}

describe('Streak calculation (server-side logic)', () => {
  const today = '2026-07-18T12:00:00Z';

  it('first activity ever starts streak at 1', () => {
    expect(calculateStreak(null, today, 0)).toBe(1);
  });

  it('activity yesterday increments streak', () => {
    const yesterday = new Date(new Date(today).getTime() - 86400000).toISOString();
    expect(calculateStreak(yesterday, today, 5)).toBe(6);
  });

  it('activity today does not change streak', () => {
    expect(calculateStreak(today, today, 5)).toBe(5);
  });

  it('activity two days ago resets streak to 1', () => {
    const twoDaysAgo = new Date(new Date(today).getTime() - 2 * 86400000).toISOString();
    expect(calculateStreak(twoDaysAgo, today, 10)).toBe(1);
  });

  it('activity a week ago resets streak to 1', () => {
    const weekAgo = new Date(new Date(today).getTime() - 7 * 86400000).toISOString();
    expect(calculateStreak(weekAgo, today, 20)).toBe(1);
  });

  it('streak continues across month boundary', () => {
    const endOfMonth = '2026-01-31T23:59:00Z';
    const startOfNextMonth = '2026-02-01T12:00:00Z';
    expect(calculateStreak(endOfMonth, startOfNextMonth, 15)).toBe(16);
  });

  it('streak continues across year boundary', () => {
    const endOfYear = '2025-12-31T23:59:00Z';
    const startOfNextYear = '2026-01-01T00:01:00Z';
    expect(calculateStreak(endOfYear, startOfNextYear, 100)).toBe(101);
  });

  it('DST spring-forward does not break streak', () => {
    // DST change: March 8 2026 -> March 9 2026 (US: spring forward)
    const beforeDST = '2026-03-08T10:00:00-05:00';
    const afterDST = '2026-03-09T10:00:00-04:00';
    // These are consecutive dates regardless of timezone offset
    expect(calculateStreak(beforeDST, afterDST, 30)).toBe(31);
  });

  it('DST fall-back does not break streak', () => {
    const beforeDST = '2026-11-01T10:00:00-04:00';
    const afterDST = '2026-11-02T10:00:00-05:00';
    expect(calculateStreak(beforeDST, afterDST, 60)).toBe(61);
  });

  it('same day activity multiple times preserves streak', () => {
    const morning = '2026-07-18T08:00:00Z';
    const evening = '2026-07-18T20:00:00Z';
    expect(calculateStreak(morning, evening, 7)).toBe(7);
  });
});

describe('XP calculation (server-side logic)', () => {
  it('base XP: 25 + 10 per correct answer at 1x multiplier', () => {
    const result = calculateXp(5, 10, 0, 80);
    expect(result.xp).toBe(75); // 25 + (5*10) = 75
    expect(result.multiplier).toBe(1.0);
  });

  it('1.25x multiplier at 3-day streak', () => {
    const result = calculateXp(5, 10, 3, 80);
    expect(result.xp).toBe(94); // round(75 * 1.25)
    expect(result.multiplier).toBe(1.25);
  });

  it('1.5x multiplier at 7-day streak', () => {
    const result = calculateXp(5, 10, 7, 80);
    expect(result.xp).toBe(113); // round(75 * 1.5)
    expect(result.multiplier).toBe(1.5);
  });

  it('perfect score (100) adds 50 XP bonus', () => {
    const result = calculateXp(10, 10, 0, 100);
    expect(result.xp).toBe(175); // (25 + 100) + 50 = 175
  });

  it('perfect score with 7-day streak', () => {
    const result = calculateXp(10, 10, 7, 100);
    expect(result.xp).toBe(238); // round(125 * 1.5) + 50 = round(187.5) + 50 = 188 + 50 = 238
  });

  it('zero correct answers still gives base XP', () => {
    const result = calculateXp(0, 10, 0, 0);
    expect(result.xp).toBe(25);
  });

  it('all correct without perfect score (no bonus)', () => {
    const result = calculateXp(10, 10, 0, 99);
    expect(result.xp).toBe(125); // (25 + 100) = 125, no bonus since score != 100
  });
});

describe('Hot streak calculation (server-side logic)', () => {
  it('100% score adds total questions to current hot streak', () => {
    expect(calculateHotStreak(100, 10, 10, 5)).toBe(15);
  });

  it('non-perfect score resets hot streak to correct count', () => {
    expect(calculateHotStreak(80, 10, 8, 20)).toBe(8);
  });

  it('zero score starts hot streak at 0', () => {
    expect(calculateHotStreak(0, 10, 0, 5)).toBe(0);
  });

  it('perfect score with 1 question increments by 1', () => {
    expect(calculateHotStreak(100, 1, 1, 0)).toBe(1);
  });
});
