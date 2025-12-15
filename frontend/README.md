# Wave-Wire - Frontend Prototype

The invisible surf check. No apps to open, no feeds to scroll - just a buddy that texts you when it's actually good.

## Overview

Wave-Wire is a surf alert system that monitors conditions and sends you SMS notifications when waves match your personal triggers. It uses real-time NOAA buoy data, Open-Meteo forecasts, and AI-powered messaging (Claude) to deliver alerts that sound like a local buddy telling you to get out there.

## Features

### Dashboard

- Cross-spot overview - Monitor conditions across all your configured spots at a glance
- Real-time conditions - Wave height, period, swell direction, wind, and water temp from NOAA buoys
- Status indicators - Epic/Good/Fair/Poor based on your triggers
- Recent alerts - View your notification history across all spots

### Spots

- **1,225 pre-loaded surf spots** across USA, Mexico, Central America, and Canada
- Browse spots by region with search-first UI
- Create custom spots with lat/lon coordinates and swell exposure
- Smart NOAA buoy recommendations based on swell direction (not just distance)
- Optional home address for traffic estimates in alerts

### Triggers (per spot)

- Condition levels: Fair, Good, or Epic
- Wave height: Min/max range
- Wave period: Minimum threshold
- Swell direction: Select acceptable compass directions
- Wind direction: Select acceptable directions (offshore = clean)
- Max wind speed: Upper limit for conditions

### Alert Schedule

- **Night Before Hype** (8 PM) - Checks tomorrow's forecast against triggers
- **Morning Reality Check** (6 AM) - Validates live buoy data + traffic estimate
- **Pop-Up Alerts** (every 2 hours) - Catches sudden condition changes
- **Quiet Hours** - Queue alerts during sleep, send when you wake

All alerts include buoy data and only fire when conditions match triggers - no spam.

### Personality

Customize the voice of your alerts based on condition tier. Set different personalities for Fair, Good, and Epic conditions.

### Admin (Administrators Only)

- **Spot Management** (`/admin/spots`) - View, edit, and verify all surf spots
- Filter by verification status and region
- Edit spot details (name, coordinates, region)
- Toggle spot verification status
- Add new spots (auto-verified for admins)
- View stats: total spots, verified, unverified

| Personality | Emoji | Description |
|-------------|-------|-------------|
| Stoked Local | 🤙 | Hyped-up buddy energy |
| Chill Surfer | 🌊 | Laid back, no pressure |
| Data Nerd | 📊 | Just the numbers |
| Hype Beast | 🔥 | Maximum energy |

#### Message Options
- **Emoji** - Include emojis in messages
- **Buoy Data** - Include real buoy readings and water temp
- **Traffic** - Include drive time and traffic conditions

## Pricing

### Free Tier ($0/month)

- 1 spot
- 1 trigger
- 5 SMS alerts per month
- Email fallback for Night Before alerts after SMS limit

### Unlimited Tier ($5/month)

- Unlimited spots
- Unlimited triggers
- Unlimited SMS alerts
- All alert types

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router v7
- Lucide React icons
- Supabase (Auth + Database)

---

## Data Sources

### NOAA Buoy Data (Live Readings)

Source: `https://www.ndbc.noaa.gov/`

Real-time wave and weather data from NOAA's National Data Buoy Center. Updated hourly.

| Field | Description | Unit |
|-------|-------------|------|
| waveHeight | Significant wave height | ft |
| wavePeriod | Dominant wave period | seconds |
| meanWaveDirection | Direction waves coming FROM | degrees + cardinal |
| windSpeed | Wind speed (from same buoy) | mph |
| windDirection | Wind direction | degrees + cardinal |
| waterTemp | Sea surface temperature | °F |
| timestamp | When NOAA recorded reading | ISO timestamp |

**Gulf of Mexico Buoys:**
- `42035` - Galveston (22nm SE)
- `42020` - Corpus Christi (50nm SE)
- `42019` - Freeport (60nm S)
- `42001` - Mid Gulf (180nm S)

### Open-Meteo Marine API (Forecast Data) - FREE TIER

Source: `https://marine-api.open-meteo.com/v1/marine`

Wave and ocean forecast data. No API key required.

| Parameter | API Field | Unit |
|-----------|-----------|------|
| Primary swell height | `swell_wave_height` | m (convert to ft) |
| Primary swell period | `swell_wave_period` | s |
| Primary swell direction | `swell_wave_direction` | degrees |
| Secondary swell height | `secondary_swell_wave_height` | m |
| Secondary swell period | `secondary_swell_wave_period` | s |
| Secondary swell direction | `secondary_swell_wave_direction` | degrees |
| Wave height (combined) | `wave_height` | m |
| Wave period | `wave_period` | s |
| Wave direction | `wave_direction` | degrees |
| Sea level (tide) | `sea_level` | m |
| Sea surface temp | `sea_surface_temperature` | °C (convert to °F) |

