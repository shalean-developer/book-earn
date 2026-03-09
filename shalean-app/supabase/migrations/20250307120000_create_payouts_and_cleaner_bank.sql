-- Payouts: record of transfers to cleaners (available balance = earnings - sum(successful payouts)).
-- Bank details on profiles for Paystack transfer recipient (ZAR/basa).
-- Run after create_profiles and create_bookings.

-- Add bank and Paystack recipient columns to profiles (used for cleaners).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_code TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS paystack_recipient_code TEXT;

COMMENT ON COLUMN public.profiles.bank_account_number IS 'Cleaner bank account number (masked in UI).';
COMMENT ON COLUMN public.profiles.bank_code IS 'Paystack bank code (e.g. from GET /bank?currency=ZAR).';
COMMENT ON COLUMN public.profiles.bank_account_name IS 'Account holder name.';
COMMENT ON COLUMN public.profiles.paystack_recipient_code IS 'Paystack transfer recipient code (basa/ZAR).';

-- Payouts table: one row per transfer to a cleaner.
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  paystack_transfer_code TEXT,
  paystack_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_profile_id_idx ON public.payouts (profile_id);
CREATE INDEX IF NOT EXISTS payouts_created_at_idx ON public.payouts (created_at DESC);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Cleaners can read their own payouts only.
CREATE POLICY "Users can read own payouts"
  ON public.payouts FOR SELECT
  USING (auth.uid() = profile_id);

-- Inserts/updates only via service role (server actions).
COMMENT ON TABLE public.payouts IS 'Cleaner payouts; available balance = sum(bookings.total) - sum(payouts where status=success).';
