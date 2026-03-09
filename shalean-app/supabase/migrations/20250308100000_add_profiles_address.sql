-- Add optional address to profiles for "Your Information" (contact & service address).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN public.profiles.address IS 'User address for bookings and contact; optional.';
