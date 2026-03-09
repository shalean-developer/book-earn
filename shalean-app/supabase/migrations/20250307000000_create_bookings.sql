-- Bookings table for Shalean booking flow (performance-optimized)
-- Run in Supabase SQL Editor or via: supabase db push

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref VARCHAR(20) NOT NULL,
  service VARCHAR(50) NOT NULL,
  property_type VARCHAR(20) NOT NULL,
  office_size VARCHAR(20),
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  extra_rooms INT NOT NULL,
  working_area VARCHAR(100) NOT NULL,
  extras TEXT[] NOT NULL DEFAULT '{}',
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL,
  cleaner_id VARCHAR(20),
  team_id VARCHAR(20),
  assign_me BOOLEAN NOT NULL DEFAULT false,
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  instructions TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  tip_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  promo_code VARCHAR(50),
  payment_method VARCHAR(20) NOT NULL,
  payment_ref VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index for confirmation page lookup (primary read path)
CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_ref_key ON public.bookings (booking_ref);

-- Composite index for future availability / slot checks
CREATE INDEX IF NOT EXISTS bookings_date_working_area_idx ON public.bookings (date, working_area);

-- Composite index for customer booking history
CREATE INDEX IF NOT EXISTS bookings_customer_email_created_at_idx ON public.bookings (customer_email, created_at DESC);

-- Index for admin dashboards and reports
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON public.bookings (created_at);

-- Enable RLS (optional: use service role in server actions to bypass)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: allow service role full access (server actions use service role key)
-- No public insert/select policies needed if only server uses service_role.

COMMENT ON TABLE public.bookings IS 'Completed bookings; written only after payment success.';
