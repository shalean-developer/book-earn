-- Message status: sent -> delivered (when recipient loads thread) -> read (when recipient opens/views).
-- Run in Supabase SQL editor after booking_messages exists.

ALTER TABLE public.booking_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'delivered', 'read')),
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Existing rows: treat as read so they don't show as unread.
UPDATE public.booking_messages
SET status = 'read', read_at = COALESCE(read_at, created_at), delivered_at = COALESCE(delivered_at, created_at)
WHERE status = 'sent' AND delivered_at IS NULL;

COMMENT ON COLUMN public.booking_messages.status IS 'sent | delivered (recipient loaded) | read (recipient opened)';
