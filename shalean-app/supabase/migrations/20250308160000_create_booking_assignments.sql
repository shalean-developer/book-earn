-- Team assignments for Deep / Move in-out: multiple cleaners per booking, R250 + equal tip split per member.
-- Solo jobs continue to use bookings.cleaner_id only; no rows here.

CREATE TABLE IF NOT EXISTS public.booking_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  cleaner_id VARCHAR(255) NOT NULL,
  earnings DECIMAL(10,2) NOT NULL,
  UNIQUE (booking_id, cleaner_id)
);

CREATE INDEX IF NOT EXISTS booking_assignments_booking_id_idx ON public.booking_assignments (booking_id);
CREATE INDEX IF NOT EXISTS booking_assignments_cleaner_id_idx ON public.booking_assignments (cleaner_id);

ALTER TABLE public.booking_assignments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.booking_assignments IS 'Team Deep/Move: one row per assigned cleaner; earnings = R250 + (tip_amount / n). Solo jobs use bookings.cleaner_id only.';
