-- One-off: remove test/unverified cleaner profiles so only verified crew remain.
-- Run in Supabase SQL Editor (or via supabase db push) after confirming your real cleaner is verified.
-- This deletes profile rows only; auth.users entries for those emails remain (remove them in Dashboard > Authentication > Users if needed).

DELETE FROM public.profiles
WHERE role = 'cleaner'
  AND verification_status IN ('pending', 'rejected');
