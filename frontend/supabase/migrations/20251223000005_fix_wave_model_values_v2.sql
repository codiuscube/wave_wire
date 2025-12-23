-- Migration: Fix wave model values to match verified Open-Meteo API values
-- Description: Simplifies to only models that are confirmed to work

-- Drop existing constraints
ALTER TABLE public.triggers DROP CONSTRAINT IF EXISTS triggers_wave_model_check;
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_default_wave_model_check;

-- Reset any invalid values to best_match
UPDATE public.triggers SET wave_model = 'best_match' WHERE wave_model NOT IN ('best_match', 'ecmwf_wam', 'meteofrance_wave');
UPDATE public.user_preferences SET default_wave_model = 'best_match' WHERE default_wave_model NOT IN ('best_match', 'ecmwf_wam', 'meteofrance_wave');

-- Add new constraints with verified Open-Meteo API model values
ALTER TABLE public.triggers
  ADD CONSTRAINT triggers_wave_model_check
  CHECK (wave_model IN ('best_match', 'ecmwf_wam', 'meteofrance_wave'));

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_default_wave_model_check
  CHECK (default_wave_model IN ('best_match', 'ecmwf_wam', 'meteofrance_wave'));
