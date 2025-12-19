-- ITSPUMPING.AI Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  home_address TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'unlimited')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SURF SPOTS
-- ============================================
CREATE TABLE public.user_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  buoy_id TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================
-- ALERT TRIGGERS
-- ============================================
CREATE TABLE public.triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.user_spots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🌊',
  condition TEXT DEFAULT 'good' CHECK (condition IN ('fair', 'good', 'epic')),
  min_height NUMERIC,
  max_height NUMERIC,
  min_period NUMERIC,
  max_period NUMERIC,
  swell_directions TEXT[],
  wind_directions TEXT[],
  max_wind_speed NUMERIC,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ALERT SCHEDULES
-- ============================================
CREATE TABLE public.alert_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('forecast', 'realtime', 'popup')),
  description TEXT,
  check_time TIME,
  enabled BOOLEAN DEFAULT TRUE,
  active_days TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUIET HOURS
-- ============================================
CREATE TABLE public.quiet_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  start_time TIME DEFAULT '22:00',
  end_time TIME DEFAULT '06:00',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- SENT ALERTS (History)
-- ============================================
CREATE TABLE public.sent_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID REFERENCES public.user_spots(id) ON DELETE SET NULL,
  trigger_id UUID REFERENCES public.triggers(id) ON DELETE SET NULL,
  alert_type TEXT CHECK (alert_type IN ('forecast', 'realtime', 'popup')),
  condition_matched TEXT CHECK (condition_matched IN ('fair', 'good', 'epic')),
  message_content TEXT,
  delivery_channel TEXT CHECK (delivery_channel IN ('sms', 'email')),
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('queued', 'sent', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SMS USAGE TRACKING (Free tier limit)
-- ============================================
CREATE TABLE public.sms_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- e.g., '2025-01'
  sms_count INTEGER DEFAULT 0,
  UNIQUE(user_id, year_month)
);

-- ============================================
-- USER PREFERENCES (Personality settings)
-- ============================================
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ai_personality TEXT DEFAULT 'stoked_local' CHECK (ai_personality IN ('stoked_local', 'chill_surfer', 'data_nerd', 'hype_beast')),
  include_emoji BOOLEAN DEFAULT TRUE,
  include_buoy_data BOOLEAN DEFAULT FALSE,
  include_traffic BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiet_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User Spots: Users can only access their own spots
CREATE POLICY "Users can view own spots" ON public.user_spots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own spots" ON public.user_spots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spots" ON public.user_spots
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spots" ON public.user_spots
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers: Users can only access their own triggers
CREATE POLICY "Users can view own triggers" ON public.triggers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own triggers" ON public.triggers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own triggers" ON public.triggers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own triggers" ON public.triggers
  FOR DELETE USING (auth.uid() = user_id);

-- Alert Schedules
CREATE POLICY "Users can view own schedules" ON public.alert_schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON public.alert_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON public.alert_schedules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON public.alert_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Quiet Hours
CREATE POLICY "Users can view own quiet hours" ON public.quiet_hours
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiet hours" ON public.quiet_hours
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiet hours" ON public.quiet_hours
  FOR UPDATE USING (auth.uid() = user_id);

-- Sent Alerts
CREATE POLICY "Users can view own sent alerts" ON public.sent_alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sent alerts" ON public.sent_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SMS Usage
CREATE POLICY "Users can view own sms usage" ON public.sms_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sms usage" ON public.sms_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sms usage" ON public.sms_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- User Preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_user_spots_user_id ON public.user_spots(user_id);
CREATE INDEX idx_triggers_user_id ON public.triggers(user_id);
CREATE INDEX idx_triggers_spot_id ON public.triggers(spot_id);
CREATE INDEX idx_sent_alerts_user_id ON public.sent_alerts(user_id);
CREATE INDEX idx_sent_alerts_sent_at ON public.sent_alerts(sent_at DESC);
CREATE INDEX idx_sms_usage_user_month ON public.sms_usage(user_id, year_month);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  -- Also create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  -- Create default quiet hours
  INSERT INTO public.quiet_hours (user_id)
  VALUES (NEW.id);

  -- Create default alert schedules
  INSERT INTO public.alert_schedules (user_id, name, type, description, check_time)
  VALUES
    (NEW.id, 'Night Before Hype', 'forecast', 'Check tomorrow''s forecast', '20:00'),
    (NEW.id, 'Morning Reality Check', 'realtime', 'Live buoy validation', '06:00'),
    (NEW.id, 'Pop-Up Alert', 'popup', 'Catches sudden changes', NULL);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_spots_updated_at
  BEFORE UPDATE ON public.user_spots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_triggers_updated_at
  BEFORE UPDATE ON public.triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_alert_schedules_updated_at
  BEFORE UPDATE ON public.alert_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
