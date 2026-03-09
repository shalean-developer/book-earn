-- Pending Paystack payments: hold booking payload until payment is verified.
-- Run after 20250307000000_create_bookings.sql

CREATE TABLE IF NOT EXISTS public.pending_payments (
  booking_ref VARCHAR(20) PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: index for TTL cleanup (e.g. delete rows older than 24h)
CREATE INDEX IF NOT EXISTS pending_payments_created_at_idx ON public.pending_payments (created_at);

ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- No public policies: only server (service role) reads/writes.
COMMENT ON TABLE public.pending_payments IS 'Temporary store for booking payload until Paystack payment is verified.';
