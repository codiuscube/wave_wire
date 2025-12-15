# Spot Management & Administration

This document covers the surf spots database, NOAA buoy integration, smart buoy recommendations, and admin functionality.

---

## Surf Spots Database

### Overview

The app includes a pre-populated database of **1,225 surf spots** across North/Central America, sourced from a public gist and processed into a structured format.

**Source:** https://gist.githubusercontent.com/naotokui/01c384bf58ca43261eafe6a5e2ad6e85/raw

### Spot Distribution

| Region | Spot Count |
|--------|------------|
| USA | 936 |
| Mexico | 105 |
| Central America | 134 |
| Canada | 50 |
| **Total** | **1,225** |

### Data Structure

```typescript
// src/data/surfSpots.ts

interface SurfSpot {
  id: string;              // Generated from name + coordinates
  name: string;            // Spot name
  lat: number;             // Latitude
  lon: number;             // Longitude
  region: string;          // Sub-region (e.g., "Texas Gulf Coast", "Oahu Hawaii")
  countryGroup: CountryGroup; // 'USA' | 'Mexico' | 'Central America' | 'Canada'
  country: string;         // Original country string from gist
  buoyId?: string;         // Pre-calculated nearest NOAA buoy
  buoyName?: string;       // Human-readable buoy name
  verified: boolean;       // Admin-verified spot
  source: 'official' | 'community' | 'user';
}
```

### Country Groups

```typescript
const COUNTRY_GROUPS = {
  'USA': ['USA'],
  'Mexico': ['Mexico'],
  'Central America': ['Costa Rica', 'Nicaragua', 'Panama', 'Guatemala', 'El Salvador', 'Honduras', 'Belize'],
  'Canada': ['Canada']
};
```

### Files

| File | Purpose |
|------|---------|
| `src/data/surfSpots.ts` | Main spots database (1,225 spots) |
| `src/data/noaaBuoys.ts` | NOAA buoy reference data (60+ buoys) |
| `scripts/process-spots.cjs` | Script to regenerate data from gist |

---

## NOAA Buoy Integration

### Buoy Data

The app includes reference data for **60+ NOAA buoys** across:
- Gulf of Mexico (Texas, Alabama, Florida)
- Atlantic Coast (Florida, Georgia, Carolinas, Mid-Atlantic, New England)
- Pacific Coast (Southern California, Central California, Northern California, Oregon, Washington)
- Hawaii
- Alaska
- Mexico (Pacific and Caribbean)
- Canada (West and East Coast)

```typescript
// src/data/noaaBuoys.ts

interface NOAABuoy {
  id: string;      // NOAA station ID (e.g., "42035")
  name: string;    // Human-readable name (e.g., "Galveston (22nm SE)")
  lat: number;     // Latitude
  lon: number;     // Longitude
  region: string;  // Geographic region
}
```

### Smart Buoy Recommendations

The app uses **swell-aware buoy recommendations** instead of simple distance-based matching.

**Problem:** The closest buoy isn't always the best. Example: Hanalei Bay (Kauai) is closest to Waimea Bay buoy (51201 on Oahu), but locals know buoy 51001 (NW Hawaii offshore) is better because it's in the path of incoming NW swells.

**Solution:** Multi-factor scoring that considers:

1. **Exposure Inference** - Parses region/country fields for directional hints:
   - "Gulf Coast" → Gulf exposure (buoys to the south)
   - "Pacific", "West Coast" → Pacific exposure (buoys to the west/northwest)
   - "Atlantic", "East Coast" → Atlantic exposure (buoys to the east)
   - "Hawaii" + latitude > 21° → North shore (prefer NW buoys)
   - "Hawaii" + latitude < 21° → South shore (prefer S buoys)

2. **Bearing Calculation** - Calculates bearing from spot to each buoy

3. **Combined Scoring** - 60% swell-path match + 40% proximity

```typescript
// src/data/noaaBuoys.ts

// Get recommended buoys with smart scoring
function getRecommendedBuoysWithScoring(
  lat: number,
  lon: number,
  region?: string,
  country?: string,
  maxDistance?: number,
  limit?: number
): BuoyRecommendation[];

// Infer exposure from region/country
function inferExposure(
  region: string,
  country: string,
  lat: number
): Exposure;

// Calculate bearing between two points
function calculateBearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number;
```

### Custom Spot Exposure

When users create custom spots, they select a **swell exposure** to enable smart buoy recommendations:

- Pacific / West Coast
- Atlantic / East Coast
- Gulf Coast
- Hawaii - North Shore
- Hawaii - South Shore
- Caribbean
- Other / Unknown

---

## Admin Page

### Access

**Route:** `/admin/spots`

**Requirements:** User must be logged in and have admin privileges.

### Enabling Admin Mode

