-- Exact sum of total_amount for all completed bookings by a cleaner.
-- Use from the cleaner dashboard API via: supabase.rpc('get_cleaner_pending_payout', { p_cleaner_id: cleanerId })
-- Run in Supabase SQL editor once.

CREATE OR REPLACE FUNCTION public.get_cleaner_pending_payout(p_cleaner_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_amount), 0)::NUMERIC
  FROM public.bookings
  WHERE cleaner_id = p_cleaner_id::TEXT
    AND LOWER(TRIM(status)) = 'completed';
$$;

COMMENT ON FUNCTION public.get_cleaner_pending_payout(UUID) IS
  'Returns the sum of total_amount for all completed bookings for the given cleaner (for dashboard Total Payout Pending).';
