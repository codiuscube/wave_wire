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
│   ┌────────────────────┐              ┌────────────────────┐                 │
│   │      Twilio        │              │     SendGrid       │                 │
│   │      (SMS)         │              │     (Email)        │                 │
│   └────────────────────┘              └────────────────────┘                 │
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

## Edge Function Structure (Planned)

```
supabase/functions/
├── fetch-buoy-data/
│   └── index.ts           # Fetches NOAA data for all unique buoy IDs
├── fetch-forecast-data/
│   └── index.ts           # Fetches Open-Meteo data for all spot locations
├── check-alerts/
│   └── index.ts           # Evaluates conditions against triggers, queues alerts
├── process-alert-queue/
│   └── index.ts           # Sends SMS/email, updates sent_alerts
└── shared/
    ├── noaa-client.ts     # NOAA API client
    ├── openmeteo-client.ts # Open-Meteo API client
    ├── trigger-matcher.ts # Logic to match conditions to user triggers
    └── direction-utils.ts # Convert degrees to cardinal directions
```

---

## Cron Job Schedule (Planned)

Using Supabase's pg_cron extension:

| Job Name | Schedule | Purpose |
|----------|----------|---------|
| `fetch-buoy-data` | Every 30 min | Fetch NOAA buoy data for all unique buoy IDs |
| `fetch-forecast-data` | Every 2 hours | Fetch Open-Meteo forecasts for all spot locations |
| `night-before-check` | 8:00 PM daily | Check tomorrow's forecast, queue matching alerts |
| `morning-reality-check` | 6:00 AM daily | Validate live buoy data, queue matching alerts |
| `popup-check` | Every 2 hours (6AM-8PM) | Detect sudden condition changes |
| `process-alert-queue` | Every 1 min | Send queued alerts via SMS/email |
| `cleanup-old-data` | 3:00 AM daily | Remove stale cache entries |

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
