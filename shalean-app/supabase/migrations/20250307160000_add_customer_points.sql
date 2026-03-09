-- Add rewards points for customers. Tier is derived in app from points.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.points IS 'Loyalty points for customers; used for rewards tier and redemption.';
