-- Fix infinite recursion on room_members SELECT caused by duplicate policies
-- Two policies existed: one recursive (rogue, from manual execution),
-- one using SECURITY DEFINER is_room_member() (intended).
-- Also drop raw INSERT policy (join_room_by_code RPC is the sanctioned path).

DROP POLICY IF EXISTS "Members can view room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
