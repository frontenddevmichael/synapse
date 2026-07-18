import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = vi.hoisted(() => {
  const chain: any = {};
  const buildChain = (data: any) => ({
    select: vi.fn(() => buildChain(data)),
    eq: vi.fn(() => buildChain(data)),
    in: vi.fn(() => buildChain(data)),
    not: vi.fn(() => buildChain(data)),
    order: vi.fn(() => buildChain(data)),
    then: vi.fn((cb: any) => Promise.resolve(cb({ data, error: null }))),
  });
  return {
    from: vi.fn((table: string) => buildChain(undefined)),
    buildChain,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

import { getMemberActivity, getWeakQuestions, getUntouchedDocuments, getDifficultyCurve } from '../pulse';

function mockData(data: any) {
  const chain: any = {};
  const build = () => ({
    select: vi.fn(() => build()),
    eq: vi.fn(() => build()),
    in: vi.fn(() => build()),
    not: vi.fn(() => build()),
    order: vi.fn(() => build()),
    then: vi.fn((cb: any) => Promise.resolve(cb({ data, error: null }))),
  });
  return build();
}

describe('getMemberActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when no members', async () => {
    mockSupabase.from.mockReturnValue(mockData(null));
    const result = await getMemberActivity('room-1');
    expect(result).toEqual([]);
  });

  it('returns member data with zero stats when no quizzes', async () => {
    const members = [
      { user_id: 'u1', profile: { username: 'alice', display_name: null } },
    ];
    mockSupabase.from
      .mockReturnValueOnce(mockData(members))
      .mockReturnValueOnce(mockData([]));

    const result = await getMemberActivity('room-1');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('alice');
    expect(result[0].total_attempts).toBe(0);
    expect(result[0].average_score).toBe(0);
  });

  it('aggregates scores correctly across multiple attempts', async () => {
    const members = [{ user_id: 'u1', profile: { username: 'alice', display_name: null } }];
    const quizzes = [{ id: 'q1' }];
    const attempts = [
      { user_id: 'u1', score: 80, completed_at: '2026-07-18T10:00:00Z' },
      { user_id: 'u1', score: 90, completed_at: '2026-07-18T12:00:00Z' },
    ];

    mockSupabase.from
      .mockReturnValueOnce(mockData(members))
      .mockReturnValueOnce(mockData(quizzes))
      .mockReturnValueOnce(mockData(attempts));

    const result = await getMemberActivity('room-1');
    expect(result[0].total_attempts).toBe(2);
    expect(result[0].average_score).toBe(85);
    expect(result[0].last_attempt_date).toBe('2026-07-18T12:00:00Z');
  });

  it('handles members with no attempts', async () => {
    const members = [
      { user_id: 'u1', profile: { username: 'alice', display_name: null } },
      { user_id: 'u2', profile: { username: 'bob', display_name: null } },
    ];
    const quizzes = [{ id: 'q1' }];
    const attempts = [{ user_id: 'u1', score: 80, completed_at: '2026-07-18T10:00:00Z' }];

    mockSupabase.from
      .mockReturnValueOnce(mockData(members))
      .mockReturnValueOnce(mockData(quizzes))
      .mockReturnValueOnce(mockData(attempts));

    const result = await getMemberActivity('room-1');
    expect(result[0].total_attempts).toBe(1);
    expect(result[1].total_attempts).toBe(0);
    expect(result[1].average_score).toBe(0);
  });
});

describe('getWeakQuestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when no quizzes', async () => {
    mockSupabase.from.mockReturnValue(mockData([]));
    const result = await getWeakQuestions('room-1');
    expect(result).toEqual([]);
  });

  it('returns questions sorted by failure ratio', async () => {
    const quizzes = [{ id: 'q1', difficulty: 'easy' }, { id: 'q2', difficulty: 'hard' }];
    const questions = [
      { id: 'qu1', question_text: 'Easy Q', quiz_id: 'q1' },
      { id: 'qu2', question_text: 'Hard Q', quiz_id: 'q2' },
    ];
    const correctAnswers = [
      { id: 'qu1', correct_answer: '4' },
      { id: 'qu2', correct_answer: 'physics' },
    ];
    const attempts = [
      { quiz_id: 'q1', answers: { qu1: '4' } },
      { quiz_id: 'q2', answers: { qu2: 'wrong' } },
    ];

    mockSupabase.from
      .mockReturnValueOnce(mockData(quizzes))
      .mockReturnValueOnce(mockData(questions))
      .mockReturnValueOnce(mockData(attempts))
      .mockReturnValueOnce(mockData(correctAnswers));

    const result = await getWeakQuestions('room-1');
    expect(result).toHaveLength(2);
    expect(result[0].failure_ratio).toBe(100); // qu2: 1/1 wrong
    expect(result[1].failure_ratio).toBe(0);   // qu1: 0/1 wrong
  });
});

describe('getUntouchedDocuments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when no documents', async () => {
    mockSupabase.from.mockReturnValue(mockData([]));
    const result = await getUntouchedDocuments('room-1');
    expect(result).toEqual([]);
  });

  it('filters out documents that have been used in quizzes', async () => {
    mockSupabase.from
      .mockReturnValueOnce(mockData([
        { id: 'd1', name: 'Used doc', created_at: '2026-07-01T00:00:00Z' },
        { id: 'd2', name: 'Unused doc', created_at: '2026-07-02T00:00:00Z' },
      ]))
      .mockReturnValueOnce(mockData([{ document_id: 'd1' }]));

    const result = await getUntouchedDocuments('room-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d2');
  });
});

describe('getDifficultyCurve', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns nulls when no quizzes', async () => {
    mockSupabase.from.mockReturnValue(mockData([]));
    const result = await getDifficultyCurve('room-1');
    expect(result).toEqual({ easy: null, medium: null, hard: null });
  });

  it('averages scores per difficulty', async () => {
    const quizzes = [{ id: 'q1', difficulty: 'easy' }, { id: 'q2', difficulty: 'hard' }];

    mockSupabase.from
      .mockReturnValueOnce(mockData(quizzes))
      .mockReturnValueOnce(mockData([{ score: 80 }, { score: 90 }]))
      .mockReturnValueOnce(mockData([]))
      .mockReturnValueOnce(mockData([]));

    const result = await getDifficultyCurve('room-1');
    expect(result.easy).toBe(85);
    expect(result.medium).toBeNull();
    expect(result.hard).toBeNull();
  });
});
