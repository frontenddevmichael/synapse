-- =====================================================
-- Phase 4: Wedge Feature Enhancements
-- =====================================================

-- 1. Denormalize recall_cards so Recall page doesn't join questions table
ALTER TABLE public.recall_cards
  ADD COLUMN IF NOT EXISTS question_text text,
  ADD COLUMN IF NOT EXISTS correct_answer text,
  ADD COLUMN IF NOT EXISTS explanation text,
  ADD COLUMN IF NOT EXISTS options jsonb;

-- 2. create_room_recall_cards RPC: identify weakest questions from room
--    activity and create recall cards for all members
CREATE OR REPLACE FUNCTION public.create_room_recall_cards(_room_id uuid, _limit int DEFAULT 5)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member record;
  _weak record;
  _created int := 0;
  _quiz_ids uuid[];
  _total_attempts int;
BEGIN
  -- Verify caller is the room owner
  IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE id = _room_id AND owner_id = auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only the room owner can create recall cards');
  END IF;

  -- Get quiz IDs for this room
  SELECT array_agg(q.id) INTO _quiz_ids
  FROM public.quizzes q
  WHERE q.room_id = _room_id;

  IF _quiz_ids IS NULL THEN
    RETURN jsonb_build_object('created', 0, 'message', 'No quizzes found in this room');
  END IF;

  -- Build a temp table of question failure ratios
  CREATE TEMP TABLE _weak_questions ON COMMIT DROP AS
  SELECT
    q.id AS question_id,
    q.question_text,
    q.correct_answer,
    q.explanation,
    q.options,
    COUNT(qa.id) FILTER (WHERE qa.answers->>q.id::text <> q.correct_answer) AS wrong_count,
    COUNT(qa.id) AS total_count,
    CASE
      WHEN COUNT(qa.id) = 0 THEN 0
      ELSE ROUND(COUNT(qa.id) FILTER (WHERE qa.answers->>q.id::text <> q.correct_answer)::numeric / COUNT(qa.id) * 100)
    END AS failure_ratio
  FROM public.questions q
  JOIN public.quiz_attempts qa ON qa.quiz_id = q.quiz_id
  WHERE q.quiz_id = ANY(_quiz_ids)
    AND qa.status = 'completed'
  GROUP BY q.id, q.question_text, q.correct_answer, q.explanation, q.options
  HAVING COUNT(qa.id) >= 2
  ORDER BY failure_ratio DESC
  LIMIT _limit;

  SELECT COUNT(*) INTO _total_attempts FROM _weak_questions;
  IF _total_attempts = 0 THEN
    RETURN jsonb_build_object('created', 0, 'message', 'Insufficient attempt data to identify weak questions');
  END IF;

  -- For each room member, create a recall card for each weak question
  FOR _member IN SELECT user_id FROM public.room_members WHERE room_id = _room_id
  LOOP
    FOR _weak IN SELECT * FROM _weak_questions
    LOOP
      INSERT INTO public.recall_cards (user_id, question_id, question_text, correct_answer, explanation, options, interval_days, ease_factor, repetitions, next_review_at)
      VALUES (_member.user_id, _weak.question_id, _weak.question_text, _weak.correct_answer, _weak.explanation, _weak.options, 1, 2.5, 0, now())
      ON CONFLICT (user_id, question_id) DO NOTHING;
      _created := _created + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('created', _created, 'message', 'Recall cards created for room members');
END;
$$;

-- 3. Reduce achievement set to core 6 retention-focused achievements
DELETE FROM public.user_achievements
WHERE achievement_id IN (
  'quiz_master_10', 'quiz_master_50', 'streak_3', 'streak_30',
  'quick_learner', 'blitz', 'rampage', 'perfection_streak',
  'comeback_kid', 'weekend_warrior', 'night_owl', 'early_bird', 'room_creator'
);

DELETE FROM public.achievements
WHERE id IN (
  'quiz_master_10', 'quiz_master_50', 'streak_3', 'streak_30',
  'quick_learner', 'blitz', 'rampage', 'perfection_streak',
  'comeback_kid', 'weekend_warrior', 'night_owl', 'early_bird', 'room_creator'
);

-- 4. check_room_triumph RPC: detect when all room members achieve 70%+ avg
CREATE OR REPLACE FUNCTION public.check_room_triumph(_room_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member_count int;
  _qualified_count int;
  _result jsonb;
BEGIN
  SELECT COUNT(*) INTO _member_count
  FROM public.room_members WHERE room_id = _room_id;

  IF _member_count < 2 THEN
    RETURN jsonb_build_object('triumph', false, 'reason', 'Need at least 2 members');
  END IF;

  -- Count members who completed a quiz in the last 24h with avg >= 70%
  WITH member_scores AS (
    SELECT
      rm.user_id,
      COALESCE(AVG(qa.score), 0) AS avg_score,
      COUNT(qa.id) AS attempt_count
    FROM public.room_members rm
    LEFT JOIN public.quiz_attempts qa
      ON qa.user_id = rm.user_id
      AND qa.status = 'completed'
      AND qa.completed_at > now() - interval '24 hours'
    WHERE rm.room_id = _room_id
    GROUP BY rm.user_id
  )
  SELECT COUNT(*) INTO _qualified_count
  FROM member_scores
  WHERE attempt_count > 0 AND avg_score >= 70;

  IF _qualified_count >= _member_count THEN
    RETURN jsonb_build_object('triumph', true, 'member_count', _member_count);
  ELSE
    RETURN jsonb_build_object(
      'triumph', false,
      'qualified', _qualified_count,
      'total', _member_count,
      'reason', format('%s of %s members have 70%+ avg in last 24h', _qualified_count, _member_count)
    );
  END IF;
END;
$$;
