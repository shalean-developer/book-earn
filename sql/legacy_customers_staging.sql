-- Helper SQL to stage legacy customers and prepare for import into profiles.
-- Run these statements in your Supabase SQL editor (or psql) against the
-- same project this app uses.

-- 1) Create a staging table for legacy customers. This mirrors the columns
--    in the legacy `public.customers` dump, but lives under a safe name.
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

-- 2) Paste your INSERT rows into this table.
-- Replace `public.customers` in your dump with `public.legacy_customers`
-- and run the INSERT statement.
--
-- Example (conceptual):
-- INSERT INTO public.legacy_customers
--   (id, email, phone, first_name, last_name, address_line1, address_suburb,
--    address_city, total_bookings, created_at, updated_at, auth_user_id, role,
--    paystack_authorization_code, paystack_authorization_email,
--    paystack_authorization_reusable, paystack_authorization_signature,
--    rewards_points)
-- VALUES
--   (...), (...), ...;

-- 3) (Optional) Create a smaller test table from a subset of rows so you can
--    test the import script safely before running it on all data.
--
-- create table if not exists public.legacy_customers_test
-- as
-- select *
-- from public.legacy_customers
-- limit 10;

