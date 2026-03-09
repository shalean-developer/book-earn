-- Align stored cleaner_earnings with lib/revenue-split: 70% of total minus R50 (standard/airbnb)
-- or R250 (deep/move/carpet), plus tips.
UPDATE public.bookings
SET
  service_fee_amount = CASE WHEN service IN ('standard', 'airbnb') THEN 50 ELSE 0 END,
  cleaner_earnings = (
    CASE
      WHEN service IN ('standard', 'airbnb') THEN GREATEST(0, (total * 0.70) - 50)
      WHEN service IN ('deep', 'move', 'carpet') THEN GREATEST(0, (total * 0.70) - 250)
      ELSE 0
    END
    + COALESCE(tip_amount, 0)
  );
