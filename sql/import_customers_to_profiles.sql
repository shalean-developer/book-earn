-- =============================================================================
-- Import customers into profiles table (Supabase SQL Editor)
-- =============================================================================
--
-- How to run:
-- 1. Run this entire file once (creates legacy_customers table).
-- 2. In Supabase: Table Editor -> legacy_customers -> "Import data from CSV"
--    and upload your customers_rows.csv (match column names to the table).
-- 3. Run this file again (or run only the INSERT...SELECT below) to sync
--    from legacy_customers into profiles.
--
-- Limitation: profiles.id must equal auth.users.id. So only rows with
-- auth_user_id set AND that user existing in auth.users get synced. For
-- all other customers, create auth users first (e.g. npm run import-customers)
-- then run this sync again.
-- =============================================================================

-- 1) Staging table for CSV data
create table if not exists public.legacy_customers (
  id uuid primary key,
  email text,
  phone text,
  first_name text,
  last_name text,
  address_line1 text,
  address_suburb text,
  address_city text,
  total_bookings integer,
  created_at timestamptz,
  updated_at timestamptz,
  auth_user_id uuid,
  role text,
  paystack_authorization_code text,
  paystack_authorization_email text,
  paystack_authorization_reusable boolean,
  paystack_authorization_signature text,
  rewards_points integer
);

-- 2) Sync from staging into profiles (only for rows with an existing auth user)
--    Run this after loading your CSV into legacy_customers.
insert into public.profiles (
  id,
  name,
  email,
  phone,
  role,
  address_line1,
  address_city,
  address_region
)
select
  l.auth_user_id,
  nullif(trim(
    concat_ws(' ',
      nullif(trim(l.first_name), ''),
      nullif(trim(l.last_name), '')
    )
  ), ''),
  lower(trim(l.email)),
  nullif(trim(l.phone), ''),
  'customer',
  nullif(trim(l.address_line1), ''),
  nullif(trim(l.address_city), ''),
  nullif(trim(l.address_suburb), '')
from public.legacy_customers l
where l.auth_user_id is not null
  and trim(lower(l.email)) <> ''
  and (l.role is null or l.role = 'customer')
  and l.auth_user_id in (select id from auth.users)
on conflict (id) do update set
  name      = coalesce(nullif(trim(excluded.name), ''), profiles.name),
  email     = excluded.email,
  phone     = excluded.phone,
  address_line1 = coalesce(excluded.address_line1, profiles.address_line1),
  address_city  = coalesce(excluded.address_city, profiles.address_city),
  address_region = coalesce(excluded.address_region, profiles.address_region);
