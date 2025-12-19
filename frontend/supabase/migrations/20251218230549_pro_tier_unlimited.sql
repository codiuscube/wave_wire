-- Migration: Give pro tier (Free Beta) unlimited access
-- Created: 2024-12-18
-- Pro tier now has the same unlimited access as premium during beta

-- ============================================
-- Update check_spot_limit to also bypass for pro tier
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

  -- Admins, unlimited tier, and pro tier (Free Beta) users have no limits
  IF user_is_admin = TRUE OR user_tier = 'unlimited' OR user_tier = 'pro' THEN
    RETURN NEW;
  END IF;

  -- Count existing spots
  SELECT COUNT(*) INTO spot_count
  FROM public.user_spots WHERE user_id = NEW.user_id;

  -- Enforce limit for free tier (1 spot)
  IF user_tier = 'free' AND spot_count >= 1 THEN
    RAISE EXCEPTION 'Free tier limit: 1 spot maximum. Upgrade to Free (Beta) for unlimited access.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
