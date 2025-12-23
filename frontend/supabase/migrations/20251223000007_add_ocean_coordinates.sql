-- Migration: Add ocean coordinates for wave model queries
-- Description: Stores offshore coordinates that hit valid ocean grid points
-- for coarse-resolution wave models (GFS, etc.)

-- Add ocean coordinates to surf_spots (master spots)
ALTER TABLE public.surf_spots
  ADD COLUMN IF NOT EXISTS ocean_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ocean_lon DOUBLE PRECISION;

COMMENT ON COLUMN public.surf_spots.ocean_lat IS 'Latitude nudged offshore to hit ocean grid point for wave models';
COMMENT ON COLUMN public.surf_spots.ocean_lon IS 'Longitude nudged offshore to hit ocean grid point for wave models';

-- Add ocean coordinates to user_spots (user's saved spots)
ALTER TABLE public.user_spots
  ADD COLUMN IF NOT EXISTS ocean_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ocean_lon DOUBLE PRECISION;

COMMENT ON COLUMN public.user_spots.ocean_lat IS 'Latitude nudged offshore to hit ocean grid point for wave models';
COMMENT ON COLUMN public.user_spots.ocean_lon IS 'Longitude nudged offshore to hit ocean grid point for wave models';
