// SM-2 Spaced Repetition Algorithm
// Pure function — no side effects, no Supabase calls

interface CardState {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

interface CardUpdate extends CardState {
  next_review_at: string;
}

/**
 * SM-2 algorithm implementation
 * @param card Current card state
 * @param quality Rating 0-5 (0=complete blackout, 5=perfect response)
 * @returns Updated card state with next_review_at
 */
export function calculateNextReview(card: CardState, quality: number): CardUpdate {
  const EASE_FLOOR = 1.3;
  let { interval_days, ease_factor, repetitions } = card;

  if (quality <= 2) {
    // Failed — reset
    repetitions = 0;
    interval_days = 1;
    // ease_factor unchanged
  } else {
    // Passed — advance
    repetitions += 1;

    if (repetitions === 1) {
      interval_days = 1;
    } else if (repetitions === 2) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }

    if (quality === 4) {
      ease_factor += 0.1;
    } else if (quality === 5) {
      ease_factor += 0.15;
    }
    // quality === 3: ease_factor unchanged
  }

  // Floor
  if (ease_factor < EASE_FLOOR) ease_factor = EASE_FLOOR;

  const now = new Date();
  const next = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);

  return {
    interval_days,
    ease_factor,
    repetitions,
    next_review_at: next.toISOString(),
  };
}
