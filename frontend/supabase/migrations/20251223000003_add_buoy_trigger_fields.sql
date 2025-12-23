-- Migration: Add buoy trigger fields
-- Description: Allows users to create triggers based on live buoy data

-- Buoy trigger enable flag
ALTER TABLE public.triggers
  ADD COLUMN IF NOT EXISTS buoy_trigger_enabled BOOLEAN DEFAULT FALSE;

-- Buoy wave height range
ALTER TABLE public.triggers
  ADD COLUMN IF NOT EXISTS buoy_min_height NUMERIC,
  ADD COLUMN IF NOT EXISTS buoy_max_height NUMERIC;

-- Buoy period range
ALTER TABLE public.triggers
  ADD COLUMN IF NOT EXISTS buoy_min_period NUMERIC,
  ADD COLUMN IF NOT EXISTS buoy_max_period NUMERIC;

-- How buoy check combines with forecast: 'or' = either must match, 'and' = both must match
ALTER TABLE public.triggers
  ADD COLUMN IF NOT EXISTS buoy_trigger_mode TEXT DEFAULT 'or'
  CHECK (buoy_trigger_mode IN ('or', 'and'));

COMMENT ON COLUMN public.triggers.buoy_trigger_enabled IS 'Whether to also check live buoy data for trigger matching';
COMMENT ON COLUMN public.triggers.buoy_trigger_mode IS 'How buoy check combines with forecast: or = either matches, and = both must match';
