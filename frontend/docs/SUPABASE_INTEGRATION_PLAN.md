# ITSPUMPING.AI - Supabase Integration Plan

## Overview
Wire up frontend pages to Supabase backend. Current scope: **Account**, **Spots**, and **Dashboard Overview** pages, plus admin features.

**Auth Status:** Using email/password (Twilio A2P approval pending for SMS)

---

## Phase 0: Prerequisites

### 0.1 Install Docker (Required for Supabase CLI) ✅
Supabase CLI requires Docker for local development and type generation.

**macOS:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Install and launch Docker Desktop
3. Wait for Docker to fully start (whale icon stops animating)
4. Verify: `docker --version`

**Status:** Docker 28.4.0 installed

### 0.2 Install Supabase CLI ✅
```bash
brew install supabase/tap/supabase
```

**Status:** Supabase CLI 2.65.5 installed

### 0.3 Initialize Supabase Project ✅
```bash
cd frontend
# Check if already initialized
if [ ! -f "supabase/config.toml" ]; then
  supabase init
fi
supabase link --project-ref rbqfhcmykqdndwbtewtb
```

**Status:** Linked to project `rbqfhcmykqdndwbtewtb`

---

## Phase 1: Database Migrations

### 1.1 Add `is_admin` to profiles + Trigger Protection ✅

**CRITICAL:** Use TRIGGER (not RLS policy) because RLS policies are additive (OR logic). An RLS "deny" policy would be bypassed by existing "Users can update own profile" policy.

```sql
-- Add is_admin column
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Trigger to protect sensitive columns
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

**Status:** Applied via migration `20251216050123_add_admin_and_surf_spots.sql`

### 1.2 Bootstrap Admins ✅

**CRITICAL:** The trigger blocks admin updates, so temporarily disable it first:

```sql
-- Temporarily disable the trigger
ALTER TABLE public.profiles DISABLE TRIGGER protect_profile_sensitive_columns;

-- Set admins
UPDATE public.profiles SET is_admin = true
WHERE email IN (
  'cody@wave-wire.com',
  'shaun@wave-wire.com',
  'cody.a.iddings@gmail.com'
);

