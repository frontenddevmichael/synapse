-- =====================================================
-- Phase 2: Security & Trust-Boundary Hardening
-- =====================================================

-- 1. Drop raw INSERT policy on room_members (join_room_by_code RPC is the sanctioned path)
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;

-- 2. Restrict profiles UPDATE: only allow profile info fields, not gamification
--    Uses a trigger with set_config bypass so award_xp RPC can modify gamification fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile info" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_gamification_tampering()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.skip_gamification_check', true) = 'true' THEN
    RETURN NEW;
  END IF;
  IF NEW.xp IS DISTINCT FROM OLD.xp
    OR NEW.level IS DISTINCT FROM OLD.level
    OR NEW.streak_days IS DISTINCT FROM OLD.streak_days
    OR NEW.last_activity_date IS DISTINCT FROM OLD.last_activity_date
    OR NEW.total_quizzes_completed IS DISTINCT FROM OLD.total_quizzes_completed
    OR NEW.total_correct_answers IS DISTINCT FROM OLD.total_correct_answers
    OR NEW.total_questions_answered IS DISTINCT FROM OLD.total_questions_answered
    OR NEW.hot_streak IS DISTINCT FROM OLD.hot_streak
    OR NEW.best_hot_streak IS DISTINCT FROM OLD.best_hot_streak
    OR NEW.perfect_scores IS DISTINCT FROM OLD.perfect_scores
    OR NEW.xp_multiplier IS DISTINCT FROM OLD.xp_multiplier
  THEN
    RAISE EXCEPTION 'Cannot directly modify gamification fields';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_gamification_tampering
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_gamification_tampering();

-- 3. Restrict quiz_attempts UPDATE: allow saving answers during quiz, but not score
DROP POLICY IF EXISTS "Users can update own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can update own in-progress attempts" ON public.quiz_attempts
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'in_progress')
  WITH CHECK (auth.uid() = user_id AND status = 'in_progress');

-- 4. Create questions_public view (excludes correct_answer)
CREATE OR REPLACE VIEW public.questions_public AS
SELECT
  id,
  quiz_id,
  question_text,
  question_type,
  options,
  explanation,
  order_index
FROM public.questions;

GRANT SELECT ON public.questions_public TO authenticated;

-- 5. Helper: is_room_member (used by check_answer)
CREATE OR REPLACE FUNCTION public.is_room_member(_uid uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE user_id = _uid AND room_id = _room_id
  );
$$;

