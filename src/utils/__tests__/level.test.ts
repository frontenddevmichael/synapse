import { describe, it, expect } from 'vitest';
import { calculateLevel, getXpProgress } from '../level';

describe('calculateLevel', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('level 1: 0–99 XP', () => {
    expect(calculateLevel(50)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
  });

  it('reaches level 2 at exactly 100 XP', () => {
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(299)).toBe(2);
  });

  it('reaches level 3 at 300 XP', () => {
    expect(calculateLevel(300)).toBe(3);
    expect(calculateLevel(599)).toBe(3);
  });

  it('high XP produces correct level (progressive curve)', () => {
    expect(calculateLevel(10000)).toBe(14);
    expect(calculateLevel(5050)).toBe(10);
  });

  it('negative XP returns level 1 (floor behavior)', () => {
    expect(calculateLevel(-1)).toBe(1);
    expect(calculateLevel(-100)).toBe(1);
  });

  it('NaN XP returns level 1 (NaN comparison fails, falls through)', () => {
    expect(calculateLevel(NaN)).toBe(1);
  });

  it('very large XP does not overflow', () => {
    const level = calculateLevel(1_000_000_000);
    expect(level).toBeGreaterThan(0);
    expect(Number.isFinite(level)).toBe(true);
  });

  it('exact boundary between levels', () => {
    // Level N requires sum(100*1 + 100*2 + ... + 100*(N-1))
    // Level 2: sum(100) = 100 XP
    // Level 3: sum(100+200) = 300 XP
    // Level 4: sum(100+200+300) = 600 XP
    expect(calculateLevel(600)).toBe(4);
    expect(calculateLevel(599)).toBe(3);
  });

  it('fractional XP floors correctly', () => {
    expect(calculateLevel(100.9)).toBe(2);
    expect(calculateLevel(99.1)).toBe(1);
  });
});

describe('getXpProgress', () => {
  it('returns 0 current, 100 max at 0 XP', () => {
    const p = getXpProgress(0);
    expect(p.current).toBe(0);
    expect(p.max).toBe(100);
    expect(p.percentage).toBe(0);
  });

  it('shows progress within level 1', () => {
    const p = getXpProgress(50);
    expect(p.current).toBe(50);
    expect(p.max).toBe(100);
    expect(p.percentage).toBe(50);
  });

  it('at 100 XP (exactly level 2) progress resets to 0', () => {
    const p = getXpProgress(100);
    expect(p.current).toBe(0);
    expect(p.max).toBe(200);
    expect(p.percentage).toBe(0);
  });

  it('shows progress within level 2', () => {
    const p = getXpProgress(250);
    expect(p.current).toBe(150);
    expect(p.max).toBe(200);
  });

  it('handles large XP values', () => {
    const p = getXpProgress(5050);
    expect(p.current).toBe(550);
    expect(p.max).toBe(1000);
  });

  it('negative XP returns progress with negative current (gap: should clamp to 0)', () => {
    const p = getXpProgress(-1);
    expect(p.current).toBe(-1);
    expect(p.max).toBe(100);
    expect(p.percentage).toBe(-1);
  });

  it('fractional XP passes through without flooring (gap: should floor)', () => {
    const p = getXpProgress(50.7);
    expect(p.current).toBe(50.7);
    expect(p.max).toBe(100);
    expect(p.percentage).toBe(50.7);
  });

  it('percentage can be negative with negative XP (gap: should clamp to 0)', () => {
    const p = getXpProgress(-50);
    expect(p.percentage).toBe(-50);
  });

  it('percentage is never above 100', () => {
    // When at max XP for current level, percentage should be 0 (rolled over)
    const p = getXpProgress(100);
    expect(p.percentage).toBeGreaterThanOrEqual(0);
    expect(p.percentage).toBeLessThanOrEqual(100);
  });

  it('NaN XP propagates through (gap: should guard)', () => {
    const p = getXpProgress(NaN);
    expect(Number.isNaN(p.current)).toBe(true);
    expect(p.max).toBe(100);
    expect(Number.isNaN(p.percentage)).toBe(true);
  });
});
