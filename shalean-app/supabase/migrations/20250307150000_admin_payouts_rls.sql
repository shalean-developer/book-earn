-- Allow admins to read all payouts (for Finance tab).
-- Cleaners already have "Users can read own payouts" (profile_id = auth.uid()).

CREATE POLICY "Admins can read all payouts"
  ON public.payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