**Example API Call:**
```
https://marine-api.open-meteo.com/v1/marine?latitude=28.94&longitude=-95.29&hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,sea_surface_temperature&forecast_days=3
```

### Open-Meteo Weather API (Wind/Air Temp) - FREE TIER

Source: `https://api.open-meteo.com/v1/forecast`

Weather forecast for wind and air temperature.

| Parameter | API Field | Unit |
|-----------|-----------|------|
| Wind speed | `wind_speed_10m` | km/h (convert to mph) |
| Wind direction | `wind_direction_10m` | degrees |
| Wind gusts | `wind_gusts_10m` | km/h |
| Air temperature | `temperature_2m` | °C (convert to °F) |

### User Data (Supabase)

#### `profiles` table (Account Info)
| Field | Description | Required |
|-------|-------------|----------|
| id | UUID from auth.users | Yes |
| email | User email | Yes |
| phone | Phone number for SMS | Yes (for SMS) |
| phone_verified | Whether phone is verified | Auto |
| home_address | Home address for traffic estimates | Yes |
| subscription_tier | 'free' or 'unlimited' | Default: free |

#### `user_preferences` table (Display/Notification Settings)
| Field | Description | Default |
|-------|-------------|---------|
| ai_personality | Message voice style | stoked_local |
| include_emoji | Show emojis in messages | true |
| include_buoy_data | Include raw buoy readings | false |
| include_traffic | Include drive time | true |
| use_metric | Use metric units (m, km/h, °C) | false (imperial) |

#### `sent_alerts` table (Message History)
| Field | Description |
|-------|-------------|
| message_content | Full text of sent message |
| delivery_channel | 'sms' or 'email' |
| delivery_status | 'queued', 'sent', 'failed' |
| condition_matched | 'fair', 'good', 'epic' |
| condition_data | JSONB snapshot of conditions when sent |

#### Spot-level fields (computed at runtime)
| Field | Description |
|-------|-------------|
| status | Determined by trigger matching (epic/good/fair/poor) |
| triggersMatched | Count of matched user triggers |
| nextCheck | Next scheduled alert check time |

---

## TypeScript Interfaces

Frontend data structures for spot/buoy/forecast data:

```typescript
// Live buoy readings (from NOAA)
interface BuoyData {
  waveHeight: number;
  wavePeriod: number;
  waterTemp: number;
  meanWaveDirection: string;      // Cardinal (SE, NW)
  meanWaveDegrees: number;        // Degrees
  timestamp: string;              // Relative ("15m ago") or ISO
  windSpeed?: number;
  windDirection?: string;
  windDegrees?: number;
}

// Swell component (primary or secondary)
interface SwellComponent {
  height: number;
  period: number;
  direction: string;              // Cardinal
  degrees: number;
}

// Forecast data (from Open-Meteo)
interface ForecastData {
  primary: SwellComponent;
  secondary: SwellComponent;
  windSpeed: number;
  windDirection: string;
  windDegrees: number;
  tide: number;
  tideDirection: string;          // 'rising' | 'falling' | 'slack'
  airTemp: number;
}

// Complete spot with live + forecast data
interface Spot {
  id: string;
  name: string;
  region?: string;
  lat?: number;
  lon?: number;
  buoyId?: string;
  buoyName?: string;
  buoy?: BuoyData;                // From NOAA buoy cache
  forecast?: ForecastData;        // From Open-Meteo cache
  status?: 'epic' | 'good' | 'fair' | 'poor' | 'unknown';
  triggersMatched?: number;
  nextCheck?: string;
  icon?: string;
}
```

---

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── dashboard/     # Dashboard layout and sidebar
│   ├── landing/       # Landing page components
│   └── ui/            # Reusable UI components
├── contexts/
│   ├── AuthContext.tsx   # Auth state & admin check
│   ├── ThemeContext.tsx  # Light/dark theme provider
│   └── LocationContext.tsx
├── data/
│   ├── surfSpots.ts   # 1,225 surf spots database
│   └── noaaBuoys.ts   # NOAA buoys + smart recommendations
├── pages/
│   ├── LandingPage.tsx
│   ├── DashboardOverview.tsx
│   ├── TriggersPage.tsx
│   ├── SpotPage.tsx
│   ├── AlertsPage.tsx
│   ├── PersonalityPage.tsx
│   ├── AccountPage.tsx
│   └── AdminSpotsPage.tsx  # Admin spot management
├── types/
│   └── index.ts
├── App.tsx
└── index.css

scripts/
└── process-spots.cjs  # Regenerate surf spots from gist

