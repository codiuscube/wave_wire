-- Add referral system to waitlist table
-- Adds referral_code, referred_by, and referral_count columns
-- This migration is idempotent - safe to run if partially applied

-- Add new columns (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'waitlist' AND column_name = 'referral_code') THEN
    ALTER TABLE public.waitlist ADD COLUMN referral_code TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'waitlist' AND column_name = 'referred_by') THEN
    ALTER TABLE public.waitlist ADD COLUMN referred_by UUID REFERENCES public.waitlist(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'waitlist' AND column_name = 'referral_count') THEN
    ALTER TABLE public.waitlist ADD COLUMN referral_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Index for referral code lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON public.waitlist(referral_code);

-- Index for priority sorting (most referrals first, then by signup date)
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON public.waitlist(referral_count DESC, created_at ASC);

-- Function to generate a unique 6-character alphanumeric code
-- Excludes confusing characters: I, O, 0, 1
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger function to auto-generate referral code on INSERT
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Only generate if not already set
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := generate_referral_code();
      -- Check if code already exists
      IF NOT EXISTS (SELECT 1 FROM public.waitlist WHERE referral_code = new_code) THEN
        NEW.referral_code := new_code;
        EXIT;
      END IF;
      attempts := attempts + 1;
      IF attempts > 10 THEN
        RAISE EXCEPTION 'Could not generate unique referral code after 10 attempts';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS waitlist_set_referral_code ON public.waitlist;
CREATE TRIGGER waitlist_set_referral_code
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION set_referral_code();

-- Trigger function to increment referrer's count when someone uses their code
CREATE OR REPLACE FUNCTION increment_referral_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE public.waitlist
    SET referral_count = referral_count + 1
    WHERE id = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS waitlist_increment_referral ON public.waitlist;
CREATE TRIGGER waitlist_increment_referral
  AFTER INSERT ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION increment_referral_count();

-- Public function to look up referrer ID by referral code
CREATE OR REPLACE FUNCTION get_referrer_id(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_id UUID;
BEGIN
  SELECT id INTO referrer_id
  FROM public.waitlist
  WHERE referral_code = UPPER(code);
  RETURN referrer_id;
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_referrer_id(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_referrer_id(TEXT) TO authenticated;

-- Backfill existing entries with referral codes
UPDATE public.waitlist
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after backfill (only if not already NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'waitlist' AND column_name = 'referral_code' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.waitlist ALTER COLUMN referral_code SET NOT NULL;
  END IF;
END $$;
