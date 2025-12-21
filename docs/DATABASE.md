# Database Schema

This document describes the Supabase PostgreSQL database schema, including all tables, RLS policies, triggers, and functions.

---

## Core Tables

### `profiles`

User profile data, linked to Supabase Auth.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  home_address TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'unlimited')),
  is_admin BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Subscription Tiers:**
- `free` - Free (Limited): 1 spot, 1 trigger
- `pro` - Free (Beta): Unlimited access during beta
- `unlimited` - Premium: Unlimited access ($5/month)

**RLS Policies:**
- Users can read/update their own profile
- Admins can read/update all profiles (via `is_admin()` function)
- Trigger prevents non-admins from modifying `is_admin` or `subscription_tier`

---

### `surf_spots`

Master database of surf spots (1,225 pre-loaded).

```sql
CREATE TABLE public.surf_spots (
  id TEXT PRIMARY KEY,                    -- Generated from name + coordinates
  name TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lon NUMERIC NOT NULL,
  region TEXT NOT NULL,
  country_group TEXT NOT NULL CHECK (country_group IN ('USA', 'Mexico', 'Central America', 'Canada')),
  country TEXT,
  buoy_id TEXT,                           -- Recommended NOAA buoy
  buoy_name TEXT,                         -- Human-readable buoy name
  verified BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'official' CHECK (source IN ('official', 'community', 'user')),
  submitted_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_surf_spots_country_group ON public.surf_spots(country_group);
CREATE INDEX idx_surf_spots_verified ON public.surf_spots(verified);
CREATE INDEX idx_surf_spots_source ON public.surf_spots(source);
CREATE INDEX idx_surf_spots_name ON public.surf_spots(name);
```

**Source Types:**
- `official` - From curated database (pre-verified)
- `community` - User-submitted, pending admin review
- `user` - User's private custom spot

**RLS Policies:**
- Anyone can read verified spots
- Admins can read all spots
- Only admins can modify spots

---

### `user_spots`

User's saved spots with their settings.

```sql
CREATE TABLE public.user_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  master_spot_id TEXT REFERENCES public.surf_spots(id),  -- Link to master spot
  name TEXT NOT NULL,
  lat NUMERIC,
  lon NUMERIC,
  buoy_id TEXT,
  buoy_name TEXT,
  icon TEXT DEFAULT 'waves',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, master_spot_id)
);
```

**RLS Policies:**
- Users can CRUD their own spots
- Trigger enforces 1 spot limit for free tier

---

### `triggers`

User-defined alert conditions per spot.

```sql
CREATE TABLE public.triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.user_spots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('fair', 'good', 'epic')),

  -- Wave conditions
  min_height NUMERIC DEFAULT 2,
  max_height NUMERIC DEFAULT 10,
  min_period NUMERIC DEFAULT 8,
  swell_directions TEXT[] DEFAULT '{}',

  -- Wind conditions
  wind_directions TEXT[] DEFAULT '{}',
  max_wind_speed NUMERIC DEFAULT 15,

  -- Notification style
  notification_style TEXT CHECK (notification_style IN ('local', 'hype', 'custom')),

  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- Users can CRUD their own triggers

---

### `alert_schedules`

User's alert timing preferences.

```sql
CREATE TABLE public.alert_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Alert types
  night_before_enabled BOOLEAN DEFAULT TRUE,
  morning_check_enabled BOOLEAN DEFAULT TRUE,
  popup_alerts_enabled BOOLEAN DEFAULT TRUE,

  -- Timing
  night_before_time TIME DEFAULT '20:00',
  morning_check_time TIME DEFAULT '06:00',
  popup_interval_hours INTEGER DEFAULT 2,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_start TIME DEFAULT '22:00',
  quiet_end TIME DEFAULT '06:00',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);
```

---

### `user_preferences`

User notification and display preferences.

```sql
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Message style
  ai_personality TEXT DEFAULT 'stoked_local',
  include_emoji BOOLEAN DEFAULT TRUE,
  include_buoy_data BOOLEAN DEFAULT FALSE,
  include_traffic BOOLEAN DEFAULT TRUE,

  -- Units
  use_metric BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);
```

---

### `sent_alerts`

History of all sent notifications.

```sql
CREATE TABLE public.sent_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID REFERENCES public.user_spots(id) ON DELETE SET NULL,
  trigger_id UUID REFERENCES public.triggers(id) ON DELETE SET NULL,

  -- Alert content
  alert_type TEXT NOT NULL CHECK (alert_type IN ('forecast', 'realtime', 'popup')),
  message_content TEXT NOT NULL,

  -- Delivery info
  delivery_channel TEXT NOT NULL CHECK (delivery_channel IN ('sms', 'email')),
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('queued', 'sent', 'failed')),

  -- Condition snapshot
  condition_matched TEXT CHECK (condition_matched IN ('fair', 'good', 'epic')),
  condition_data JSONB,  -- Snapshot of buoy/forecast data when sent

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for recent alerts query
CREATE INDEX idx_sent_alerts_user_created ON public.sent_alerts(user_id, created_at DESC);
```

---

### `waitlist`

Pre-launch email waitlist with referral system.

```sql
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited')),
  referral_code TEXT NOT NULL UNIQUE,        -- 6-char code for sharing
  referred_by UUID REFERENCES public.waitlist(id) ON DELETE SET NULL,
  referral_count INTEGER DEFAULT 0,          -- Number of referrals (denormalized)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_waitlist_referral_code ON public.waitlist(referral_code);
