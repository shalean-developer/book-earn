-- Add estimated_duration_minutes to bookings (minimum 3.5 hours; affected by service, property, extras).
-- Existing rows remain NULL; new bookings get the value set on insert.
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS estimated_duration_minutes integer;

COMMENT ON COLUMN bookings.estimated_duration_minutes IS 'Estimated time for cleaner to complete the job (minutes). Minimum 210 (3.5h).';
