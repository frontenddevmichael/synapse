import { describe, it, expect } from 'vitest';
import { calculateNextReview } from '../recall';

describe('calculateNextReview (SM-2) — expanded', () => {
  const defaultCard = { interval_days: 0, ease_factor: 2.5, repetitions: 0 };

  it('quality 0 (complete blackout) resets', () => {
    const card = { interval_days: 30, ease_factor: 2.5, repetitions: 10 };
    const result = calculateNextReview(card, 0);
    expect(result.interval_days).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.ease_factor).toBe(2.5);
  });

  it('quality 1 also resets', () => {
    const result = calculateNextReview(defaultCard, 1);
    expect(result.interval_days).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  it('repeated failures keep interval at 1', () => {
    let card = defaultCard;
    for (let i = 0; i < 5; i++) {
      card = calculateNextReview(card, 0);
    }
    expect(card.interval_days).toBe(1);
    expect(card.repetitions).toBe(0);
    expect(card.ease_factor).toBe(2.5);
  });

  it('pass after fail starts progression fresh', () => {
    let card = calculateNextReview(defaultCard, 0); // fail
    card = calculateNextReview(card, 4);             // pass after fail
    expect(card.repetitions).toBe(1);
    expect(card.interval_days).toBe(1);
    expect(card.ease_factor).toBe(2.6);
  });

  it('very long interval after many high-quality reviews', () => {
    let card: any = { interval_days: 0, ease_factor: 2.5, repetitions: 0 };
    for (let i = 0; i < 10; i++) {
      card = calculateNextReview(card, 5);
    }
    // After 10 passes with max quality
    expect(card.repetitions).toBe(10);
    expect(card.interval_days).toBeGreaterThan(100);
    expect(card.ease_factor).toBeCloseTo(2.5 + 10 * 0.15, 1);
    expect(card.next_review_at).toBeTruthy();
    expect(() => new Date(card.next_review_at)).not.toThrow();
  });

  it('ease_factor floor 1.3 enforced after fails', () => {
    let card: any = { interval_days: 1, ease_factor: 1.3, repetitions: 5 };
    for (let i = 0; i < 10; i++) {
      card = calculateNextReview(card, 5);
    }
    // At quality 5, ease increases by 0.15 each time
    expect(card.ease_factor).toBeGreaterThan(1.3);
    expect(card.interval_days).toBeGreaterThan(1);
  });

  it('zero interval_days on fresh card defaults to first pass logic', () => {
    const card = { interval_days: 0, ease_factor: 2.5, repetitions: 0 };
    const result = calculateNextReview(card, 3);
    expect(result.interval_days).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it('quality 3 never changes ease_factor', () => {
    let card = defaultCard;
    for (let i = 0; i < 10; i++) {
      card = calculateNextReview(card, 3);
    }
    expect(card.ease_factor).toBe(2.5);
  });

  it('next_review_at is always in the future', () => {
    const before = Date.now();
    const result = calculateNextReview(defaultCard, 0);
    expect(new Date(result.next_review_at).getTime()).toBeGreaterThan(before);
  });

  it('next_review_at scales with interval_days', () => {
    const soon = calculateNextReview(defaultCard, 3);
    const later = calculateNextReview({ interval_days: 30, ease_factor: 2.5, repetitions: 10 }, 4);
    expect(new Date(later.next_review_at).getTime()).toBeGreaterThan(new Date(soon.next_review_at).getTime());
  });

  it('large interval calculation precision', () => {
    const card = { interval_days: 365, ease_factor: 2.5, repetitions: 15 };
    const result = calculateNextReview(card, 4);
    // interval = round(365 * 2.5) = 913 days
    expect(result.interval_days).toBe(913);
    // next_review_at should be ~913 days from now
    const expectedMs = Date.now() + 913 * 24 * 60 * 60 * 1000;
    const actualMs = new Date(result.next_review_at).getTime();
    expect(Math.abs(actualMs - expectedMs)).toBeLessThan(100);
  });

  it('ease_factor does not exceed reasonable bounds after many perfect reviews', () => {
    let card = defaultCard;
    for (let i = 0; i < 5; i++) {
      card = calculateNextReview(card, 5);
    }
    // After 5 quality-5 reviews: 2.5 + (5 * 0.15) = 3.25
    expect(card.ease_factor).toBeCloseTo(3.25, 10);
    expect(card.repetitions).toBe(5);
    expect(card.next_review_at).toBeTruthy();
    expect(() => new Date(card.next_review_at)).not.toThrow();
  });

  it('alternating pass/fail does not cause exponential blowup', () => {
    let card = defaultCard;
    for (let i = 0; i < 20; i++) {
      card = calculateNextReview(card, i % 2 === 0 ? 0 : 5);
    }
    // After 10 failures (resets) and 10 passes
    expect(card.interval_days).toBeLessThan(100000);
    expect(card.repetitions).toBeLessThan(100);
  });

  it('non-integer ease_factor rounds to 1 decimal place consistently', () => {
    // Test that ease_factor increment is precise
    let card = defaultCard;
    for (let i = 0; i < 3; i++) {
      card = calculateNextReview(card, 4);
    }
    // 2.5 + 0.1 + 0.1 + 0.1 = 2.8
    expect(card.ease_factor).toBeCloseTo(2.8, 10);
  });
});
