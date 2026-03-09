-- Cleaner verification: manual status + third-party integration path.
-- Part A: verification_status, verification_notes, verified_at.
-- Part B: verification_provider, verification_external_id, verification_result, verification_requested_at.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_provider TEXT,
  ADD COLUMN IF NOT EXISTS verification_external_id TEXT,
  ADD COLUMN IF NOT EXISTS verification_result JSONB,
  ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.verification_status IS 'Cleaner account verification: pending, verified, or rejected.';
COMMENT ON COLUMN public.profiles.verification_notes IS 'Admin-only notes (e.g. reject reason).';
COMMENT ON COLUMN public.profiles.verified_at IS 'Set when verification_status becomes verified.';
COMMENT ON COLUMN public.profiles.verification_provider IS 'Third-party provider key (e.g. yoti, manual).';
COMMENT ON COLUMN public.profiles.verification_external_id IS 'Provider reference for this verification.';
COMMENT ON COLUMN public.profiles.verification_result IS 'Provider response snapshot (structure depends on provider).';
COMMENT ON COLUMN public.profiles.verification_requested_at IS 'When verification was last requested (e.g. for re-verify).';
