-- =============================================================================
-- Check for duplicate bookings (run in Supabase SQL Editor)
-- =============================================================================
-- 1) Duplicates by reference (same reference = same payment/booking created twice)
-- 2) Duplicates by customer + date + time (same person, same slot = possible double booking)
-- =============================================================================

-- 1) References that appear more than once
select
  'Duplicate reference' as check_type,
  b.reference,
  count(*) as booking_count,
  array_agg(b.id order by b.created_at) as booking_ids,
  array_agg(b.name order by b.created_at) as names,
  array_agg(b.date::text || ' ' || b.time::text order by b.created_at) as date_times
from public.bookings b
where b.reference is not null and b.reference <> ''
group by b.reference
having count(*) > 1
order by count(*) desc;

-- 2) Same customer (email) + same date + same time
select
  'Duplicate customer slot' as check_type,
  b.email,
  b.date,
  b.time,
  count(*) as booking_count,
  array_agg(b.id order by b.created_at) as booking_ids,
  array_agg(b.name order by b.created_at) as names,
  array_agg(b.reference order by b.created_at) as references
from public.bookings b
where b.email is not null and b.email <> '' and b.date is not null and b.time is not null
group by b.email, b.date, b.time
having count(*) > 1
order by count(*) desc;

-- Summary counts (optional)
select
  (select count(*) from (
    select b.reference
    from public.bookings b
    where b.reference is not null and b.reference <> ''
    group by b.reference
    having count(*) > 1
  ) x) as duplicate_reference_groups,
  (select count(*) from (
    select b.email, b.date, b.time
    from public.bookings b
    where b.email is not null and b.email <> '' and b.date is not null and b.time is not null
    group by b.email, b.date, b.time
    having count(*) > 1
  ) y) as duplicate_customer_slot_groups;
