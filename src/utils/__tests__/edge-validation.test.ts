import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the edge function's validation schema for testing
const RequestSchema = z.object({
  content: z.string().min(1, "Document content is required").max(50000, "Content too long"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  questionCount: z.number().int().min(5).max(25).optional().default(10),
});

describe('Edge function validation schema', () => {
  it('accepts valid request', () => {
    const result = RequestSchema.safeParse({
      content: 'Some study content here',
      difficulty: 'hard',
      questionCount: 15,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('Some study content here');
      expect(result.data.difficulty).toBe('hard');
      expect(result.data.questionCount).toBe(15);
    }
  });

  it('applies default difficulty (medium)', () => {
    const result = RequestSchema.safeParse({
      content: 'Content',
      questionCount: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.difficulty).toBe('medium');
  });

  it('applies default questionCount (10)', () => {
    const result = RequestSchema.safeParse({
      content: 'Content',
      difficulty: 'easy',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.questionCount).toBe(10);
  });

  it('rejects empty content', () => {
    const result = RequestSchema.safeParse({
      content: '',
      difficulty: 'medium',
      questionCount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects content exceeding 50000 chars', () => {
    const result = RequestSchema.safeParse({
      content: 'x'.repeat(50001),
      difficulty: 'medium',
      questionCount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('accepts content exactly at 50000 limit', () => {
    const result = RequestSchema.safeParse({
      content: 'x'.repeat(50000),
      difficulty: 'medium',
      questionCount: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid difficulty', () => {
    const result = RequestSchema.safeParse({
      content: 'Content',
      difficulty: 'extreme',
      questionCount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects questionCount below 5', () => {
    const result = RequestSchema.safeParse({
      content: 'Content',
      difficulty: 'medium',
      questionCount: 4,
    });
    expect(result.success).toBe(false);
  });

  it('rejects questionCount above 25', () => {
    const result = RequestSchema.safeParse({
      content: 'Content',
      difficulty: 'medium',
      questionCount: 26,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer questionCount', () => {
    const result = RequestSchema.safeParse({
      content: 'Content',
      difficulty: 'medium',
      questionCount: 10.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing content field entirely', () => {
    const result = RequestSchema.safeParse({
      difficulty: 'medium',
      questionCount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects null content', () => {
    const result = RequestSchema.safeParse({
      content: null,
      difficulty: 'medium',
      questionCount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-string content (number)', () => {
    const result = RequestSchema.safeParse({
      content: 12345,
      difficulty: 'medium',
      questionCount: 10,
    });
    expect(result.success).toBe(false);
  });

  it('accepts content with unicode and emoji', () => {
    const result = RequestSchema.safeParse({
      content: "What is Schrödinger's cat? 🐱 Quantum physics is weird. π ≈ 3.14",
      difficulty: 'hard',
      questionCount: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative questionCount', () => {
    const result = RequestSchema.safeParse({
      content: 'Content',
      difficulty: 'medium',
      questionCount: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects questionCount as string', () => {
    const result = RequestSchema.safeParse({
      content: 'Content',
      difficulty: 'medium',
      questionCount: '10',
    });
    expect(result.success).toBe(false);
  });
});
