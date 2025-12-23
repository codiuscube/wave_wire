-- Migration: Fix wave model values to match Open-Meteo API
-- Description: Updates CHECK constraints with correct model identifiers

-- Drop old constraints (they were named automatically by Postgres)
-- We need to find and drop them first
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Drop triggers.wave_model constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_namespace n ON c.connamespace = n.oid
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'triggers'
      AND contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%wave_model%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.triggers DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- Drop user_preferences.default_wave_model constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_namespace n ON c.connamespace = n.oid
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'user_preferences'
      AND contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%default_wave_model%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.user_preferences DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

-- Add new constraints with correct Open-Meteo API model values
ALTER TABLE public.triggers
  ADD CONSTRAINT triggers_wave_model_check
  CHECK (wave_model IN ('best_match', 'gfs_wave025', 'ecmwf_wam025', 'mf_wave', 'dwd_ewam', 'dwd_gwam', 'era5_ocean'));

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_default_wave_model_check
  CHECK (default_wave_model IN ('best_match', 'gfs_wave025', 'ecmwf_wam025', 'mf_wave', 'dwd_ewam', 'dwd_gwam', 'era5_ocean'));

-- Update any existing data with old values to new values
UPDATE public.triggers SET wave_model = 'gfs_wave025' WHERE wave_model = 'gfs_wave';
UPDATE public.triggers SET wave_model = 'ecmwf_wam025' WHERE wave_model = 'ecmwf_wam';
UPDATE public.triggers SET wave_model = 'mf_wave' WHERE wave_model = 'mfwam';

UPDATE public.user_preferences SET default_wave_model = 'gfs_wave025' WHERE default_wave_model = 'gfs_wave';
UPDATE public.user_preferences SET default_wave_model = 'ecmwf_wam025' WHERE default_wave_model = 'ecmwf_wam';
UPDATE public.user_preferences SET default_wave_model = 'mf_wave' WHERE default_wave_model = 'mfwam';