-- 6. check_answer for study mode instant feedback
CREATE OR REPLACE FUNCTION public.check_answer(
  _question_id uuid,
  _answer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _quiz_id uuid;
  _correct text;
  _explanation text;
  _room_id uuid;
BEGIN
  SELECT q.quiz_id, q.correct_answer, q.explanation
  INTO _quiz_id, _correct, _explanation
  FROM public.questions q
  WHERE q.id = _question_id;

  IF _quiz_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;

  SELECT q.room_id INTO _room_id
  FROM public.quizzes q
  WHERE q.id = _quiz_id;

  IF NOT public.is_room_member(auth.uid(), _room_id) THEN
    RETURN jsonb_build_object('error', 'Not a room member');
  END IF;

  RETURN jsonb_build_object(
    'correct', (_answer = _correct),
    'correct_answer', _correct,
    'explanation', _explanation
  );
END;
$$;

-- 7. grade_quiz (server-side scoring)
CREATE OR REPLACE FUNCTION public.grade_quiz(_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _quiz_id uuid;
  _answers jsonb;
  _correct_count int := 0;
  _total_count int := 0;
  _score int;
  _q record;
  _correct_answers jsonb := '{}'::jsonb;
  _room_mode text;
BEGIN
  SELECT qa.user_id, qa.quiz_id, qa.answers
  INTO _user_id, _quiz_id, _answers
  FROM public.quiz_attempts qa
  WHERE qa.id = _attempt_id;

  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Attempt not found');
  END IF;

  IF _user_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT r.mode INTO _room_mode
  FROM public.quizzes q
  JOIN public.rooms r ON r.id = q.room_id
  WHERE q.id = _quiz_id;

  FOR _q IN
    SELECT q.id, q.correct_answer, q.explanation
    FROM public.questions q
    WHERE q.quiz_id = _quiz_id
    ORDER BY q.order_index
  LOOP
    _total_count := _total_count + 1;
    IF _answers ? _q.id::text AND _answers->>_q.id::text = _q.correct_answer THEN
      _correct_count := _correct_count + 1;
    END IF;
    _correct_answers := _correct_answers || jsonb_build_object(
      _q.id::text,
      jsonb_build_object('correct_answer', _q.correct_answer, 'explanation', _q.explanation)
    );
  END LOOP;

  IF _total_count = 0 THEN
    RETURN jsonb_build_object('error', 'No questions found');
  END IF;

  _score := round((_correct_count::numeric / _total_count) * 100);

  UPDATE public.quiz_attempts
  SET
    status = 'completed',
    score = _score,
    completed_at = now()
  WHERE id = _attempt_id;

  RETURN jsonb_build_object(
    'score', _score,
    'correct_count', _correct_count,
    'total_count', _total_count,
    'correct_answers', _correct_answers
  );
END;
$$;

-- 8. award_xp (server-side XP/level/streak)
CREATE OR REPLACE FUNCTION public.award_xp(_attempt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _score int;
  _started_at timestamptz;
  _total_count int;
  _correct_count int;
  _profile record;
  _xp_earned int;
  _new_xp int;
  _new_level int;
  _new_streak int;
  _today date;
  _yesterday date;
  _multiplier numeric;
  _hot_streak int;
  _lvl int;
  _xp_needed int;
BEGIN
  SELECT qa.user_id, qa.score, qa.started_at
  INTO _user_id, _score, _started_at
  FROM public.quiz_attempts qa
  WHERE qa.id = _attempt_id AND qa.status = 'completed';

  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Attempt not found or not yet graded');
  END IF;

  IF _user_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT qa.total_questions INTO _total_count
  FROM public.quiz_attempts qa
  WHERE qa.id = _attempt_id;

  IF _total_count IS NULL OR _total_count = 0 THEN
    SELECT COUNT(*)::int INTO _total_count
    FROM public.questions q
    JOIN public.quiz_attempts qa ON qa.quiz_id = q.quiz_id
    WHERE qa.id = _attempt_id;
  END IF;

  _correct_count := round((_score::numeric / 100) * _total_count);

  SELECT * INTO _profile
  FROM public.profiles
  WHERE id = _user_id;

  IF _profile.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  _multiplier := CASE
    WHEN _profile.streak_days >= 7 THEN 1.5
    WHEN _profile.streak_days >= 3 THEN 1.25
    ELSE 1.0
  END;

  _xp_earned := round((25 + (_correct_count * 10))::numeric * _multiplier)::int;
  IF _score = 100 THEN
    _xp_earned := _xp_earned + 50;
  END IF;

  _new_xp := _profile.xp + _xp_earned;
  _lvl := 1;
  _xp_needed := 0;
  LOOP
    EXIT WHEN _xp_needed + (100 * _lvl) > _new_xp;
    _xp_needed := _xp_needed + (100 * _lvl);
    _lvl := _lvl + 1;
  END LOOP;
  _new_level := _lvl;

  _today := now()::date;
  _yesterday := (now() - interval '1 day')::date;

  IF _profile.last_activity_date IS NOT NULL THEN
    IF _profile.last_activity_date = _yesterday THEN
      _new_streak := _profile.streak_days + 1;
    ELSIF _profile.last_activity_date <> _today THEN
      _new_streak := 1;
    ELSE
      _new_streak := _profile.streak_days;
    END IF;
  ELSE
    _new_streak := 1;
  END IF;

  _hot_streak := CASE WHEN _score = 100 THEN _profile.hot_streak + _total_count ELSE _correct_count END;

  PERFORM set_config('app.skip_gamification_check', 'true', true);

  UPDATE public.profiles
  SET
    xp = _new_xp,
    level = _new_level,
    streak_days = _new_streak,
    last_activity_date = _today,
    total_quizzes_completed = _profile.total_quizzes_completed + 1,
    total_correct_answers = _profile.total_correct_answers + _correct_count,
    total_questions_answered = _profile.total_questions_answered + _total_count,
    hot_streak = _hot_streak,
    best_hot_streak = GREATEST(_profile.best_hot_streak, _hot_streak),
    perfect_scores = CASE WHEN _score = 100 THEN _profile.perfect_scores + 1 ELSE _profile.perfect_scores END,
    xp_multiplier = _multiplier
  WHERE id = _user_id;

  INSERT INTO public.daily_activity (user_id, date, quizzes_completed, correct_answers, total_answers, xp_earned, perfect_quizzes)
  VALUES (_user_id, _today, 1, _correct_count, _total_count, _xp_earned, CASE WHEN _score = 100 THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, date) DO UPDATE SET
    quizzes_completed = daily_activity.quizzes_completed + 1,
    correct_answers = daily_activity.correct_answers + _correct_count,
    total_answers = daily_activity.total_answers + _total_count,
    xp_earned = daily_activity.xp_earned + _xp_earned,
    perfect_quizzes = daily_activity.perfect_quizzes + CASE WHEN _score = 100 THEN 1 ELSE 0 END;

  RETURN jsonb_build_object(
    'xp_earned', _xp_earned,
    'new_level', _new_level,
    'level_up', _new_level > _profile.level,
    'new_streak', _new_streak,
    'new_xp', _new_xp
  );
END;
$$;

-- 9. Rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL,
  requested_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits(user_id, function_name, requested_at);

-- Allow authenticated users to insert their own rate limit entries
CREATE POLICY "Users can insert own rate limits" ON public.rate_limits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own rate limits" ON public.rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- 10. check_rate_limit RPC (used by edge functions)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _function_name text,
  _max_requests int DEFAULT 10,
  _window_seconds int DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count int;
  _cutoff timestamptz;
BEGIN
  _cutoff := now() - make_interval(secs := _window_seconds);

  DELETE FROM public.rate_limits
  WHERE requested_at < _cutoff;

  SELECT COUNT(*) INTO _count
  FROM public.rate_limits
  WHERE user_id = _user_id
    AND function_name = _function_name
    AND requested_at > _cutoff;

  IF _count >= _max_requests THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after', _window_seconds);
  END IF;

  INSERT INTO public.rate_limits (user_id, function_name)
  VALUES (_user_id, _function_name);

  RETURN jsonb_build_object('allowed', true);
END;
$$;