-- Re-enable the trigger
ALTER TABLE public.profiles ENABLE TRIGGER protect_profile_sensitive_columns;
```

**Status:** ✅ Applied in Supabase SQL Editor

### 1.3 Create `surf_spots` Master Table ✅

```sql
CREATE TABLE public.surf_spots (
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

-- Enable RLS
ALTER TABLE public.surf_spots ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified spots
CREATE POLICY "Anyone can view verified spots" ON public.surf_spots
  FOR SELECT USING (verified = TRUE OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Only admins can modify
CREATE POLICY "Admins can manage spots" ON public.surf_spots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Indexes
CREATE INDEX idx_surf_spots_country_group ON public.surf_spots(country_group);
CREATE INDEX idx_surf_spots_verified ON public.surf_spots(verified);

-- Updated at trigger
CREATE TRIGGER update_surf_spots_updated_at
  BEFORE UPDATE ON public.surf_spots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

**Status:** Applied via migration `20251216050123_add_admin_and_surf_spots.sql`

### 1.4 Add FK from user_spots to surf_spots ✅

```sql
ALTER TABLE public.user_spots
  ADD COLUMN master_spot_id TEXT REFERENCES public.surf_spots(id);
```

**Status:** Applied via migration `20251216050123_add_admin_and_surf_spots.sql`

### 1.5 Server-Side Spot Limit Enforcement ✅

**CRITICAL:** Frontend validation is PRIMARY user feedback. DB trigger is safety net only (returns generic SQL error).

```sql
CREATE OR REPLACE FUNCTION check_spot_limit()
RETURNS TRIGGER AS $$
DECLARE
  spot_count INTEGER;
  user_tier TEXT;
BEGIN
  SELECT subscription_tier INTO user_tier
  FROM public.profiles WHERE id = NEW.user_id;

  SELECT COUNT(*) INTO spot_count
  FROM public.user_spots WHERE user_id = NEW.user_id;

  IF user_tier = 'free' AND spot_count >= 1 THEN
    RAISE EXCEPTION 'Free tier limit: 1 spot maximum. Upgrade to add more.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_spot_limit
  BEFORE INSERT ON public.user_spots
  FOR EACH ROW EXECUTE FUNCTION check_spot_limit();
```

**Status:** Applied via migration `20251216050123_add_admin_and_surf_spots.sql`

### 1.6 Migrate 1,217 Surf Spots ✅

Script: `scripts/migrate-surf-spots.ts` (run with `npx tsx`)

**Run command:**
```bash
SUPABASE_URL=https://rbqfhcmykqdndwbtewtb.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npx tsx scripts/migrate-surf-spots.ts
```

**Results:**
- Total spots: 1,225
- Migrated: 1,217 (8 skipped due to null lat/lon)
- By region: USA (714), Central America (134), Mexico (105), Canada (47)

**Status:** ✅ Complete

---

## Phase 2: TypeScript Types

### 2.1 Auto-Generate from Supabase ✅
```bash
supabase gen types typescript --linked > src/types/supabase.ts
```

**Status:** ✅ Generated at `src/types/supabase.ts`

### 2.2 Create Mappers ✅
**File:** `src/lib/mappers.ts`

Convert snake_case DB types to camelCase frontend types.

**Exports:**
- Frontend types: `Profile`, `SurfSpot`, `UserSpot`, `Trigger`, `SentAlert`, `AlertSchedule`, `UserPreferences`
- DB → Frontend: `mapProfile`, `mapSurfSpot`, `mapUserSpot`, `mapTrigger`, `mapSentAlert`, `mapAlertSchedule`, `mapUserPreferences`
- Frontend → DB: `toDbProfileUpdate`, `toDbUserSpotInsert/Update`, `toDbTriggerInsert/Update`, `toDbAlertScheduleInsert/Update`, `toDbUserPreferencesInsert/Update`, `toDbSurfSpotInsert/Update`

**Status:** ✅ Complete

---

## Phase 3: Custom Hooks ✅

| Hook | Purpose | Status |
|------|---------|--------|
| `useProfile(userId)` | Fetch/update profile from `profiles` | ✅ |
| `useUserSpots(userId, tier)` | CRUD for `user_spots`, enforces free tier limit | ✅ |
| `useSurfSpots(options)` | Query master `surf_spots` list with filters | ✅ |
| `useSentAlerts(userId)` | Fetch recent alerts from `sent_alerts` | ✅ |

All hooks follow existing pattern: `{ data, isLoading, error, refresh, ...mutations }`

**Exports from `src/hooks/index.ts`:**
- `useProfile` - profile CRUD with `update()` method
- `useUserSpots` - spot CRUD with `canAddSpot`, `addSpot()`, `updateSpot()`, `deleteSpot()`
- `useSurfSpots` - master spots query with admin `toggleVerified()`, `addSpot()`, `updateSpot()`, `deleteSpot()`
- `useSentAlerts` - read-only alert history with filters

---

## Phase 4: Update AuthContext ✅

**File:** `src/contexts/AuthContext.tsx`

- [x] Remove `ADMIN_USER_IDS` array and localStorage fallback
- [x] Fetch `is_admin` from `profiles` table when user changes

**CRITICAL - Prevent Flicker:**
Added `isLoadingProfile` state. Global `loading` stays true until BOTH auth session AND profile data are loaded.

```typescript
const [isLoadingAuth, setIsLoadingAuth] = useState(true);
const [isLoadingProfile, setIsLoadingProfile] = useState(true);
const loading = isLoadingAuth || isLoadingProfile;
```

**Status:** ✅ Complete

---

## Phase 5: Wire Up Pages ✅

### 5.1 AccountPage.tsx ✅
- [x] Use `useProfile` to fetch/update user data
- [x] Replace hardcoded phone/email/address with profile data
- [x] Save button calls `profile.update()`
- [x] Added loading/error states and save feedback

### 5.2 SpotPage.tsx ✅
- [x] Use `useUserSpots` for CRUD operations
- [x] Check `canAddSpot` (free tier = 1 spot limit)
- [x] Show upgrade prompt when limit reached
- [x] Wire icon updates and buoy assignment to DB

### 5.3 DashboardOverview.tsx ✅
- [x] Use `useUserSpots` for user's spots
- [x] Use `useSentAlerts` for recent alert history
- [x] Map data to existing component formats
- [x] Added empty states for no spots/alerts

### 5.4 AdminSpotsPage.tsx ✅
- [x] Use `useSurfSpots` with admin filters (`includeUnverified: true`)
- [x] Wire verify toggle, edit, and add to hook methods
- [x] Admin check via AuthContext (from Supabase)
- [x] Removed dev mode toggle (admin from DB now)

### 5.5 AddSpotModal.tsx ✅
- [x] Use `useSurfSpots` instead of local `getSurfSpots()`
- [x] Pass region/search filters to hook
- [x] Added loading state during search

---

## Implementation Progress

| Step | Task | Status |
|------|------|--------|
| 1 | Docker + Supabase CLI | ✅ Complete |
| 2 | Base schema (schema.sql) | ✅ Complete |
| 3 | Schema migrations (is_admin, surf_spots, triggers) | ✅ Complete |
| 4 | Bootstrap admins | ✅ Complete |
| 5 | Generate types | ✅ Complete |
| 6 | Data seed (1,217 spots) | ✅ Complete |
| 7 | Mappers | ✅ Complete |
| 8 | Hooks | ✅ Complete |
| 9 | AuthContext | ✅ Complete |
| 10 | Pages | ✅ Complete |

---

## Critical Files

| File | Action | Status |
|------|--------|--------|
| `supabase/migrations/20251216050123_add_admin_and_surf_spots.sql` | Migration for is_admin, surf_spots, triggers | ✅ |
| `src/types/supabase.ts` | Auto-generated via `supabase gen types` | ✅ |
| `scripts/migrate-surf-spots.ts` | Seed 1,217 spots | ✅ |
| `src/lib/mappers.ts` | Create - snake_case → camelCase | ✅ |
| `src/hooks/useProfile.ts` | Create | ✅ |
| `src/hooks/useUserSpots.ts` | Create | ✅ |
| `src/hooks/useSurfSpots.ts` | Create | ✅ |
| `src/hooks/useSentAlerts.ts` | Create | ✅ |
| `src/contexts/AuthContext.tsx` | Update admin logic | ✅ |
| `src/pages/AccountPage.tsx` | Wire to useProfile | ✅ |
| `src/pages/SpotPage.tsx` | Wire to useUserSpots | ✅ |
| `src/pages/DashboardOverview.tsx` | Wire to hooks | ✅ |
| `src/pages/AdminSpotsPage.tsx` | Wire to useSurfSpots | ✅ |
| `src/components/ui/AddSpotModal.tsx` | Wire to useSurfSpots | ✅ |

---

## Security Notes

- **Sensitive column protection** - BEFORE UPDATE trigger (not RLS!) prevents users from modifying `is_admin` or `subscription_tier`
- **Server-side spot limits** - PostgreSQL trigger enforces 1 spot limit for free tier
- **RLS** - All queries protected by Row Level Security policies
- **Email only** - Twilio SMS paused until A2P approval

---

## Future Phases (Not in Current Scope)

### Triggers & Alerts Pages
- Wire TriggersPage.tsx to triggers CRUD
- Wire AlertsPage.tsx to alert_schedules
- Wire PersonalityPage.tsx to user_preferences

### External Integrations
- NOAA buoy data caching
- Twilio SMS alerts (after A2P approval)
- Claude Haiku for AI message generation