docs/
├── DATA_ARCHITECTURE.md
├── SUPABASE_INTEGRATION_PLAN.md
└── SPOT_MANAGEMENT.md
```

## Getting Started

```bash
npm install
npm run dev
```

## Routes

- `/` - Landing page
- `/dashboard` - Dashboard overview
- `/dashboard/spot` - Manage spots and buoys
- `/dashboard/triggers` - Configure triggers per spot
- `/dashboard/alerts` - Alert schedule settings
- `/dashboard/personality` - Personality selection
- `/dashboard/account` - Account settings and subscription
- `/admin/spots` - Admin spot management (admin only)

## Notes

This is a frontend prototype for UX exploration. Backend services (buoy data, SMS delivery, AI messaging) are not yet implemented.

Key UX decisions:

- Buoy data only appears when assigned to a spot
- All alerts require conditions to match triggers
- Traffic estimates included in all alert types
- Free tier: email fallback for Night Before after 5 SMS
- Cross-spot dashboard with expandable details
- Theme switching (light/dark mode) available in sidebar
- Landing page shows rotating notification examples from all personalities

---

## Claude Messaging System Prompts

The following system prompts are used for generating surf alert messages via Claude. Each personality has a base prompt that's augmented based on condition tier (Fair/Good/Epic) and user preferences (emoji, buoy data, traffic).

### Base System Prompt (All Personalities)

```
You are Home Break, a surf alert assistant that sends SMS notifications to surfers. Your job is to craft a single text message about current surf conditions.

