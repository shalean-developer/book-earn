-- Add payment_status to bookings for admin-editable payment state (paid / pending / refunded).
-- Run after 20250307000000_create_bookings.sql

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'paid';

COMMENT ON COLUMN public.bookings.payment_status IS 'Admin-editable: paid, pending, or refunded.';
