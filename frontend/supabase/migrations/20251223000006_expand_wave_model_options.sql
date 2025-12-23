-- Migration: Expand wave model options to 7 verified models
-- Description: Updates CHECK constraints with all verified Open-Meteo Marine API model values

-- Drop existing constraints
ALTER TABLE public.triggers DROP CONSTRAINT IF EXISTS triggers_wave_model_check;
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_default_wave_model_check;

-- Add new constraints with all verified Open-Meteo API model values
ALTER TABLE public.triggers
  ADD CONSTRAINT triggers_wave_model_check
  CHECK (wave_model IN ('best_match', 'ncep_gfswave025', 'ncep_gfswave016', 'ecmwf_wam', 'meteofrance_wave', 'ewam', 'gwam'));

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_default_wave_model_check
  CHECK (default_wave_model IN ('best_match', 'ncep_gfswave025', 'ncep_gfswave016', 'ecmwf_wam', 'meteofrance_wave', 'ewam', 'gwam'));
