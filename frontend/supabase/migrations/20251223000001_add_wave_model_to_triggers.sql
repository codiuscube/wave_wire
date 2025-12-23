-- Migration: Add wave model selection to triggers
-- Description: Allows users to select which wave model to use for trigger evaluation

-- Add wave_model column to triggers table
-- Default 'best_match' means Open-Meteo auto-selects based on location
ALTER TABLE public.triggers
  ADD COLUMN IF NOT EXISTS wave_model TEXT DEFAULT 'best_match'
  CHECK (wave_model IN ('best_match', 'gfs_wave', 'ecmwf_wam', 'mfwam', 'dwd_ewam', 'dwd_gwam', 'era5_ocean'));

COMMENT ON COLUMN public.triggers.wave_model IS 'Wave forecast model to use. best_match = auto-select by location';