CREATE INDEX idx_waitlist_priority ON public.waitlist(referral_count DESC, created_at ASC);
```

**Status Types:**
- `pending` - Joined waitlist, awaiting invite
- `invited` - Admin sent magic link invite

**Referral System:**
- `referral_code` - Auto-generated 6-char uppercase alphanumeric (excludes I,O,0,1)
- `referred_by` - UUID of the waitlist entry that referred this user
- `referral_count` - Denormalized count of referrals (auto-incremented via trigger)
- Priority sorting: Higher referral_count = higher in queue

**Functions:**
- `generate_referral_code()` - Generates unique 6-char code
- `get_referrer_id(code)` - Looks up referrer UUID by code (public RPC)

**RLS Policies:**
- Anyone can insert (public signup)
- Only admins can select/update/delete

---

## Cache Tables (Planned)

### `buoy_readings`

Cache for NOAA buoy data.

```sql
CREATE TABLE public.buoy_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buoy_id TEXT NOT NULL,
  reading_timestamp TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  -- Wave data
  wave_height NUMERIC,           -- feet
  wave_period NUMERIC,           -- seconds
  mean_wave_direction NUMERIC,   -- degrees
  mean_wave_direction_text TEXT, -- cardinal

  -- Wind data
  wind_speed NUMERIC,            -- mph
  wind_direction NUMERIC,        -- degrees
  wind_direction_text TEXT,      -- cardinal
  wind_gust NUMERIC,

  -- Temperature
  water_temp NUMERIC,            -- Fahrenheit
  air_temp NUMERIC,

  is_stale BOOLEAN DEFAULT FALSE,
  raw_data JSONB,

  UNIQUE(buoy_id, reading_timestamp)
);

CREATE INDEX idx_buoy_readings_buoy_id ON public.buoy_readings(buoy_id);
CREATE INDEX idx_buoy_readings_timestamp ON public.buoy_readings(reading_timestamp DESC);
```

---

### `forecast_cache`

Cache for Open-Meteo forecast data.

```sql
CREATE TABLE public.forecast_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_key TEXT NOT NULL,              -- "lat,lon" format
  forecast_timestamp TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  -- Primary swell
  primary_wave_height NUMERIC,
  primary_wave_period NUMERIC,
  primary_wave_direction NUMERIC,
  primary_wave_direction_text TEXT,

  -- Secondary swell
  secondary_wave_height NUMERIC,
  secondary_wave_period NUMERIC,
  secondary_wave_direction NUMERIC,
  secondary_wave_direction_text TEXT,

  -- Wind
  wind_speed NUMERIC,
  wind_direction NUMERIC,
  wind_direction_text TEXT,
  wind_gust NUMERIC,

  -- Tide
  tide_height NUMERIC,
  tide_direction TEXT,

  -- Temperature
  air_temp NUMERIC,
  sea_surface_temp NUMERIC,

  raw_data JSONB,

  UNIQUE(location_key, forecast_timestamp)
);

CREATE INDEX idx_forecast_location ON public.forecast_cache(location_key);
CREATE INDEX idx_forecast_timestamp ON public.forecast_cache(forecast_timestamp);
```

---

### `alert_queue`

Queue for pending alerts.

```sql
CREATE TABLE public.alert_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.user_spots(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES public.triggers(id) ON DELETE SET NULL,

  alert_type TEXT NOT NULL CHECK (alert_type IN ('forecast', 'realtime', 'popup')),
  check_type TEXT NOT NULL CHECK (check_type IN ('scheduled', 'popup_change')),

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'skipped', 'failed')),

  matched_condition TEXT CHECK (matched_condition IN ('fair', 'good', 'epic')),
  condition_snapshot JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  skip_reason TEXT,
  error_message TEXT,
  dedup_key TEXT
);

CREATE INDEX idx_alert_queue_status ON public.alert_queue(status);
CREATE INDEX idx_alert_queue_user ON public.alert_queue(user_id);
```

---

## Triggers & Functions

### Protect Sensitive Columns

Prevents users from modifying `is_admin` or `subscription_tier`:

```sql
CREATE OR REPLACE FUNCTION protect_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE TRIGGER protect_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION protect_sensitive_columns();
```

---

### Check Admin Status

Security definer function to check if current user is admin (avoids RLS recursion):

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

Used in RLS policies for admin access to all profiles.

---

### Enforce Spot Limit

Free tier users limited to 1 spot. Admins, pro, and unlimited tiers have no limit:

```sql
CREATE OR REPLACE FUNCTION check_spot_limit()
RETURNS TRIGGER AS $$
DECLARE
  spot_count INTEGER;
  user_tier TEXT;
  user_is_admin BOOLEAN;
