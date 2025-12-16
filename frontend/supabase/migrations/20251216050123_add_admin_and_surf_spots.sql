-- Migration: Add admin features and surf_spots master table
-- Created: 2024-12-15

-- ============================================
-- 1. Add is_admin column to profiles
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. Protect sensitive columns with trigger
-- CRITICAL: Use TRIGGER not RLS (RLS policies are additive/OR logic)
-- ============================================
CREATE OR REPLACE FUNCTION protect_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Only admins can modify is_admin or subscription_tier
  IF (OLD.is_admin IS DISTINCT FROM NEW.is_admin) OR
     (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    ) THEN
      RAISE EXCEPTION 'Cannot modify is_admin or subscription_tier';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to avoid conflicts
DROP TRIGGER IF EXISTS protect_profile_sensitive_columns ON public.profiles;

CREATE TRIGGER protect_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION protect_sensitive_columns();

-- ============================================
-- 3. Create surf_spots master table
-- ============================================
CREATE TABLE IF NOT EXISTS public.surf_spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lon NUMERIC NOT NULL,
  region TEXT NOT NULL,
  country_group TEXT NOT NULL CHECK (country_group IN ('USA', 'Mexico', 'Central America', 'Canada')),
  country TEXT,
  buoy_id TEXT,
  buoy_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'official' CHECK (source IN ('official', 'community', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on surf_spots
ALTER TABLE public.surf_spots ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified spots (or admins can read all)
CREATE POLICY "Anyone can view verified spots" ON public.surf_spots
  FOR SELECT USING (
    verified = TRUE OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Only admins can insert
CREATE POLICY "Admins can insert spots" ON public.surf_spots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Only admins can update
CREATE POLICY "Admins can update spots" ON public.surf_spots
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Only admins can delete
CREATE POLICY "Admins can delete spots" ON public.surf_spots
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_surf_spots_country_group ON public.surf_spots(country_group);
CREATE INDEX IF NOT EXISTS idx_surf_spots_verified ON public.surf_spots(verified);
CREATE INDEX IF NOT EXISTS idx_surf_spots_region ON public.surf_spots(region);

-- Updated at trigger for surf_spots
CREATE TRIGGER update_surf_spots_updated_at
  BEFORE UPDATE ON public.surf_spots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 4. Add FK from user_spots to surf_spots
-- ============================================
ALTER TABLE public.user_spots
  ADD COLUMN IF NOT EXISTS master_spot_id TEXT REFERENCES public.surf_spots(id);

-- Add icon column to user_spots if not exists
ALTER TABLE public.user_spots
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- ============================================
-- 5. Server-side spot limit enforcement
-- CRITICAL: Frontend validation is primary UX, this is safety net
-- ============================================
CREATE OR REPLACE FUNCTION check_spot_limit()
RETURNS TRIGGER AS $$
DECLARE
  spot_count INTEGER;
  user_tier TEXT;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.profiles WHERE id = NEW.user_id;

  -- Count existing spots
  SELECT COUNT(*) INTO spot_count
  FROM public.user_spots WHERE user_id = NEW.user_id;

  -- Enforce limit for free tier (1 spot)
  IF user_tier = 'free' AND spot_count >= 1 THEN
    RAISE EXCEPTION 'Free tier limit: 1 spot maximum. Upgrade to add more.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to avoid conflicts
DROP TRIGGER IF EXISTS enforce_spot_limit ON public.user_spots;

CREATE TRIGGER enforce_spot_limit
  BEFORE INSERT ON public.user_spots
  FOR EACH ROW EXECUTE FUNCTION check_spot_limit();
