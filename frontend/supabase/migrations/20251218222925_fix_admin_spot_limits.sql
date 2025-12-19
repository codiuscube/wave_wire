-- Migration: Fix spot limit check to bypass for admins + Admin user management
-- Created: 2024-12-18
-- Issue: Admins were being blocked by spot limits because the trigger only checked subscription_tier

-- ============================================
-- 1. Add RLS policies for admin user management
-- ============================================
-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Allow admins to update all profiles (for changing subscription tier, admin status)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ============================================
-- 2. Update check_spot_limit to bypass for admins
-- ============================================
CREATE OR REPLACE FUNCTION check_spot_limit()
RETURNS TRIGGER AS $$
DECLARE
  spot_count INTEGER;
  user_tier TEXT;
  user_is_admin BOOLEAN;
BEGIN
  -- Get user's subscription tier and admin status
  SELECT subscription_tier, is_admin INTO user_tier, user_is_admin
  FROM public.profiles WHERE id = NEW.user_id;

  -- Admins and unlimited tier users have no limits
  IF user_is_admin = TRUE OR user_tier = 'unlimited' THEN
    RETURN NEW;
  END IF;

  -- Count existing spots
  SELECT COUNT(*) INTO spot_count
  FROM public.user_spots WHERE user_id = NEW.user_id;

  -- Enforce limit for free tier (1 spot)
  IF user_tier = 'free' AND spot_count >= 1 THEN
    RAISE EXCEPTION 'Free tier limit: 1 spot maximum. Upgrade to add more.';
  END IF;

  -- Pro tier limit (5 spots) - if we add this tier later
  IF user_tier = 'pro' AND spot_count >= 5 THEN
    RAISE EXCEPTION 'Pro tier limit: 5 spots maximum. Upgrade to Premium for unlimited spots.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger already exists, this just updates the function
