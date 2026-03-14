-- Cleaner earnings: run in Supabase SQL editor (after cleaner_payouts.sql if you use it).
-- Cleaner earnings rules:
-- - Standard & Airbnb: 70% of (total customer pays minus service fee), excluding equipment from the base.
-- - Carpets, Deep, Move in/out: R250 per cleaner per job.
-- - Equipment charge is never part of cleaner earnings.
-- - Discounts: already applied to total_amount (customer pays less); no extra handling.
-- - Tip: cleaner gets full amount. For Deep / Move / Carpet team jobs, tip is shared among cleaners
--   (requires booking_cleaners or team_size; until then, full tip to assigned cleaner_id).

-- Ensure bookings has service_fee_amount and equipment_charge_amount (run once).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_fee_amount numeric DEFAULT 0;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS equipment_charge_amount numeric DEFAULT 0;
COMMENT ON COLUMN public.bookings.service_fee_amount IS 'Per-booking service fee; excluded from cleaner earnings base.';
COMMENT ON COLUMN public.bookings.equipment_charge_amount IS 'Equipment charge; not part of cleaner earnings.';

-- Returns the cleaner earnings for a single completed booking (one row).
-- p_cleaner_id is the cleaner to compute for; for team jobs with shared tip, call per cleaner with same booking.
CREATE OR REPLACE FUNCTION public.get_cleaner_earnings_for_booking(
  p_booking_id uuid,
  p_cleaner_id uuid
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b record;
  svc text;
  base_for_percent numeric;
  service_fee numeric;
  equipment numeric;
  tip numeric;
  team_size int := 1;  -- When booking_cleaners exists, set to count of cleaners on this job for tip split.
  earnings numeric;
BEGIN
  SELECT
    id, service, total_amount, tip_amount,
    COALESCE(bookings.service_fee_amount, 0) AS fee_amt,
    COALESCE(bookings.equipment_charge_amount, 0) AS equip_amt
  INTO b
  FROM public.bookings AS bookings
  WHERE bookings.id = p_booking_id
    AND bookings.cleaner_id = p_cleaner_id::text
    AND LOWER(TRIM(bookings.status)) = 'completed';

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  service_fee := b.fee_amt;
  equipment   := b.equip_amt;
  tip         := COALESCE(b.tip_amount, 0);

  svc := LOWER(TRIM(b.service));

  -- Standard or Airbnb: 70% of (total - equipment - service_fee) + full tip (or tip/team_size when we have team).
  IF svc LIKE '%standard%' OR svc = 'airbnb' OR svc LIKE '%airbnb%' THEN
    base_for_percent := GREATEST(0, (b.total_amount - equipment - service_fee));
    earnings := (base_for_percent * 0.70) + (tip / team_size);
    RETURN ROUND(earnings, 2);
  END IF;

  -- Carpets, Deep, Move in/out: R250 per cleaner + tip (full or shared).
  IF svc LIKE '%carpet%' OR svc LIKE '%deep%' OR svc LIKE '%move%' THEN
    earnings := 250 + (tip / team_size);
    RETURN ROUND(earnings, 2);
  END IF;

  -- Fallback: treat as Standard (70% + tip).
  base_for_percent := GREATEST(0, (b.total_amount - equipment - service_fee));
  earnings := (base_for_percent * 0.70) + (tip / team_size);
  RETURN ROUND(earnings, 2);
END;
$$;

COMMENT ON FUNCTION public.get_cleaner_earnings_for_booking(uuid, uuid) IS
  'Cleaner earnings for one completed booking: Standard/Airbnb 70% of (total - equipment - service_fee) + tip; Carpets/Deep/Move R250 + tip. Tip shared by team_size when applicable.';

-- Pending payout = sum of cleaner earnings (not total_amount) for all completed bookings.
CREATE OR REPLACE FUNCTION public.get_cleaner_pending_payout(p_cleaner_id UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    public.get_cleaner_earnings_for_booking(b.id, p_cleaner_id)
  ), 0)::NUMERIC
  FROM public.bookings b
  WHERE b.cleaner_id = p_cleaner_id::text
    AND LOWER(TRIM(b.status)) = 'completed';
$$;

COMMENT ON FUNCTION public.get_cleaner_pending_payout(UUID) IS
  'Sum of cleaner earnings for completed bookings (70% for Standard/Airbnb, R250 for Carpets/Deep/Move, plus full tip; equipment excluded).';
