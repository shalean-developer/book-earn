-- =============================================================================
-- Merge duplicate bookings (same email + date + time)
-- Run in Supabase SQL Editor. Back up data first.
-- =============================================================================
-- For each duplicate group we keep ONE booking (prefer confirmed/completed,
-- then with reference, then oldest created_at). Related rows are repointed
-- to the kept booking; then duplicate bookings are deleted.
-- Duplicate groups for customer "Lynne Thorpe" are excluded (left unchanged).
-- =============================================================================

BEGIN;

--    Use text here to match bookings.id in this database (ids like 'SCS‑...' etc).
CREATE TEMP TABLE keeper_for_duplicate (duplicate_id text, keeper_id text) ON COMMIT DROP;

INSERT INTO keeper_for_duplicate (duplicate_id, keeper_id)
SELECT b.id, d.keeper_id
FROM public.bookings b
JOIN (
  SELECT
    b2.customer_email,
    b2.booking_date,
    b2.booking_time,
    (array_agg(
      b2.id
      ORDER BY
        CASE WHEN LOWER(TRIM(COALESCE(b2.status, ''))) IN ('confirmed', 'completed') THEN 0 ELSE 1 END,
        CASE WHEN b2.payment_reference IS NOT NULL AND TRIM(b2.payment_reference) <> '' THEN 0 ELSE 1 END,
        b2.created_at ASC NULLS LAST,
        b2.id
    ))[1] AS keeper_id
  FROM public.bookings b2
  WHERE b2.customer_email IS NOT NULL AND TRIM(b2.customer_email) <> ''
    AND b2.booking_date IS NOT NULL
    AND b2.booking_time IS NOT NULL
  GROUP BY b2.customer_email, b2.booking_date, b2.booking_time
  HAVING count(*) > 1
    AND (b2.customer_email, b2.booking_date, b2.booking_time) NOT IN (
      SELECT b3.customer_email, b3.booking_date, b3.booking_time
      FROM public.bookings b3
      WHERE TRIM(COALESCE(b3.customer_name, '')) = 'Lynne Thorpe'
    )
) d ON b.customer_email = d.customer_email AND b.booking_date = d.booking_date AND b.booking_time = d.booking_time
WHERE b.id <> d.keeper_id;

-- 2) Point referrals.first_booking_id to keeper when it references a duplicate
UPDATE public.referrals r
SET first_booking_id = k.keeper_id
FROM keeper_for_duplicate k
WHERE r.first_booking_id = k.duplicate_id;

-- 3) Attach ratings from duplicate bookings to the kept booking
--    (If you get a unique constraint error, delete ratings for duplicates instead:
--     DELETE FROM public.booking_ratings WHERE booking_id IN (SELECT duplicate_id FROM keeper_for_duplicate);)
UPDATE public.booking_ratings br
SET booking_id = k.keeper_id
FROM keeper_for_duplicate k
WHERE br.booking_id = k.duplicate_id;

-- 4) Attach messages from duplicate bookings to the kept booking
UPDATE public.booking_messages bm
SET booking_id = k.keeper_id
FROM keeper_for_duplicate k
WHERE bm.booking_id = k.duplicate_id;

-- 5) Delete duplicate bookings
DELETE FROM public.bookings
WHERE id IN (SELECT duplicate_id FROM keeper_for_duplicate);

COMMIT;

-- Run check_booking_duplicates.sql again to confirm duplicate_customer_slot_groups is 0.
