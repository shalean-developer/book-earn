-- Cleaner profile: bank account and editable profile fields for payouts.
-- Run in Supabase SQL editor. Profiles table must exist (e.g. from auth/setup).

-- Bank account fields (for cleaner payouts; only used when role = 'cleaner')
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_account_holder text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_branch_code text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_type text;

COMMENT ON COLUMN public.profiles.bank_account_holder IS 'Full name as on bank account (cleaner payouts)';
COMMENT ON COLUMN public.profiles.bank_account_number IS 'Bank account number (cleaner payouts)';
COMMENT ON COLUMN public.profiles.bank_branch_code IS 'Branch code / universal branch code (SA)';
COMMENT ON COLUMN public.profiles.bank_name IS 'Bank name e.g. FNB, Standard Bank';
COMMENT ON COLUMN public.profiles.bank_account_type IS 'e.g. current, savings, transmission';
