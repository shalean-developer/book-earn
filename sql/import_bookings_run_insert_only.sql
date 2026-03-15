-- Run this in Supabase SQL Editor AFTER the CSV is in legacy_bookings.
-- Copies all rows from legacy_bookings into bookings.
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
