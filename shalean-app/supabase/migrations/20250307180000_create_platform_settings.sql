-- Single-row table for global platform settings (admin-only).
-- id = 1 is the only row; server actions get/update by id = 1.

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  booking_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  automatic_payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  peak_season_pricing_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.platform_settings (id, booking_notifications_enabled, automatic_payouts_enabled, peak_season_pricing_enabled)
VALUES (1, true, false, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE public.platform_settings IS 'Global platform settings; single row id=1; admin-only access.';
