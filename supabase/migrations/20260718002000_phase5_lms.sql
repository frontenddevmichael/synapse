-- Phase 5: LMS-Readiness (minimal)
-- Bank the cheap schema decision now; no org table, no RLS, no UI

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS organization_id uuid;
