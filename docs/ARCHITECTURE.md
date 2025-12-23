# System Architecture

This document describes the high-level architecture, data flow, and planned backend infrastructure for Wave-Wire.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────┐    ┌────────────────────┐    ┌─────────────────┐   │
│   │    NOAA NDBC       │    │    Open-Meteo      │    │   NOAA CO-OPS   │   │
│   │    Buoy API        │    │    Marine/Weather  │    │   Tide API      │   │
│   │  (Live readings)   │    │    (Forecasts)     │    │  (Predictions)  │   │
│   └─────────┬──────────┘    └─────────┬──────────┘    └────────┬────────┘   │
│             │                         │                        │            │
└─────────────┼─────────────────────────┼────────────────────────┼────────────┘
              │                         │                        │
              ▼                         ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────┐    ┌────────────────────┐                          │
│   │  fetch-buoy-data   │    │ fetch-forecast-data│                          │
│   │   (every 30 min)   │    │   (every 2 hours)  │                          │
│   └─────────┬──────────┘    └─────────┬──────────┘                          │
│             │                         │                                      │
│             └───────────┬─────────────┘                                      │
│                         ▼                                                    │
│              ┌────────────────────┐                                          │
│              │    check-alerts    │                                          │
│              │ (8PM / 6AM / 2hr)  │                                          │
│              └─────────┬──────────┘                                          │
│                        │                                                     │
│                        ▼                                                     │
│              ┌────────────────────┐                                          │
│              │process-alert-queue │                                          │
│              │   (every 1 min)    │                                          │
│              └─────────┬──────────┘                                          │
│                        │                                                     │
└────────────────────────┼─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│   │  buoy_readings  │  │  forecast_cache │  │   alert_queue   │             │
│   │  (NOAA cache)   │  │ (Open-Meteo)    │  │  (pending SMS)  │             │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│   ┌─────────────────┐  ┌─────────────────┐                                   │
│   │ condition_logs  │  │   sent_alerts   │                                   │
│   │ (dashboard)     │  │  (history)      │                                   │
│   └─────────────────┘  └─────────────────┘                                   │
│                                                                              │
└────────────────────────┬─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NOTIFICATION SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────┐   ┌────────────────────┐   ┌──────────────────┐    │
│   │     OneSignal      │   │      Resend        │   │     Twilio       │    │
│   │   (Web Push)       │   │     (Email)        │   │  (SMS - planned) │    │
│   └────────────────────┘   └────────────────────┘   └──────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Data Flow

```
React Components
       │
       ▼
┌─────────────────────┐
│    React Hooks      │
│  useBuoyData()      │
│  useForecastData()  │
│  useTideData()      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Service Layer     │
│  services/api/      │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌────────────┐
│ Vercel │  │ Open-Meteo │
│  Proxy │  │  (Direct)  │
│ /api/  │  │            │
└───┬────┘  └────────────┘
    │
    ▼
┌────────┐
│  NOAA  │
│  NDBC  │
└────────┘
```

**Why a proxy for NOAA?** NOAA's NDBC API doesn't support CORS, so we use a Vercel serverless function to proxy requests.

---

## Alert System Structure (GitHub Actions)

The alert system runs via GitHub Actions cron jobs instead of Supabase Edge Functions for reliability and cost efficiency.

```
scripts/
├── run-alerts.ts          # Main entry point (runs evaluation + processing)
├── lib/
│   ├── dataFetcher.ts     # Fetches buoy, forecast, tide, solar data
│   ├── evaluator.ts       # Evaluates triggers against current conditions
│   ├── messenger.ts       # Generates AI messages via Claude Haiku
│   ├── emailer.ts         # Sends emails via Resend API
│   └── pushNotifier.ts    # Sends push via OneSignal API
└── package.json           # Script dependencies

.github/workflows/
└── run-alerts.yml         # Cron job: every 2 hours (6 AM - 10 PM)
```

### Workflow

1. **GitHub Actions** triggers `run-alerts.ts` every 2 hours
2. **Evaluator** fetches all enabled triggers and their spot conditions
3. **DataFetcher** retrieves current buoy/forecast data for each spot
4. **Trigger matching** compares conditions against user thresholds
5. **Messenger** generates personalized alert text via Claude Haiku
6. **Delivery** sends via enabled channels (push, email, or both)
7. **Recording** logs sent alerts to `sent_alerts` and `trigger_matches` tables

---

## Cron Job Schedule (GitHub Actions)

The alert system uses GitHub Actions scheduled workflows:

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `run-alerts.yml` | Every 2 hours (6AM-10PM user time) | Evaluate triggers and send alerts |

### Surveillance Window

Alerts only run during each user's configured surveillance window:

