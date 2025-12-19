-- Migration: Add locals_knowledge to surf_spots
-- Created: 2025-12-19

ALTER TABLE public.surf_spots
ADD COLUMN IF NOT EXISTS locals_knowledge JSONB DEFAULT NULL;

-- Comment on column
COMMENT ON COLUMN public.surf_spots.locals_knowledge IS 'Stores admin-defined optimal conditions for the spot (epic/good tiers)';
