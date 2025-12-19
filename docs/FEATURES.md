# Features

This document describes all Wave-Wire features, including implemented functionality and planned additions.

---

## Surf Spots Database

### Overview

The app includes a pre-populated database of **1,225 surf spots** across North/Central America.

**Source:** Public gist processed into structured format

### Distribution

| Region | Count |
|--------|-------|
| USA | 936 |
| Mexico | 105 |
| Central America | 134 |
| Canada | 50 |

### Data Structure

```typescript
interface SurfSpot {
  id: string;              // Generated from name + coordinates
  name: string;
  lat: number;
  lon: number;
  region: string;          // Sub-region (e.g., "Texas Gulf Coast")
  countryGroup: CountryGroup;
  country: string;
  buoyId?: string;         // Recommended NOAA buoy
  buoyName?: string;
  verified: boolean;
  source: 'official' | 'community' | 'user';
}
```

### User Experience

- Browse spots by region with search-first UI
- Filter by country group (USA, Mexico, Central America, Canada)
- Add spots to personal list
- Create custom spots with lat/lon coordinates

---

## Smart Buoy Recommendations

The app uses **swell-aware buoy recommendations** instead of simple distance-based matching.

### Problem

The closest buoy isn't always the best. Example: Hanalei Bay (Kauai) is closest to Waimea Bay buoy, but locals know the NW Hawaii offshore buoy is better because it's in the path of incoming NW swells.

### Solution

Multi-factor scoring that considers:

1. **Exposure Inference** - Parses region/country for directional hints:
   - "Gulf Coast" → Gulf exposure (buoys to the south)
   - "Pacific", "West Coast" → Pacific exposure (buoys to the west)
   - "Atlantic", "East Coast" → Atlantic exposure (buoys to the east)
   - "Hawaii" + high latitude → North shore (prefer NW buoys)

2. **Bearing Calculation** - Calculates bearing from spot to each buoy

3. **Combined Scoring** - 60% swell-path match + 40% proximity

### Custom Spot Exposure Options

When users create custom spots:
- Pacific / West Coast
- Atlantic / East Coast
- Gulf Coast
- Hawaii - North Shore
- Hawaii - South Shore
- Caribbean
- Other / Unknown

---

## Admin Spot Management

**Route:** `/admin/spots`

### Features

- **Stats Dashboard** - Total, verified, unverified counts
- **Filtering** - By name, region, verification status, country group
- **Bulk Actions** - Toggle verification, edit details
- **Add Spots** - Admin-added spots are auto-verified

### Verification Flow

1. Official spots - Pre-verified from database
2. User creates custom spot → `source: 'user'`, unverified
3. User requests to share → `source: 'community'`, enters moderation queue
4. Admin reviews and approves → `verified: true`

### UI Indicators

- Verified: Green checkmark badge
- Unverified: Yellow warning badge

---

## Admin User Management

**Route:** `/admin/users`

### Features

- **Stats Dashboard** - Total users, admins, premium, free counts + MRR
- **MRR Display** - Monthly recurring revenue (Premium users × $5.00/mo)
- **Activity Metrics** - Total alerts sent across all users
- **User Table** - Email, tier, spots, triggers, alerts, last activity, join date
- **Search & Filter** - By email/ID, filter by tier
- **User Detail Modal** - Click row to see comprehensive user info
- **Edit Modal** - Change subscription tier and admin status

### User Detail Modal

Shows:
- **Contact Info** - Phone (with verification status), home address
- **Activity Metrics** - Spots count, triggers count, alerts sent, last active
- **Subscription** - Current tier, admin badge, account created/updated dates
- TODO: Subscription history (after payment integration)

### Stats Grid (5 columns)

| Total Users | Admins | Premium | Free | Total Alerts |
|-------------|--------|---------|------|--------------|
| count | count | count + MRR | count | aggregate |

### Database

Uses `admin_user_stats` view for efficient aggregation of user activity data.

---

## Triggers System

Triggers define when users want to be alerted about conditions.

### Trigger Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| Condition Level | Fair, Good, or Epic | `good` |
| Min Wave Height | Minimum wave size | 3 ft |
| Max Wave Height | Maximum wave size | 8 ft |
| Min Wave Period | Minimum period | 10 seconds |
| Swell Directions | Acceptable directions | N, NW, W |
| Wind Directions | Acceptable (offshore) | E, NE |
| Max Wind Speed | Upper limit | 12 mph |

### Condition Tiers

| Tier | Description | Message Tone |
|------|-------------|--------------|
| Fair | Rideable but nothing special | Measured, no pressure |
| Good | Worth the drive | Positive, encouraging |
| Epic | Drop everything and go | Maximum excitement |

### Status Determination

Status is determined by matching current conditions against user triggers:
- Check triggers in priority order (Epic → Good → Fair)
- First match determines status
- No match = "Poor"

---

## Alert Types & Scheduling

### Alert Types

| Type | Time | Purpose |
|------|------|---------|
| **Night Before Hype** | 8:00 PM | Checks tomorrow's forecast. Get hyped or sleep in. |
| **Morning Reality Check** | 6:00 AM | Live buoy validation + traffic check. |
| **Pop-Up Alert** | Every 2h | Catches sudden wind switches or pulses. |

### Anti-Spam Logic

- **Cooldown**: 6 hours between alerts of the same tier
- **Upgrade Only**: Alerts can fire if conditions upgrade (Good → Epic)
- **Quiet Hours**: Queue alerts during sleep, send when user wakes

### User Controls