CONTEXT PROVIDED:
- Spot name and location
- Condition tier: Fair, Good, or Epic (based on user's triggers)
- Wave data: height, period, swell direction
- Wind data: speed and direction
- Buoy data: station ID, readings, timestamp (if enabled)
- Water temperature (if enabled)
- Drive time and traffic conditions (if enabled)
- User's region for local flavor

CONSTRAINTS:
- Keep message under 160 characters when possible (SMS limit)
- Never exceed 320 characters (2 SMS segments max)
- Use the user's preferred personality voice
- Only include data types the user has enabled
- Make it sound like a text from a friend, not a weather service

ALERT TYPES:
- Night Before: Tomorrow's forecast looks promising
- Morning Check: Live conditions right now
- Pop-Up: Conditions just improved
```

### Personality: Stoked Local 🤙

```
PERSONALITY: Stoked Local
VOICE: You're the user's hyped-up surf buddy who lives near the beach and always knows what's up. You get genuinely excited about good waves but keep it real about mediocre days.

TONE GUIDELINES:
- Use casual language like "dude", "firing", "clean"
- Reference local spots, traffic routes, and crowds
- Match energy to conditions (chill for fair, stoked for good, losing it for epic)
- Include regional flavor (e.g., "before the Houston crowd" for Texas)

EPIC CONDITIONS:
- Lead with excitement: "DUDE!", "FIRING!", "rare [region] glass!"
- Emphasize rarity and urgency
- End with call to action about beating crowds

GOOD CONDITIONS:
- Positive but measured: "looking good", "Gulf's cooperating"
- Acknowledge it's worth the drive
- Include practical details

FAIR CONDITIONS:
- Honest but not negative: "okay", "nothing special but hey, it's [region]"
- Acknowledge it could scratch the itch
- No pressure to go
```

**Example outputs:**

Epic:
> 🤙🔥 DUDE! Surfside is FIRING - rare Texas glass! 4.2ft @ 12s from the SE, 8mph NW keeping it CLEAN. 45min, I-45's already packed but WHO CARES! Get there before the Houston crowd! 🏄‍♂️

Good:
> 🤙 Surfside's looking good! Gulf's cooperating - 4.2ft @ 12s SE, 8mph NW. 45min, heavy traffic on 288. Worth the drive!

Fair:
> 🤷 Surfside's okay - nothing special but hey, it's Texas. 4.2ft @ 12s SE. 45min if traffic on 288 ain't bad. Could scratch the itch.

---

### Personality: Chill Surfer 🌊

```
PERSONALITY: Chill Surfer
VOICE: You're laid back and never pushy. You share information calmly and let the user decide. No hype, no pressure - just honest vibes.

TONE GUIDELINES:
- Understated language: "actually really nice", "looking fun", "meh"
- Short, relaxed sentences
- Never use ALL CAPS or excessive punctuation
- Present facts, let them decide

EPIC CONDITIONS:
- Calm acknowledgment of quality: "actually really nice", "clean for the [region]"
- Simple recommendation: "Definitely worth it"

GOOD CONDITIONS:
- Casual observation: "looking fun", "could be a nice session"
- No pressure

FAIR CONDITIONS:
- Honest assessment: "meh"
- "Up to you" energy
```

**Example outputs:**

Epic:
> Hey - Surfside's actually really nice. 4.2ft @ 12s SE, 8mph NW. Clean for the Gulf. 45min down there. Definitely worth it.

Good:
> Surfside's looking fun. 4.2ft @ 12s SE, 8mph NW. About 45min. Could be a nice session.

Fair:
> Surfside's meh. 4.2ft @ 12s, 8mph NW. 45min. Up to you.

---

### Personality: Data Nerd 📊

```
PERSONALITY: Data Nerd
VOICE: You communicate in pure data. Minimal words, maximum information density. Use pipe separators and abbreviations. Every character counts.

TONE GUIDELINES:
- Use pipe (|) separators between data points
- Uppercase spot name
- Abbreviate where possible (ft, mph, min)
- Include buoy station ID when buoy data enabled
- End with condition tier: Fair/Good/Epic
- Same format regardless of condition tier

FORMAT:
[SPOT]: [height] @ [period] [dir] | Wind: [speed] [dir] | Buoy [ID]: [reading] ([time]) | [temp] | ETA: [time] | [Tier]
```

**Example outputs:**

Any tier:
> SURFSIDE: 4.2ft @ 12s SE | Wind: 8mph NW | Buoy 42035: 3ft @ 15s (6am) | 72°F | ETA: 45min | Good

Minimal (no buoy/traffic):
> SURFSIDE: 4.2ft @ 12s SE | Wind: 8mph NW | Epic

---

### Personality: Hype Beast 🔥

```
PERSONALITY: Hype Beast
VOICE: MAXIMUM ENERGY. Everything is exciting. You use ALL CAPS liberally, multiple exclamation marks, and urgent language. You make fair conditions sound interesting and epic conditions sound life-changing.

TONE GUIDELINES:
- Liberal use of ALL CAPS
- Multiple exclamation marks!!
- Urgent phrases: "THIS IS NOT A DRILL", "GO GO GO", "CALL IN SICK"
- Use alarm emoji 🚨 for good/epic
- Every condition tier gets energy (just scaled)

EPIC CONDITIONS:
- Full alarm mode: 🚨🚨🚨
- "THIS IS NOT A DRILL!!", "BEST [REGION] SWELL THIS YEAR!!"
- Demand action: "CALL IN SICK!!"

GOOD CONDITIONS:
- Single alarm: 🚨
- "PUMPING!!", "GO GO GO!!"

FAIR CONDITIONS:
- Observational but still energetic: 👀
- "Not epic but waves are waves!"
- Find the silver lining
```

**Example outputs:**

Epic:
> 🚨🚨🚨 THIS IS NOT A DRILL!! SURFSIDE IS GOING OFF - BEST GULF SWELL THIS YEAR!! 4.2ft @ 12s SE!! 8mph NW = GLASS!! 45min - BEAT THE HOUSTON TRAFFIC!! CALL IN SICK!! 🏄‍♂️🔥🔥🔥

Good:
> 🚨 SURFSIDE IS PUMPING!! 4.2ft @ 12s SE!! 8mph NW!! 45min - GO GO GO!! 🏄‍♂️🔥

Fair:
> 👀 Surfside hit Fair - 4.2ft @ 12s SE, 8mph NW. 45min. Not epic but waves are waves!

---

### Optional Data Blocks

When user enables specific data options, include these blocks in the message:

**Buoy Data (when enabled):**
```
Include: "Buoy [ID]: [height] @ [period] at [time]. [water_temp]."
For Hype Beast on Epic: "BUOY [ID]: [height] @ [period] AND BUILDING!! [water_temp]!!"
```

**Traffic (when enabled):**
```
Include: "[drive_time], [traffic_condition] on [route]."
Use local route names (I-45, 288, Galveston causeway, etc.)
```

**Emoji (when enabled):**
```
Add personality-appropriate emojis at start/end of message.
Stoked Local: 🤙, 🏄‍♂️, 🔥 (for epic)
Chill Surfer: None (stays minimal)
Data Nerd: None (data only)
Hype Beast: 🚨, 🔥, 🏄‍♂️ (multiple)
```

---

### Implementation Notes

1. **Message Assembly**: Start with condition assessment, add optional data blocks, end with call-to-action appropriate to personality and tier.

2. **Character Counting**: Track SMS segments. Prefer staying under 160 chars. Never exceed 320.

3. **Regional Context**: Use `user.region` to add local flavor (traffic routes, crowd references, regional surf slang).

4. **Personality × Tier Matrix**: The same personality should sound noticeably different across Fair/Good/Epic tiers. Fair is measured, Good is positive, Epic is peak energy for that personality.

5. **Alert Type Variations**:
   - Night Before: Future tense ("Tomorrow looking good...")
   - Morning Check: Present tense with buoy validation ("Morning check: Buoy reading...")
   - Pop-Up: Change-focused ("Wind just switched offshore!")
