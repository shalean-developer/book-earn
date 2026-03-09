-- Pricing config and history tables for Shalean.
-- pricing_config: active price rules (base, bedroom, bathroom, extras, service_fee, etc.).
-- pricing_history: audit log of price changes (populated by trigger or application).

CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(50),
  price_type VARCHAR(50) NOT NULL,
  item_name VARCHAR(200),
  price DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS pricing_config_service_type_price_type_active_idx
  ON public.pricing_config (service_type, price_type, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS pricing_config_effective_end_dates_idx
  ON public.pricing_config (effective_date, end_date);

COMMENT ON TABLE public.pricing_config IS 'Price rules for services: base, per bedroom/bathroom, extras, service_fee, frequency_discount, etc.';
COMMENT ON COLUMN public.pricing_config.service_type IS 'E.g. Standard, Deep, Move In/Out, Airbnb, Carpet; null for global extras/fees.';
COMMENT ON COLUMN public.pricing_config.price_type IS 'base, bedroom, bathroom, extra, service_fee, frequency_discount, equipment_charge.';

CREATE TABLE IF NOT EXISTS public.pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_config_id UUID NOT NULL REFERENCES public.pricing_config(id) ON DELETE CASCADE,
  service_type VARCHAR(50),
  price_type VARCHAR(50),
  item_name VARCHAR(200),
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_reason TEXT,
  effective_date DATE,
  end_date DATE
);

CREATE INDEX IF NOT EXISTS pricing_history_config_id_idx ON public.pricing_history (pricing_config_id);
CREATE INDEX IF NOT EXISTS pricing_history_changed_at_idx ON public.pricing_history (changed_at DESC);

COMMENT ON TABLE public.pricing_history IS 'Audit log of price changes for pricing_config rows.';

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_history ENABLE ROW LEVEL SECURITY;

-- Server actions use service role; RLS enabled for consistency. No public policies.

-- Trigger: on UPDATE of pricing_config, insert a row into pricing_history when price changes.
CREATE OR REPLACE FUNCTION public.pricing_config_log_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price
     OR OLD.effective_date IS DISTINCT FROM NEW.effective_date
     OR OLD.end_date IS DISTINCT FROM NEW.end_date
     OR OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO public.pricing_history (
      pricing_config_id, service_type, price_type, item_name,
      old_price, new_price, changed_by, changed_at, change_reason,
      effective_date, end_date
    ) VALUES (
      NEW.id, NEW.service_type, NEW.price_type, NEW.item_name,
      OLD.price, NEW.price, auth.uid(), now(), NULL,
      NEW.effective_date, NEW.end_date
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pricing_config_history_trigger ON public.pricing_config;
CREATE TRIGGER pricing_config_history_trigger
  AFTER UPDATE ON public.pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.pricing_config_log_history();
