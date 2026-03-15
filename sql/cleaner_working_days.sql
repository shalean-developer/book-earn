-- Cleaner working days (days of week they are available).
-- 0 = Sunday, 1 = Monday, ... 6 = Saturday.
-- Run in Supabase SQL editor after profiles exists.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS working_days integer[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.working_days IS 'Days of week cleaner works: 0=Sun, 1=Mon, ..., 6=Sat';