- Enable/disable each alert type
- Set custom times for Night Before and Morning Check
- Configure quiet hours
- Set popup alert interval

---

## Personality & Messaging

### Personalities

| Personality | Emoji | Description |
|-------------|-------|-------------|
| Stoked Local | 🤙 | Hyped-up buddy energy, uses "dude", "firing", "clean" |
| Chill Surfer | 🌊 | Laid back, no pressure, presents facts |
| Data Nerd | 📊 | Pure data, pipe separators, minimal words |
| Hype Beast | 🔥 | Maximum energy, ALL CAPS, multiple exclamation marks |

### Message Options

- **Emoji** - Include emojis in messages
- **Buoy Data** - Include raw buoy readings and water temp
- **Traffic** - Include drive time and traffic conditions

### Example Messages

**Stoked Local - Epic:**
> 🤙🔥 DUDE! Surfside is FIRING - rare Texas glass! 4.2ft @ 12s from the SE, 8mph NW keeping it CLEAN. 45min, I-45's already packed but WHO CARES! Get there before the Houston crowd! 🏄‍♂️

**Chill Surfer - Good:**
> Surfside's looking fun. 4.2ft @ 12s SE, 8mph NW. About 45min. Could be a nice session.

**Data Nerd - Any:**
> SURFSIDE: 4.2ft @ 12s SE | Wind: 8mph NW | Buoy 42035: 3ft @ 15s (6am) | 72°F | ETA: 45min | Good

**Hype Beast - Epic:**
> 🚨🚨🚨 THIS IS NOT A DRILL!! SURFSIDE IS GOING OFF - BEST GULF SWELL THIS YEAR!! 4.2ft @ 12s SE!! 8mph NW = GLASS!! CALL IN SICK!! 🏄‍♂️🔥🔥🔥

---

## Dashboard

### Cross-Spot Overview

Monitor conditions across all configured spots at a glance:
- Spot cards with real-time conditions
- Status indicators (Epic/Good/Fair/Poor)
- Recent alerts across all spots
- Quick access to trigger settings

### Spot Card Display

```
┌─────────────────────────────────────┐
│ 🌊 Surfside Beach           [GOOD] │
├─────────────────────────────────────┤
│ SWL  4.2ft @ 12s SE                 │
│ WND  8 mph NW (offshore)            │
│ TDE  2.3ft ↑ (high @ 5:42 PM)       │
│ TMP  72°F water                     │
├─────────────────────────────────────┤
│ Buoy 42035: 3ft @ 15s - 15m ago     │
└─────────────────────────────────────┘
```

---

## Pricing Tiers

### Free (Limited) - $0/month

- 1 spot
- 1 trigger per spot
- 5 SMS alerts per month
- Email fallback after SMS limit

### Free (Beta) - $0/month

During beta, users can upgrade to Free (Beta) for full access:
- Unlimited spots
- Unlimited triggers
- Unlimited SMS alerts
- All alert types

### Premium - $5/month

Post-beta paid tier:
- Unlimited spots
- Unlimited triggers
- Unlimited SMS alerts
- All alert types
- Priority support

**TODO:** Payment integration (Stripe) for Premium tier billing

---

## Locals Knowledge (Planned)

Add "locals knowledge" to surf spots - admin-configurable parameters that define optimal conditions.

### Data Structure

```typescript
interface SpotConditionTier {
  minHeight: number;
  maxHeight: number;
  minPeriod: number;
  swellDirections: string[];
  offshoreWindDirections: string[];
  maxWindSpeed: number;
  optimalTideStates?: ('low' | 'mid' | 'high')[];
  optimalTideDirection?: 'rising' | 'falling' | 'slack';
}

interface SpotLocalsKnowledge {
  epic?: SpotConditionTier;
  good?: SpotConditionTier;
  epicSummary?: string;  // Auto-generated or manual
  goodSummary?: string;
  notes?: string;        // Additional local tips
  verified: boolean;
}
```

### Example Output

```
"Best on W-NW swell 4-8ft @ 12s+, light offshore (E-NE winds), mid-tide rising"
```

### Admin UI

- Two sections: Epic Conditions / Good Conditions
- Wave height sliders (min/max)
- Period slider
- Direction multi-select toggles
- Tide checkboxes
- Live summary preview

---

## Files Reference

### Core Data Files

| File | Purpose |
|------|---------|
| `src/data/surfSpots.ts` | 1,225 surf spots database |
| `src/data/noaaBuoys.ts` | NOAA buoy data + recommendation logic |

### Key Components

| Component | Purpose |
|-----------|---------|
| `SpotCard.tsx` | Display spot with live conditions |
| `TriggerForm.tsx` | Configure trigger parameters |
| `AddSpotModal.tsx` | Add spots from database |
| `DirectionSelector.tsx` | Multi-select compass directions |
| `UserDetailModal.tsx` | Admin user detail view |
| `UpgradeModal.tsx` | Subscription upgrade prompt |
| `AdminHeader.tsx` | Admin panel navigation |

### Pages

| Page | Route |
|------|-------|
| `DashboardOverview.tsx` | `/dashboard` |
| `SpotPage.tsx` | `/spots` |
| `TriggersPage.tsx` | `/triggers` |
| `AlertsPage.tsx` | `/alerts` |
| `AccountPage.tsx` | `/account` |
| `AdminSpotsPage.tsx` | `/admin/spots` |
| `UserManagementPage.tsx` | `/admin/users` |
| `InvestmentPage.tsx` | `/admin/investment` |
