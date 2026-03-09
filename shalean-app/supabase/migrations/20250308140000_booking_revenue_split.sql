-- Income sharing: service_fee_amount and cleaner_earnings per booking.
-- Service fee R50 for standard/airbnb only. Cleaner gets 70% of (total - fee) for standard/airbnb,
-- R250 flat for deep/move/carpet; tips always 100% to cleaner.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cleaner_earnings DECIMAL(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.bookings.service_fee_amount IS 'Platform service fee: R50 for standard/airbnb, 0 otherwise.';
COMMENT ON COLUMN public.bookings.cleaner_earnings IS 'Amount credited to cleaner for this booking (share + tips).';

-- Backfill existing rows: same logic as lib/revenue-split.ts
UPDATE public.bookings
SET
  service_fee_amount = CASE WHEN service IN ('standard', 'airbnb') THEN 50 ELSE 0 END,
  cleaner_earnings = (
    CASE
      WHEN service IN ('standard', 'airbnb') THEN
        (total - 50) * 0.70
      WHEN service IN ('deep', 'move', 'carpet') THEN
        250
      ELSE 0
    END
    + COALESCE(tip_amount, 0)
  )
WHERE service_fee_amount = 0 AND cleaner_earnings = 0;