**Development (localStorage toggle):**
```javascript
// In browser console
localStorage.setItem('homebreak_admin_mode', 'true')
// Then refresh the page
```

**Production (Supabase):**
1. Add user ID to `ADMIN_USER_IDS` array in `AuthContext.tsx`
2. Or query `is_admin` column from profiles table (recommended)

### Features

#### Stats Dashboard
- Total spot count
- Verified spots count
- Unverified spots count

#### Filtering
- Search by name, region, or spot ID
- Filter by verification status (All / Verified / Unverified)
- Filter by country group (USA / Mexico / Central America / Canada)

#### Spot Table
- Status badge (verified/unverified) - click to toggle
- Spot name
- Region
- Country group with flag
- Coordinates (lat, lon)
- Edit button

#### Edit Modal
- Edit name, latitude, longitude, region
- Change country group
- Toggle verified status
- Save changes

#### Add Spots
- Uses existing AddSpotModal
- Admin-added spots are **auto-verified**

### Navigation

Admin link appears in sidebar (yellow "Admin" section) only when `isAdmin` is true:
- Shield icon
- "Spot Management" label

---

## Spot Verification System

### Source Types

| Source | Description | Verified Default |
|--------|-------------|------------------|
| `official` | From gist database | Yes |
| `community` | User-submitted, admin-reviewed | After approval |
| `user` | User's private custom spot | No |

### Verification Flow

1. **Official spots** - Pre-verified from gist data
2. **User creates custom spot** → `source: 'user'`, `verified: false`
3. **User requests to share** → `source: 'community'`, enters moderation queue
4. **Admin reviews and approves** → `verified: true`
5. **Admin adds spot** → Auto-verified as `source: 'official'`

### UI Indicators

- Verified spots: Green checkmark badge
- Unverified spots: Yellow warning badge
- In AddSpotModal: CheckCircle icon for verified, MapPin for unverified

---

## Database Integration (TODO)

### Supabase Table: `surf_spots`

```sql
CREATE TABLE public.surf_spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lon NUMERIC NOT NULL,
  region TEXT,
  country_group TEXT CHECK (country_group IN ('USA', 'Mexico', 'Central America', 'Canada')),
  country TEXT,
  buoy_id TEXT,
  buoy_name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'user' CHECK (source IN ('official', 'community', 'user')),
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

-- Index for admin moderation queue
CREATE INDEX idx_surf_spots_moderation ON public.surf_spots(source, verified)
WHERE source = 'community' AND verified = FALSE;
```

### Admin Profile Flag

```sql
ALTER TABLE public.profiles
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
```

### Wiring Admin Page to Supabase

```typescript
// In AdminSpotsPage.tsx

// Fetch all spots
const { data: spots } = await supabase
  .from('surf_spots')
  .select('*')
  .order('name');

// Update spot
await supabase
  .from('surf_spots')
  .update({
    name: editingSpot.name,
    lat: parseFloat(editingSpot.lat),
    lon: parseFloat(editingSpot.lon),
    region: editingSpot.region,
    country_group: editingSpot.countryGroup,
    verified: editingSpot.verified,
    updated_at: new Date().toISOString(),
  })
  .eq('id', spotId);

// Toggle verified status
await supabase
  .from('surf_spots')
  .update({
    verified: !currentVerified,
    verified_at: !currentVerified ? new Date().toISOString() : null,
    verified_by: !currentVerified ? userId : null,
  })
  .eq('id', spotId);

// Admin add spot (auto-verified)
await supabase
  .from('surf_spots')
  .insert({
    ...spotData,
    verified: true,
    source: 'official',
    verified_at: new Date().toISOString(),
    verified_by: userId,
  });
```

### Check Admin Status

```typescript
// In AuthContext.tsx

// Fetch admin status from profiles
const { data } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single();

setIsAdmin(data?.is_admin ?? false);
```

---

## Regenerating Spot Data

To regenerate the surf spots data from the source gist:

```bash
cd frontend
node scripts/process-spots.cjs
```

This will:
1. Fetch spots from the gist
2. Filter to North/Central America
3. Transform to the target format
4. Generate `src/data/surfSpots.ts`

---

## Related Files

| File | Purpose |
|------|---------|
| `src/data/surfSpots.ts` | Surf spots database |
| `src/data/noaaBuoys.ts` | NOAA buoy data + recommendation logic |
| `src/pages/AdminSpotsPage.tsx` | Admin spot management page |
| `src/components/ui/AddSpotModal.tsx` | Add spot modal with region filter |
| `src/contexts/AuthContext.tsx` | Auth context with `isAdmin` flag |
| `src/components/dashboard/Sidebar.tsx` | Sidebar with admin nav link |
| `scripts/process-spots.cjs` | Data processing script |
