-- Booking ratings: customer rates cleaner, cleaner rates customer. One rating per booking per side.

CREATE TABLE IF NOT EXISTS public.booking_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings (id) ON DELETE CASCADE,
  rater_type TEXT NOT NULL CHECK (rater_type IN ('customer', 'cleaner')),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, rater_type)
);

CREATE INDEX IF NOT EXISTS booking_ratings_booking_id_idx ON public.booking_ratings (booking_id);
CREATE INDEX IF NOT EXISTS booking_ratings_rater_type_created_idx ON public.booking_ratings (rater_type, created_at DESC);

ALTER TABLE public.booking_ratings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.booking_ratings IS 'Customer and cleaner ratings per booking; one row per (booking_id, rater_type).';
