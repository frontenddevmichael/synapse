-- RPC to use a streak freeze: decrement count
CREATE OR REPLACE FUNCTION public.use_streak_freeze(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET streak_freeze_count = GREATEST(streak_freeze_count - 1, 0)
  WHERE id = _user_id AND streak_freeze_count > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No streak freezes available';
  END IF;
END;
$$;
