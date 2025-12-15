# Data Architecture

This document describes the data processing architecture for ITSPUMPING.AI, including database schemas for caching API data, worker/cron job schedules, and the alert processing pipeline.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────┐              ┌────────────────────┐                │
│   │    NOAA NDBC       │              │    Open-Meteo      │                │
│   │    Buoy API        │              │    Marine + Weather│                │
│   │  (Live readings)   │              │    (Forecasts)     │                │
│   └─────────┬──────────┘              └─────────┬──────────┘                │
│             │                                   │                            │
└─────────────┼───────────────────────────────────┼────────────────────────────┘
              │                                   │
              ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────┐              ┌────────────────────┐                │
│   │  fetch-buoy-data   │              │ fetch-forecast-data│                │
│   │   (every 30 min)   │              │   (every 2 hours)  │                │
│   └─────────┬──────────┘              └─────────┬──────────┘                │
│             │                                   │                            │
│             └───────────────┬───────────────────┘                            │
│                             ▼                                                │
│                  ┌────────────────────┐                                      │
│                  │    check-alerts    │                                      │
│                  │ (8PM / 6AM / 2hr)  │                                      │
│                  └─────────┬──────────┘                                      │
│                            │                                                 │
│                            ▼                                                 │
│                  ┌────────────────────┐                                      │
│                  │process-alert-queue │                                      │
│                  │   (every 1 min)    │                                      │
│                  └─────────┬──────────┘                                      │
│                            │                                                 │
└────────────────────────────┼─────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│   │  buoy_readings  │  │  forecast_cache │  │   alert_queue   │            │
│   │  (NOAA cache)   │  │ (Open-Meteo)    │  │  (pending SMS)  │            │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                              │
│   ┌─────────────────┐  ┌─────────────────┐                                  │
│   │ condition_logs  │  │   sent_alerts   │                                  │
│   │ (dashboard)     │  │  (history)      │                                  │
│   └─────────────────┘  └─────────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NOTIFICATION SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────┐              ┌────────────────────┐                │
│   │      Twilio        │              │     SendGrid       │                │
│   │      (SMS)         │              │     (Email)        │                │
│   └────────────────────┘              └────────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Future Implementation)

### 1. `buoy_readings` - Cache NOAA Buoy Data

Stores live readings from NOAA buoys. Fetched every 30 minutes.

```sql
CREATE TABLE public.buoy_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buoy_id TEXT NOT NULL,                    -- e.g., '42035', '42020'
  reading_timestamp TIMESTAMPTZ NOT NULL,   -- When NOAA recorded the measurement
  fetched_at TIMESTAMPTZ DEFAULT NOW(),     -- When we fetched this data

  -- Wave data
  wave_height NUMERIC,                      -- Significant wave height (ft)
  wave_period NUMERIC,                      -- Dominant wave period (seconds)
  mean_wave_direction NUMERIC,              -- Direction waves coming FROM (degrees)
  mean_wave_direction_text TEXT,            -- Cardinal direction (SE, NW, etc.)

  -- Wind data (from same NOAA buoy)
  wind_speed NUMERIC,                       -- Wind speed (mph)
  wind_direction NUMERIC,                   -- Direction wind coming FROM (degrees)
  wind_direction_text TEXT,                 -- Cardinal direction
  wind_gust NUMERIC,                        -- Wind gust speed (mph)

  -- Temperature
  water_temp NUMERIC,                       -- Water temperature (°F)
  air_temp NUMERIC,                         -- Air temperature (°F)

  -- Metadata
  is_stale BOOLEAN DEFAULT FALSE,           -- True if data is >2 hours old
  raw_data JSONB,                           -- Store raw NOAA response for debugging

  UNIQUE(buoy_id, reading_timestamp)
);

-- Indexes
CREATE INDEX idx_buoy_readings_buoy_id ON public.buoy_readings(buoy_id);
CREATE INDEX idx_buoy_readings_timestamp ON public.buoy_readings(reading_timestamp DESC);
CREATE INDEX idx_buoy_readings_fetched ON public.buoy_readings(fetched_at DESC);
```

### 2. `forecast_cache` - Cache Open-Meteo Forecast Data

Stores wave/wind/tide forecasts from Open-Meteo. Fetched every 2 hours.

