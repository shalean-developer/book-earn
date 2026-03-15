-- =============================================================================
-- Add Nyasha and Ethel to ALL Lynne Thorpe bookings and set total = 613
-- Run in Supabase SQL Editor.
-- =============================================================================
-- Nyasha: 796e3ad7-07f3-44eb-b4cf-bed439a59f8b
-- Ethel:  914b3acf-40e8-4ad5-a5a2-9e2de711849a
-- =============================================================================

BEGIN;

-- Helper: Lynne = email lynthorpe@gmail.com OR name Lynne Thorpe
-- (Use the condition that matches your bookings table: email and/or customer_name.)

-- 1) Ensure existing cleaner is in booking_cleaners for each Lynne booking
INSERT INTO public.booking_cleaners (booking_id, cleaner_id, role)
SELECT b.id, b.cleaner_id::uuid, 'primary'
FROM public.bookings b
WHERE (
  LOWER(TRIM(COALESCE(b.customer_email, ''))) = 'lynthorpe@gmail.com'
  OR TRIM(COALESCE(b.customer_name, b.name, '')) = 'Lynne Thorpe'
)
  AND b.cleaner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.booking_cleaners bc
    WHERE bc.booking_id = b.id AND bc.cleaner_id = b.cleaner_id::uuid
  );

-- 2) Add Nyasha to all Lynne Thorpe bookings (if not already there)
INSERT INTO public.booking_cleaners (booking_id, cleaner_id, role)
SELECT b.id, '796e3ad7-07f3-44eb-b4cf-bed439a59f8b'::uuid, 'assistant'
FROM public.bookings b
WHERE (
  LOWER(TRIM(COALESCE(b.customer_email, ''))) = 'lynthorpe@gmail.com'
  OR TRIM(COALESCE(b.customer_name, b.name, '')) = 'Lynne Thorpe'
)
  AND NOT EXISTS (
    SELECT 1 FROM public.booking_cleaners bc
    WHERE bc.booking_id = b.id AND bc.cleaner_id = '796e3ad7-07f3-44eb-b4cf-bed439a59f8b'::uuid
  );

-- 3) Add Ethel to all Lynne Thorpe bookings (if not already there)
INSERT INTO public.booking_cleaners (booking_id, cleaner_id, role)
SELECT b.id, '914b3acf-40e8-4ad5-a5a2-9e2de711849a'::uuid, 'assistant'
FROM public.bookings b
WHERE (
  LOWER(TRIM(COALESCE(b.customer_email, ''))) = 'lynthorpe@gmail.com'
  OR TRIM(COALESCE(b.customer_name, b.name, '')) = 'Lynne Thorpe'
)
  AND NOT EXISTS (
    SELECT 1 FROM public.booking_cleaners bc
    WHERE bc.booking_id = b.id AND bc.cleaner_id = '914b3acf-40e8-4ad5-a5a2-9e2de711849a'::uuid
  );

-- 4) Set total_amount = 613 (307 + 306) for all Lynne Thorpe bookings
UPDATE public.bookings
SET total_amount = 613
WHERE (
  LOWER(TRIM(COALESCE(customer_email, ''))) = 'lynthorpe@gmail.com'
  OR TRIM(COALESCE(customer_name, name, '')) = 'Lynne Thorpe'
);

COMMIT;