- **Window Mode**: "all_day" or "custom"
- **Custom Window**: User-defined start/end times (e.g., 6 AM - 8 PM)
- **Active Days**: User selects which days to receive alerts
- **Timezone**: User's local timezone for window calculations

### Alert Deduplication

Each trigger can only fire once per day to prevent spam:
- `trigger_matches` table has unique index on `(trigger_id, DATE(matched_at))`
- Upgraded conditions (Fair → Good → Epic) can override previous alerts

---

## Caching Strategy

| Data Type | Cache Duration | Fetch Frequency | Rationale |
|-----------|---------------|-----------------|-----------|
| NOAA Buoy Data | 2 hours | Every 30 min | NOAA updates hourly; 30-min fetch ensures freshness |
| Open-Meteo Forecast | 2-4 hours | Every 2 hours | Forecasts update every few hours |
| Tide Predictions | 24 hours | Daily | Predictions don't change frequently |
| User Data | Real-time | On demand | Always fresh from Supabase |

### Frontend Cache Keys

```typescript
// Buoy data
`buoy:${stationId}`  // e.g., "buoy:42035"

// Forecast data (rounded coordinates)
`forecast:${lat.toFixed(2)}:${lon.toFixed(2)}`  // e.g., "forecast:28.94:-95.29"

// Tide data
`tide:${stationId}`  // e.g., "tide:8771450"
```

---

## Alert Processing Flow

```
┌─────────────────┐
│  Cron Trigger   │
│ (8PM/6AM/2hr)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           check-alerts Function              │
│                                              │
│  1. Get all users with enabled schedules    │
│  2. For each user's spots:                  │
│     - Fetch latest cached buoy/forecast     │
│     - Match conditions against triggers     │
│     - If match: insert into alert_queue     │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              alert_queue                     │
│  (status: 'pending')                        │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│       process-alert-queue Function           │
│          (runs every 1 minute)               │
│                                              │
│  1. Get pending alerts                       │
│  2. For each alert:                          │
│     - Check quiet hours → skip if active    │
│     - Check dedup (already sent today?)     │
│     - Check SMS quota (free tier limit)     │
│     - Generate AI message (Claude)          │
│     - Send via Twilio (SMS) or SendGrid     │
│     - Update alert_queue status             │
│     - Insert into sent_alerts               │
└─────────────────────────────────────────────┘
```

---

## Trigger Matching Algorithm

Status (epic/good/fair/poor) is determined by **user triggers**, not calculated from conditions:

```typescript
interface TriggerMatchResult {
  matched: boolean;
  triggerId: string | null;
  triggerName: string | null;
  condition: 'epic' | 'good' | 'fair' | 'poor';
}

function matchTriggers(
  conditions: CurrentConditions,
  triggers: UserTrigger[]
): TriggerMatchResult {
  // Sort triggers by priority (epic > good > fair)
  const sortedTriggers = triggers.sort((a, b) => {
    const priority = { epic: 3, good: 2, fair: 1 };
    return priority[b.condition] - priority[a.condition];
  });

  for (const trigger of sortedTriggers) {
    if (matchesTrigger(conditions, trigger)) {
      return {
        matched: true,
        triggerId: trigger.id,
        triggerName: trigger.name,
        condition: trigger.condition
      };
    }
  }

  return {
    matched: false,
    triggerId: null,
    triggerName: null,
    condition: 'poor'  // Default when no triggers match
  };
}

function matchesTrigger(conditions: CurrentConditions, trigger: UserTrigger): boolean {
  // Wave height check
  if (conditions.waveHeight < trigger.minHeight ||
      conditions.waveHeight > trigger.maxHeight) {
    return false;
  }

  // Wave period check
  if (conditions.wavePeriod < trigger.minPeriod) {
    return false;
  }

  // Swell direction check (if specified)
  if (trigger.swellDirections.length > 0 &&
      !trigger.swellDirections.includes(conditions.swellDirection)) {
    return false;
  }

  // Wind direction check (if specified)
  if (trigger.windDirections.length > 0 &&
      !trigger.windDirections.includes(conditions.windDirection)) {
    return false;
  }

  // Wind speed check
  if (trigger.maxWindSpeed && conditions.windSpeed > trigger.maxWindSpeed) {
    return false;
  }

  return true;
}
```

---

## Unit Conversions

Open-Meteo and NOAA return different units. Convert for US users:

```typescript
// Meters to feet
const metersToFeet = (m: number) => m * 3.28084;

// Kilometers per hour to miles per hour
const kmhToMph = (kmh: number) => kmh * 0.621371;

// Meters per second to knots
const msToKnots = (ms: number) => ms * 1.94384;

// Celsius to Fahrenheit
const celsiusToFahrenheit = (c: number) => (c * 9/5) + 32;

// Degrees to cardinal direction
const degreesToCardinal = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};
```
