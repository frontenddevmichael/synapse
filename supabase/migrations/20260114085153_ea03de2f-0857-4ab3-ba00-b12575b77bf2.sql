-- Create security definer function to check room membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE user_id = _user_id
      AND room_id = _room_id
  )
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Room members viewable by room members" ON public.room_members;

-- Create new non-recursive policy using the security definer function
CREATE POLICY "Room members viewable by room members"
ON public.room_members
FOR SELECT
USING (public.is_room_member(auth.uid(), room_id));