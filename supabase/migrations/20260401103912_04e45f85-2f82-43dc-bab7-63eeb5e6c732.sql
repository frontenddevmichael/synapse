
-- Security definer function to join a room by code
-- Bypasses RLS so non-members can look up the room
CREATE OR REPLACE FUNCTION public.join_room_by_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _room_id uuid;
  _room_name text;
  _user_id uuid;
  _existing uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Not authenticated');
  END IF;

  SELECT id, name INTO _room_id, _room_name
  FROM public.rooms
  WHERE code = upper(trim(_code));

  IF _room_id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found', 'message', 'Room not found');
  END IF;

  SELECT id INTO _existing
  FROM public.room_members
  WHERE room_id = _room_id AND user_id = _user_id;

  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_member', 'room_id', _room_id, 'room_name', _room_name);
  END IF;

  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (_room_id, _user_id, 'member');

  RETURN jsonb_build_object('status', 'joined', 'room_id', _room_id, 'room_name', _room_name);
END;
$$;
