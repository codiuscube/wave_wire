-- Migration: Add expanded trigger fields
-- Created: 2024-12-18
-- Description: Adds wind/swell direction ranges, tide settings, message templates, and notification styles

-- ============================================
-- Add new columns to triggers table
-- ============================================

-- Wind speed range
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS min_wind_speed NUMERIC;

-- Wind direction range (degrees 0-360)
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS min_wind_direction NUMERIC;
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS max_wind_direction NUMERIC;

-- Swell direction range (degrees 0-360)
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS min_swell_direction NUMERIC;
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS max_swell_direction NUMERIC;

-- Tide settings
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS tide_type TEXT CHECK (tide_type IN ('rising', 'falling', 'any'));
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS min_tide_height NUMERIC;
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS max_tide_height NUMERIC;

-- Message customization
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS message_template TEXT;
ALTER TABLE public.triggers ADD COLUMN IF NOT EXISTS notification_style TEXT CHECK (notification_style IN ('local', 'hype', 'custom'));

-- Drop old array-based direction columns if they exist (replaced by numeric ranges)
-- Using DO block to safely drop columns that may or may not exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'triggers' AND column_name = 'wind_directions') THEN
    ALTER TABLE public.triggers DROP COLUMN wind_directions;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'triggers' AND column_name = 'swell_directions') THEN
    ALTER TABLE public.triggers DROP COLUMN swell_directions;
  END IF;
END $$;