```sql
CREATE TABLE public.forecast_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_key TEXT NOT NULL,               -- Format: "lat,lon" e.g., "28.944,-95.291"
  forecast_timestamp TIMESTAMPTZ NOT NULL,  -- The forecast valid time
  fetched_at TIMESTAMPTZ DEFAULT NOW(),     -- When we fetched this data

  -- Primary Swell
  primary_wave_height NUMERIC,              -- Significant wave height (ft)
  primary_wave_period NUMERIC,              -- Peak period (seconds)
  primary_wave_direction NUMERIC,           -- Direction (degrees)
  primary_wave_direction_text TEXT,         -- Cardinal direction

  -- Secondary Swell (if available)
  secondary_wave_height NUMERIC,
  secondary_wave_period NUMERIC,
  secondary_wave_direction NUMERIC,
  secondary_wave_direction_text TEXT,

  -- Wind forecast
  wind_speed NUMERIC,                       -- Wind speed (mph)
  wind_direction NUMERIC,
  wind_direction_text TEXT,
  wind_gust NUMERIC,

  -- Tide data
  tide_height NUMERIC,                      -- Tide level (ft)
  tide_direction TEXT,                      -- 'rising', 'falling', 'slack'

  -- Temperature
  air_temp NUMERIC,
  sea_surface_temp NUMERIC,

  -- Metadata
  raw_data JSONB,                           -- Store raw Open-Meteo response

  UNIQUE(location_key, forecast_timestamp)
);

-- Indexes
CREATE INDEX idx_forecast_location ON public.forecast_cache(location_key);
CREATE INDEX idx_forecast_timestamp ON public.forecast_cache(forecast_timestamp);
CREATE INDEX idx_forecast_fetched ON public.forecast_cache(fetched_at DESC);
```

### 3. `alert_queue` - Async Alert Processing

Queue for pending alerts. Processed every minute.

```sql
CREATE TABLE public.alert_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES public.user_spots(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES public.triggers(id) ON DELETE SET NULL,

  alert_type TEXT NOT NULL CHECK (alert_type IN ('forecast', 'realtime', 'popup')),
  check_type TEXT NOT NULL CHECK (check_type IN ('scheduled', 'popup_change')),

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'skipped', 'failed')),

  -- Condition data at time of queue
  matched_condition TEXT CHECK (matched_condition IN ('fair', 'good', 'epic')),
  condition_snapshot JSONB,                 -- Buoy + forecast data when queued

  -- Processing metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  skip_reason TEXT,                         -- Why it was skipped (quiet hours, already sent, etc.)
  error_message TEXT,

  -- Deduplication
  dedup_key TEXT                            -- Prevents duplicate alerts same day
);

-- Indexes
CREATE INDEX idx_alert_queue_status ON public.alert_queue(status);
CREATE INDEX idx_alert_queue_user ON public.alert_queue(user_id);
CREATE INDEX idx_alert_queue_created ON public.alert_queue(created_at DESC);
```

### 4. `condition_logs` - Dashboard Display History

Stores condition snapshots for dashboard display.

```sql
CREATE TABLE public.condition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id UUID NOT NULL REFERENCES public.user_spots(id) ON DELETE CASCADE,
  buoy_id TEXT,

  -- Timestamp
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  data_timestamp TIMESTAMPTZ,               -- When the underlying data was recorded

  -- Combined snapshot for display
  buoy_data JSONB,                          -- Current buoy reading
  forecast_data JSONB,                      -- Current forecast

  -- Status (determined by trigger matching)
  status TEXT CHECK (status IN ('epic', 'good', 'fair', 'poor', 'unknown')),
  matched_trigger_id UUID REFERENCES public.triggers(id) ON DELETE SET NULL,
  matched_trigger_name TEXT,

  -- For time-series tracking
  check_type TEXT CHECK (check_type IN ('scheduled', 'popup'))
);

-- Indexes
CREATE INDEX idx_condition_logs_spot ON public.condition_logs(spot_id);
CREATE INDEX idx_condition_logs_timestamp ON public.condition_logs(logged_at DESC);
```

### 5. Updates to Existing Tables

#### Add `use_metric` to `user_preferences`

```sql
ALTER TABLE public.user_preferences
ADD COLUMN use_metric BOOLEAN DEFAULT FALSE;
```

#### Add `condition_data` to `sent_alerts`

```sql
ALTER TABLE public.sent_alerts
ADD COLUMN condition_data JSONB,
ADD COLUMN buoy_reading_id UUID REFERENCES public.buoy_readings(id),
ADD COLUMN forecast_id UUID REFERENCES public.forecast_cache(id);
```

---

## Worker/Cron Schedule

Using Supabase's pg_cron extension with Edge Functions:

| Job Name | Schedule | Purpose |
|----------|----------|---------|
| `fetch-buoy-data` | Every 30 min | Fetch NOAA buoy data for all unique buoy IDs |
| `fetch-forecast-data` | Every 2 hours | Fetch Open-Meteo forecasts for all spot locations |
| `night-before-check` | 8:00 PM daily | Check tomorrow's forecast, queue matching alerts |
| `morning-reality-check` | 6:00 AM daily | Validate live buoy data, queue matching alerts |
| `popup-check` | Every 2 hours (6AM-8PM) | Detect sudden condition changes |
| `process-alert-queue` | Every 1 min | Send queued alerts via SMS/email |
| `cleanup-old-data` | 3:00 AM daily | Remove stale cache entries |

