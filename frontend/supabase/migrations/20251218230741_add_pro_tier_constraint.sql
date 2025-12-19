-- Migration: Add 'pro' to subscription_tier check constraint
-- Created: 2024-12-18
-- Issue: Database only allows 'free' or 'unlimited', need to add 'pro' for Free (Beta) tier

-- Drop the existing check constraint and add a new one with 'pro' included
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'unlimited'));