BEGIN
  SELECT subscription_tier, is_admin INTO user_tier, user_is_admin
  FROM public.profiles WHERE id = NEW.user_id;

  -- Admins and unlimited/pro tier users have no limits
  IF user_is_admin = TRUE OR user_tier = 'unlimited' OR user_tier = 'pro' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO spot_count
  FROM public.user_spots WHERE user_id = NEW.user_id;

  IF user_tier = 'free' AND spot_count >= 1 THEN
    RAISE EXCEPTION 'Free tier limit: 1 spot maximum. Upgrade to Free (Beta) for unlimited access.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_spot_limit
  BEFORE INSERT ON public.user_spots
  FOR EACH ROW EXECUTE FUNCTION check_spot_limit();
```

---

### Update Timestamp

Auto-update `updated_at` column:

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- (Similar triggers for other tables)
```

---

## Views

### `admin_user_stats`

Aggregated view for admin user management panel. Joins profiles with activity counts.

```sql
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT
  p.id, p.email, p.phone, p.phone_verified, p.home_address,
  p.subscription_tier, p.is_admin, p.onboarding_completed,
  p.created_at, p.updated_at,
  -- Activity counts
  COALESCE(us.spots_count, 0)::integer AS spots_count,
  COALESCE(t.triggers_count, 0)::integer AS triggers_count,
  COALESCE(sa.alerts_sent, 0)::integer AS alerts_sent,
  -- Last activity
  GREATEST(p.updated_at, us.last_spot_activity, t.last_trigger_activity, sa.last_alert_sent) AS last_activity
FROM public.profiles p
LEFT JOIN (SELECT user_id, COUNT(*) AS spots_count, MAX(updated_at) AS last_spot_activity FROM public.user_spots GROUP BY user_id) us ON p.id = us.user_id
LEFT JOIN (SELECT user_id, COUNT(*) AS triggers_count, MAX(updated_at) AS last_trigger_activity FROM public.triggers GROUP BY user_id) t ON p.id = t.user_id
LEFT JOIN (SELECT user_id, COUNT(*) AS alerts_sent, MAX(sent_at) AS last_alert_sent FROM public.sent_alerts GROUP BY user_id) sa ON p.id = sa.user_id;
```

**Access:** Inherits RLS from profiles table. Admins can query via `is_admin()` policy.

---

## Migration History

| Migration | Description |
|-----------|-------------|
| `schema.sql` | Base schema with profiles, user_spots, triggers, etc. |
| `20251216050123_add_admin_and_surf_spots.sql` | Add is_admin, surf_spots table, spot limit trigger |
| `20251218041315_add_notification_style_to_triggers.sql` | Add notification_style column to triggers |
| `20251218085033_add_trigger_columns.sql` | Additional trigger columns |
| `20251218222925_fix_admin_spot_limits.sql` | Admin bypass for spot limits, admin RLS policies |
| `20251218223752_fix_admin_policy_recursion.sql` | Add is_admin() function to prevent RLS recursion |
| `20251218230549_pro_tier_unlimited.sql` | Pro tier gets unlimited access during beta |
| `20251218230741_add_pro_tier_constraint.sql` | Add 'pro' to subscription_tier constraint |
| `20251218231941_add_admin_user_stats_view.sql` | Admin user stats view for user management |
| `20251219000001_add_alert_settings.sql` | Base alert_settings table |
| `20251219000002_simplify_alert_window.sql` | Window mode, start/end times |
| `20251219000003_add_active_days.sql` | Active days for scheduling |
| `20251219000004_add_two_day_forecast.sql` | Two-day forecast alert type |
| `20251219150000_add_locals_knowledge.sql` | Locals knowledge feature |
| `20251219172500_update_handle_new_user.sql` | Update handle_new_user function |
| `20251219180000_add_five_day_forecast.sql` | Five-day forecast alert type |
| `20251219200000_add_home_coordinates.sql` | Home coordinates for profiles |
| `20251219210000_add_spot_sort_order.sql` | Spot sort order for user_spots |
| `20251221000001_allow_user_spot_submissions.sql` | User spot submissions |
| `20251221100000_add_waitlist_table.sql` | Waitlist table |
| `20251222000003_add_waitlist_referrals.sql` | Add referral system to waitlist (referral_code, referred_by, referral_count) |

---

## RLS Policy Summary

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| profiles | Own + Admin (all) | Auto (trigger) | Own + Admin (all) | - |
| surf_spots | Verified + Admin | Admin | Admin | Admin |
| user_spots | Own | Own (limited) | Own | Own |
| triggers | Own | Own | Own | Own |
| alert_schedules | Own | Own | Own | Own |
| user_preferences | Own | Own | Own | Own |
| sent_alerts | Own | System | - | - |
| waitlist | Admin only | Anyone | Admin only | Admin only |
| admin_user_stats | Admin only | - | - | - |
