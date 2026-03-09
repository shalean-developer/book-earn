-- Extend bookings.status to support cleaner job lifecycle: on_my_way, arrived, started (completed/cancelled already exist).
-- No existing CHECK on status; add one for allowed values.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmed', 'on_my_way', 'arrived', 'started', 'completed', 'cancelled'));

COMMENT ON COLUMN public.bookings.status IS 'confirmed (default) | on_my_way | arrived | started | completed | cancelled. Cleaner drives lifecycle from confirmed to completed.';
