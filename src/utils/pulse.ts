import { supabase } from '@/integrations/supabase/client';

export async function getMemberActivity(roomId: string) {
  // Get all members
  const { data: members } = await supabase
    .from('room_members')
    .select('user_id, profile:profiles(username, display_name)')
    .eq('room_id', roomId);

  if (!members) return [];

  // Get all quiz IDs for this room
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id')
    .eq('room_id', roomId);

  const quizIds = quizzes?.map(q => q.id) || [];
  if (quizIds.length === 0) {
    return members.map((m: any) => ({
      user_id: m.user_id,
      username: m.profile?.username || 'Unknown',
      display_name: m.profile?.display_name || null,
      last_attempt_date: null,
      total_attempts: 0,
      average_score: 0,
    }));
  }

  // Get all attempts for these quizzes
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('user_id, score, completed_at')
    .in('quiz_id', quizIds)
    .eq('status', 'completed');

  const attemptsByUser: Record<string, { scores: number[]; lastDate: string | null }> = {};
  (attempts || []).forEach((a: any) => {
    if (!attemptsByUser[a.user_id]) attemptsByUser[a.user_id] = { scores: [], lastDate: null };
    attemptsByUser[a.user_id].scores.push(a.score || 0);
    if (!attemptsByUser[a.user_id].lastDate || a.completed_at > attemptsByUser[a.user_id].lastDate) {
      attemptsByUser[a.user_id].lastDate = a.completed_at;
    }
  });

  return members.map((m: any) => {
    const data = attemptsByUser[m.user_id];
    return {
      user_id: m.user_id,
      username: m.profile?.username || 'Unknown',
      display_name: m.profile?.display_name || null,
      last_attempt_date: data?.lastDate || null,
      total_attempts: data?.scores.length || 0,
      average_score: data ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
    };
  });
}

export async function getWeakQuestions(roomId: string) {
  // Get quizzes for room
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, difficulty')
    .eq('room_id', roomId);

  if (!quizzes?.length) return [];

  const quizIds = quizzes.map(q => q.id);
  const quizDiffMap: Record<string, string> = {};
  quizzes.forEach(q => { quizDiffMap[q.id] = q.difficulty; });

  // Get all questions
  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, quiz_id')
    .in('quiz_id', quizIds);

  if (!questions?.length) return [];

  // Get all completed attempts
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, answers')
    .in('quiz_id', quizIds)
    .eq('status', 'completed');

  if (!attempts?.length) return [];

  // Build question stats
  const qStats: Record<string, { text: string; difficulty: string; total: number; wrong: number }> = {};

  questions.forEach((q: any) => {
    qStats[q.id] = {
      text: q.question_text,
      difficulty: quizDiffMap[q.quiz_id] || 'medium',
      total: 0,
      wrong: 0,
    };
  });

  // Count right/wrong per question across all attempts
  const questionCorrectMap: Record<string, string> = {};
  questions.forEach((q: any) => { questionCorrectMap[q.id] = ''; }); // will fill from DB

  // Need correct answers
  const { data: questionsWithAnswers } = await supabase
    .from('questions')
    .select('id, correct_answer')
    .in('quiz_id', quizIds);

  const correctMap: Record<string, string> = {};
  (questionsWithAnswers || []).forEach((q: any) => { correctMap[q.id] = q.correct_answer; });

  attempts.forEach((attempt: any) => {
    const answers = attempt.answers as Record<string, string> || {};
    Object.entries(answers).forEach(([qId, answer]) => {
      if (qStats[qId]) {
        qStats[qId].total++;
        if (answer !== correctMap[qId]) {
          qStats[qId].wrong++;
        }
      }
    });
  });

  return Object.entries(qStats)
    .filter(([, s]) => s.total > 0)
    .sort(([, a], [, b]) => (b.wrong / b.total) - (a.wrong / a.total))
    .slice(0, 5)
    .map(([id, s]) => ({
      id,
      question_text: s.text,
      difficulty: s.difficulty,
      total_attempts: s.total,
      wrong_count: s.wrong,
      failure_ratio: Math.round((s.wrong / s.total) * 100),
    }));
}

export async function getUntouchedDocuments(roomId: string) {
  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, created_at')
    .eq('room_id', roomId);

  if (!documents?.length) return [];

  // Get all quizzes that reference documents
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('document_id')
    .eq('room_id', roomId)
    .not('document_id', 'is', null);

  const usedDocIds = new Set((quizzes || []).map((q: any) => q.document_id));

  return documents
    .filter((d: any) => !usedDocIds.has(d.id))
    .map((d: any) => ({
      id: d.id,
      name: d.name,
      created_at: d.created_at,
    }));
}

export async function getDifficultyCurve(roomId: string) {
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, difficulty')
    .eq('room_id', roomId);

  if (!quizzes?.length) return { easy: null, medium: null, hard: null };

  const byDifficulty: Record<string, string[]> = { easy: [], medium: [], hard: [] };
  quizzes.forEach((q: any) => {
    if (byDifficulty[q.difficulty]) byDifficulty[q.difficulty].push(q.id);
  });

  const result: Record<string, number | null> = { easy: null, medium: null, hard: null };

  for (const diff of ['easy', 'medium', 'hard']) {
    const ids = byDifficulty[diff];
    if (ids.length === 0) continue;

    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .in('quiz_id', ids)
      .eq('status', 'completed');

    if (attempts?.length) {
      const avg = attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / attempts.length;
      result[diff] = Math.round(avg);
    }
  }

  return result;
}
