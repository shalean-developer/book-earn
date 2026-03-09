-- Allow real cleaner IDs (e.g. profile UUID) in bookings.cleaner_id.
-- Run after 20250307000000_create_bookings.sql

ALTER TABLE public.bookings
  ALTER COLUMN cleaner_id TYPE VARCHAR(255);

COMMENT ON COLUMN public.bookings.cleaner_id IS 'Assigned cleaner: legacy (c1–c4) or profiles.id / profiles.cleaner_id.';
