-- =============================================================================
-- Import legacy bookings into public.bookings (Supabase SQL Editor)
-- Matches table: booking_ref, service, property_type, bedrooms, bathrooms, etc.
-- =============================================================================
--
-- How to run:
-- 1. Run this entire file once (creates legacy_bookings staging table).
-- 2. In Supabase: Table Editor -> legacy_bookings -> "Import data from CSV"
--    and upload bookings_rows (2).csv. Match column names to the staging table.
-- 3. Run the INSERT...SELECT below to copy from legacy_bookings into bookings.
--
-- Logic:
-- - Customer: If legacy_bookings.customer_id matches a profile, booking uses
--   that profile's email (links to customer). Else uses customer_email (guest).
-- - Cleaner: If legacy_bookings.cleaner_id exists in profiles as role=cleaner,
--   booking is linked to that cleaner; else cleaner_id is null.
-- - Amounts: CSV values like 30600 are treated as cents (R306.00). Change
--   "/ 100.0" to no division if your CSV stores rands.
-- =============================================================================

-- 1) Staging table (column names match CSV header)
create table if not exists public.legacy_bookings (
  id text,
  cleaner_id uuid,
  booking_date date,
  booking_time time,
  service_type text,
  customer_name text,
  customer_email text,
  customer_phone text,
  address_line1 text,
  address_suburb text,
  address_city text,
  payment_reference text,
  status text,
  created_at timestamptz,
  customer_id uuid,
  total_amount numeric,
  service_fee numeric,
  frequency text,
  frequency_discount numeric,
  price_snapshot jsonb,
  cleaner_claimed_at timestamptz,
  cleaner_started_at timestamptz,
  cleaner_completed_at timestamptz,
  customer_rating_id uuid,
  cleaner_earnings numeric,
  cleaner_accepted_at timestamptz,
  cleaner_on_my_way_at timestamptz,
  customer_reviewed text,
  customer_review_id uuid,
  recurring_schedule_id uuid,
  requires_team text,
  updated_at timestamptz,
  tip_amount numeric,
  cleaner_start_reminder_sent text,
  unread_messages_count int,
  notes text,
  provide_equipment text,
  equipment_charge numeric,
  surge_pricing_applied text,
  surge_amount numeric,
  invoice_id text,
  expected_end_time time,
  estimated_duration_minutes integer
);

-- 2) Insert into public.bookings (columns match your Supabase table)
insert into public.bookings (
  booking_ref,
  service,
  property_type,
  office_size,
  bedrooms,
  bathrooms,
  extra_rooms,
  working_area,
  extras,
  date,
  time,
  cleaner_id,
  team_id,
  customer_name,
  customer_email,
  customer_phone,
  address,
  instructions,
  subtotal,
  discount_amount,
  tip_amount,
  total,
  payment_method,
  payment_ref,
  status,
  service_fee_amount,
  cleaner_earnings,
  apartment_unit,
  base_amount,
  subtotal_amount,
  total_amount,
  currency,
  paystack_reference,
  cleaning_frequency,
  reference,
  name,
  email,
  phone,
  estimated_duration_minutes,
  equipment_charge_amount
)
select
  left(coalesce(nullif(trim(lb.payment_reference), ''), trim(lb.id), 'SC' || (floor(random() * 90000000 + 10000000))::text), 20),
  coalesce(nullif(trim(lb.service_type), ''), 'Standard'),
  'residential',
  null,
  coalesce((lb.price_snapshot->'service'->>'bedrooms')::int, 1),
  coalesce((lb.price_snapshot->'service'->>'bathrooms')::int, 1),
  0,
  coalesce(
    nullif(trim(concat_ws(', ',
      nullif(trim(lb.address_line1), ''),
      nullif(trim(lb.address_suburb), ''),
      nullif(trim(lb.address_city), '')
    )), ''),
    'Address not provided'
  ),
  '{}',
  lb.booking_date,
  lb.booking_time::text,
  case
    when lb.cleaner_id is not null and p_cleaner.id is not null then lb.cleaner_id::text
    else null
  end,
  null,
  coalesce(nullif(trim(lb.customer_name), ''), 'Guest'),
  coalesce(
    nullif(trim(lower(p_cust.email)), ''),
    nullif(trim(lower(lb.customer_email)), '')
  ),
  coalesce(nullif(trim(p_cust.phone), ''), nullif(trim(lb.customer_phone), '')),
  coalesce(
    nullif(trim(concat_ws(', ',
      nullif(trim(lb.address_line1), ''),
      nullif(trim(lb.address_suburb), ''),
      nullif(trim(lb.address_city), '')
    )), ''),
    'Address not provided'
  ),
  null,
  coalesce(lb.total_amount / 100.0, 0),
  0,
  coalesce(lb.tip_amount / 100.0, 0),
  coalesce(lb.total_amount / 100.0, 0),
  'online',
  nullif(trim(lb.payment_reference), ''),
  case
    when lower(trim(lb.status)) = 'completed' then 'completed'
    when lower(trim(lb.status)) in ('cancelled', 'canceled') then 'cancelled'
    when lower(trim(lb.status)) = 'failed' then 'failed'
    when lower(trim(lb.status)) = 'pending' then 'pending'
    else 'confirmed'
  end,
  coalesce(lb.service_fee / 100.0, 0),
  coalesce(lb.cleaner_earnings / 100.0, 0),
  null,
  null,
  coalesce(lb.total_amount / 100.0, 0),
  coalesce(lb.total_amount / 100.0, 0),
  'ZAR',
  nullif(trim(lb.payment_reference), ''),
  nullif(trim(lb.frequency), ''),
  nullif(trim(lb.id), ''),
  coalesce(nullif(trim(lb.customer_name), ''), 'Guest'),
  coalesce(
    nullif(trim(lower(p_cust.email)), ''),
    nullif(trim(lower(lb.customer_email)), '')
  ),
  coalesce(nullif(trim(p_cust.phone), ''), nullif(trim(lb.customer_phone), '')),
  coalesce(lb.estimated_duration_minutes, 210),
  coalesce(lb.equipment_charge / 100.0, 0)
from public.legacy_bookings lb
left join public.profiles p_cust
  on p_cust.id = lb.customer_id
left join public.profiles p_cleaner
  on p_cleaner.id = lb.cleaner_id
  and p_cleaner.role = 'cleaner'
where coalesce(nullif(trim(lb.customer_email), ''), p_cust.email) is not null
  and lb.booking_date is not null;
