-- Referral and wallet/credits schema for Shalean.
-- Run in Supabase SQL editor (or psql) against the same project this app uses.
-- Ensures referral tracking and R100 credits for referrer + referee when referee completes first clean.

-- 1) Profiles: add referral columns (referral_code = base64(email) for share link; referred_by = referrer's profile id)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code
  ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;

COMMENT ON COLUMN public.profiles.referral_code IS 'Unique code for referral link, e.g. base64(lowercase email)';
COMMENT ON COLUMN public.profiles.referred_by IS 'Profile id of the customer who referred this one';

-- 2) Referrals table: one row per referred signup/booking, used to grant R100 once when referee completes first clean
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id),
  referee_email text NOT NULL,
  referee_id uuid REFERENCES public.profiles(id),
  first_booking_id uuid REFERENCES public.bookings(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_email ON public.referrals(referee_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- 3) Customer wallet credits (balance is sum of amount_cents where applied_at IS NULL; applied_at set when used against a booking)
CREATE TABLE IF NOT EXISTS public.customer_wallet_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  reason text NOT NULL DEFAULT 'referral_bonus',
  reference_type text,
  reference_id uuid,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_credits_profile ON public.customer_wallet_credits(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_credits_applied ON public.customer_wallet_credits(profile_id, applied_at) WHERE applied_at IS NULL;

COMMENT ON TABLE public.customer_wallet_credits IS 'Credits (e.g. R100 referral) per customer; applied_at NULL = available balance';

-- 3b) Protect customer_wallet_credits with Row Level Security (RLS)
--     Backend uses service role (bypasses RLS) for inserts/updates. Clients cannot modify.
--     Authenticated users can only SELECT their own rows (profile_id = auth.uid()).
ALTER TABLE public.customer_wallet_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_wallet_credits_select_own" ON public.customer_wallet_credits;
CREATE POLICY "customer_wallet_credits_select_own"
  ON public.customer_wallet_credits
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for anon or authenticated: only service role can modify (referral grants, etc.)

-- 4) Bookings: store referrer attribution so we know which booking came from ?ref=
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS referred_by_email text;

COMMENT ON COLUMN public.bookings.referred_by_email IS 'Email of referrer when booking was made with ?ref= (for referral credit when this booking is completed)';