### pg_cron Setup

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fetch buoy data every 30 minutes
SELECT cron.schedule(
  'fetch-buoy-data',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/fetch-buoy-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('triggered_by', 'cron')
  );
  $$
);

-- Fetch forecast data every 2 hours
SELECT cron.schedule(
  'fetch-forecast-data',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/fetch-forecast-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('triggered_by', 'cron')
  );
  $$
);

-- Night Before Hype - 8 PM daily
SELECT cron.schedule(
  'night-before-check',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('check_type', 'forecast')
  );
  $$
);

-- Morning Reality Check - 6 AM daily
SELECT cron.schedule(
  'morning-reality-check',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('check_type', 'realtime')
  );
  $$
);

-- Pop-Up Check - Every 2 hours from 6 AM to 8 PM
SELECT cron.schedule(
  'popup-check',
  '0 6,8,10,12,14,16,18,20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('check_type', 'popup')
  );
  $$
);

-- Process alert queue every minute
SELECT cron.schedule(
  'process-alert-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-alert-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('triggered_by', 'cron')
  );
  $$
);

-- Cleanup old data daily at 3 AM
SELECT cron.schedule(
  'cleanup-old-data',
  '0 3 * * *',
  $$
  -- Delete buoy readings older than 7 days
  DELETE FROM public.buoy_readings WHERE fetched_at < NOW() - INTERVAL '7 days';
  -- Delete forecast cache older than 3 days
  DELETE FROM public.forecast_cache WHERE fetched_at < NOW() - INTERVAL '3 days';
  -- Delete processed queue items older than 30 days
  DELETE FROM public.alert_queue WHERE created_at < NOW() - INTERVAL '30 days';
  -- Delete condition logs older than 90 days
  DELETE FROM public.condition_logs WHERE logged_at < NOW() - INTERVAL '90 days';
  $$
);
```

---

## Edge Function Structure

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

## Data Caching Strategy

### What to Cache vs Fetch Fresh

| Data Type | Cache Duration | Fetch Frequency | Rationale |
|-----------|---------------|-----------------|-----------|
| NOAA Buoy Data | 2 hours | Every 30 min | NOAA updates hourly; 30-min fetch ensures freshness |
| Open-Meteo Forecast | 2-4 hours | Every 2 hours | Forecasts update every few hours; minimize API calls |
| User Data | Real-time | On demand | Always fresh from Supabase |
| Trigger Definitions | Real-time | On demand | User can change anytime |

### Stale Data Detection

```sql
-- Function to check if buoy data is stale
CREATE OR REPLACE FUNCTION is_buoy_data_stale(p_buoy_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  latest_fetch TIMESTAMPTZ;
BEGIN
  SELECT fetched_at INTO latest_fetch
  FROM public.buoy_readings
  WHERE buoy_id = p_buoy_id
  ORDER BY fetched_at DESC
  LIMIT 1;

  -- Consider stale if no data or older than 2 hours
  RETURN latest_fetch IS NULL OR latest_fetch < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;
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
  if (conditions.waveHeight < trigger.minHeight || conditions.waveHeight > trigger.maxHeight) {
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

## Unit Conversion

Open-Meteo returns metric units. Convert for US users (when `use_metric = false`):

```typescript
// Meters to feet
const metersToFeet = (m: number) => m * 3.28084;

// Kilometers per hour to miles per hour
const kmhToMph = (kmh: number) => kmh * 0.621371;

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

---

## Implementation TODOs

### Phase 1: Database Schema
- [ ] Add `use_metric` column to user_preferences table
- [ ] Create buoy_readings table
- [ ] Create forecast_cache table
- [ ] Create alert_queue table
- [ ] Create condition_logs table
- [ ] Update sent_alerts with condition_data column
- [ ] Add indexes and RLS policies

### Phase 2: Edge Functions
- [ ] fetch-buoy-data function (NOAA client)
- [ ] fetch-forecast-data function (Open-Meteo client)
- [ ] check-alerts function (trigger matching)
- [ ] process-alert-queue function (SMS/email delivery)

### Phase 3: Cron Jobs
- [ ] Set up pg_cron extension
- [ ] Configure all scheduled jobs
- [ ] Test job execution

### Phase 4: Frontend Integration
- [ ] Add Supabase Realtime subscriptions
- [ ] Update SpotCard to consume cached data
- [ ] Update Dashboard to use condition_logs
- [ ] Add metric/imperial toggle to settings
