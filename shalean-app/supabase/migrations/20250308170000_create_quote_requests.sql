-- Quote requests: users not ready to book who want a manual quote from agent/admin.
-- Server actions use service role; RLS enabled for consistency.

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  property_type VARCHAR(20) NOT NULL,
  office_size VARCHAR(20),
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  extra_rooms INT NOT NULL DEFAULT 0,
  working_area VARCHAR(100) NOT NULL,
  extras TEXT[] NOT NULL DEFAULT '{}',
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  address TEXT,
  form_url TEXT,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  quoted_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_requests_created_at_idx ON public.quote_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON public.quote_requests (status);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.quote_requests IS 'Quote requests from users; admin sends manual quote via email/WhatsApp.';
COMMENT ON COLUMN public.quote_requests.form_url IS 'URL of the page/form where the quote was submitted (for tracking).';
