-- Migration: Add default wave model preference for dashboard display
-- Description: Global preference for which model to display on dashboard

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS default_wave_model TEXT DEFAULT 'best_match'
  CHECK (default_wave_model IN ('best_match', 'gfs_wave', 'ecmwf_wam', 'mfwam', 'dwd_ewam', 'dwd_gwam', 'era5_ocean'));

COMMENT ON COLUMN public.user_preferences.default_wave_model IS 'Default wave model for dashboard display';
