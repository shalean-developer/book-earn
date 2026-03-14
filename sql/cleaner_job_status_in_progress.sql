-- Allow cleaner workflow statuses: on_my_way, arrived, in_progress, completed.
-- Run this in the Supabase SQL editor if you get "Failed to update job status"
-- when a cleaner updates job status (On My Way → Arrived → Start Job → Complete Job).

-- Drop any check constraint on bookings that restricts status
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'bookings'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Add check that includes cleaner workflow: on_my_way, arrived, in_progress, completed
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'on_my_way', 'arrived', 'in_progress', 'completed', 'cancelled', 'failed'));
