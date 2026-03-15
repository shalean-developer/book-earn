-- Table for customer/cleaner messages per booking.
-- Run this in Supabase SQL editor if you use Supabase.

CREATE TABLE IF NOT EXISTS public.booking_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'cleaner')),
  sender_email text,
  sender_cleaner_id text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id
  ON public.booking_messages(booking_id);

COMMENT ON TABLE public.booking_messages IS 'Messages from customer or cleaner about a booking.';
