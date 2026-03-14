-- Cleaner payouts: early cash out (R5 fee) and weekly (free).
-- Run cleaner_pending_payout.sql first, then this file in Supabase SQL editor.

-- Table: one row per payout request (early or weekly)
CREATE TABLE IF NOT EXISTS public.cleaner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id text NOT NULL,
  amount_rands numeric NOT NULL CHECK (amount_rands >= 0),
  fee_rands numeric NOT NULL DEFAULT 0 CHECK (fee_rands >= 0),
  type text NOT NULL CHECK (type IN ('early', 'weekly')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cleaner_payouts_cleaner ON public.cleaner_payouts(cleaner_id);
COMMENT ON TABLE public.cleaner_payouts IS 'Cleaner payout requests; early = R5 fee, weekly = free, paid to bank account.';

-- Available to withdraw = total completed earnings minus all payouts (pending + processed)
CREATE OR REPLACE FUNCTION public.get_cleaner_available_payout(p_cleaner_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    0,
    (SELECT get_cleaner_pending_payout(p_cleaner_id))
    - COALESCE(
        (SELECT SUM(amount_rands + fee_rands) FROM public.cleaner_payouts WHERE cleaner_id = p_cleaner_id::TEXT),
        0
      )
  )::NUMERIC;
$$;

COMMENT ON FUNCTION public.get_cleaner_available_payout(UUID) IS
  'Amount the cleaner can still withdraw (completed earnings minus requested/processed payouts).';
