# API Integration

This document describes all external APIs used by Wave-Wire for weather, wave, and tide data.

---

## NOAA NDBC - Buoy Data

Real-time wave and weather data from NOAA's National Data Buoy Center.

### Endpoint

```
https://www.ndbc.noaa.gov/data/realtime2/{STATION_ID}.txt
```

**CORS:** Blocked - requires Vercel proxy (`/api/noaa-buoy`)

### Raw Data Format

```
#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
2024 12 15 00 00  180  5.0  6.0   1.2  10.0   6.5  180 1013.0  22.0  24.0  18.0   MM   MM    MM
```

### Column Mapping

| Column | Index | Description | Unit |
|--------|-------|-------------|------|
| WVHT | 8 | Significant wave height | meters |
| DPD | 9 | Dominant wave period | seconds |
| MWD | 11 | Mean wave direction | degrees |
| WSPD | 6 | Wind speed | m/s |
| WDIR | 5 | Wind direction | degrees |
| WTMP | 14 | Water temperature | Celsius |

### Parsed Interface

```typescript
interface BuoyData {
  waveHeight: number;       // feet (converted)
  wavePeriod: number;       // seconds
  waterTemp: number;        // Fahrenheit (converted)
  meanWaveDirection: string; // cardinal (SE, NW, etc.)
  meanWaveDegrees: number;
  timestamp: string;
  windSpeed?: number;       // knots (converted)
  windDirection?: string;   // cardinal
  windDegrees?: number;
}
```

### Key Buoy Stations

**Gulf of Mexico:**
| Station | Name | Location |
|---------|------|----------|
| 42035 | Galveston | 22nm SE of Galveston |
| 42020 | Corpus Christi | 50nm SE |
| 42019 | Freeport | 60nm S |
| 42001 | Mid Gulf | 180nm S |

**Pacific Coast:**
| Station | Name | Location |
|---------|------|----------|
| 46232 | Point Loma | San Diego |
| 46025 | Santa Monica | Los Angeles |
| 46221 | Santa Cruz | Central CA |
| 46026 | San Francisco | SF Bay |
| 46029 | Columbia River | Oregon |

**Hawaii:**
| Station | Name | Location |
|---------|------|----------|
| 51001 | NW Hawaii | North swells |
| 51002 | SW Hawaii | South swells |
| 51201 | Waimea Bay | Oahu |

### Vercel Proxy

**File:** `frontend/api/noaa-buoy.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { station } = req.query;

  if (!station || typeof station !== 'string' || !/^\d{5}$/.test(station)) {
    return res.status(400).json({ error: 'Invalid station ID' });
  }

  try {
    const response = await fetch(
      `https://www.ndbc.noaa.gov/data/realtime2/${station}.txt`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Buoy data not available' });
    }

    const text = await response.text();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Type', 'text/plain');
    return res.send(text);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch buoy data' });
  }
}
```

---

## Open-Meteo - Marine Forecast

Wave and ocean forecast data. **No API key required.**

### Marine API

```
https://marine-api.open-meteo.com/v1/marine
  ?latitude={lat}
  &longitude={lon}
  &hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction
  &forecast_days=7
```

### Weather API

```
https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &hourly=wind_speed_10m,wind_direction_10m,temperature_2m
  &forecast_days=7
```

### Parameters

| Parameter | API Field | Unit |
|-----------|-----------|------|
| Primary swell height | `swell_wave_height` | m |
| Primary swell period | `swell_wave_period` | s |
| Primary swell direction | `swell_wave_direction` | degrees |
| Secondary swell height | `secondary_swell_wave_height` | m |
| Secondary swell period | `secondary_swell_wave_period` | s |
| Secondary swell direction | `secondary_swell_wave_direction` | degrees |
| Wave height (combined) | `wave_height` | m |
| Wave period | `wave_period` | s |
| Wave direction | `wave_direction` | degrees |
| Sea surface temp | `sea_surface_temperature` | C |
| Wind speed | `wind_speed_10m` | km/h |
| Wind direction | `wind_direction_10m` | degrees |

### Wave Models

The Marine API supports model selection via the `models` parameter:

```
https://marine-api.open-meteo.com/v1/marine
  ?latitude={lat}
  &longitude={lon}
  &hourly=...
  &models={model}
```

**Available Models:**

| Model | Value | Description |
|-------|-------|-------------|
| Best Match | (omit parameter) | Auto-selects optimal model for location |
| GFS Wave | `gfs_wave` | NOAA global model, 6-hour updates |
| ECMWF WAM | `ecmwf_wam` | European model, 9km resolution |
| MeteoFrance Wave | `mfwam` | French model, 0.08° global resolution |
| DWD EWAM | `dwd_ewam` | German regional model, 0.05° |
| DWD GWAM | `dwd_gwam` | German global model, 0.25° |
| ERA5 Ocean | `era5_ocean` | Reanalysis data, historical accuracy |

**Usage:**
- Omit `models` parameter for automatic best-match selection
- Example: `&models=gfs_wave` for GFS Wave model

### Region-Based Model Filtering

Not all models cover all regions. The app filters available models based on spot coordinates:

```typescript
function getWaveModelsForLocation(lat: number, lon: number): WaveModel[] {
  const models: WaveModel[] = [
    { value: 'best_match', label: 'Best Match', global: true },
    { value: 'ecmwf_wam', label: 'ECMWF WAM', global: true },
    { value: 'gwam', label: 'DWD Global', global: true },
    { value: 'era5_ocean', label: 'ERA5 Ocean', global: true },
  ];

  // GFS Wave: Americas and Pacific
  if (lon < -30 || lon > 100) {
    models.push({ value: 'gfs_wave', label: 'GFS Wave' });
  }

  // MeteoFrance: European Atlantic, Mediterranean
  if (lat > 25 && lat < 65 && lon > -30 && lon < 45) {
    models.push({ value: 'mfwam', label: 'MeteoFrance Wave' });
  }

  // DWD EWAM: North Sea, Baltic
  if (lat > 45 && lat < 65 && lon > -5 && lon < 30) {
    models.push({ value: 'ewam', label: 'DWD Europe' });
  }

  return models;
}
```

**Model Coverage Map:**

| Model | Coverage Area |
|-------|---------------|
| Best Match | Auto-selects based on location |
| GFS Wave | Americas (Atlantic & Pacific coasts), Pacific Ocean |
| ECMWF WAM | Global |
| MeteoFrance Wave | European Atlantic (Portugal to Norway), Mediterranean |
| DWD EWAM | North Sea, Baltic Sea, NW European coast |
| DWD GWAM | Global |
| ERA5 Ocean | Global (historical reanalysis) |

### Parsed Interface

```typescript
interface SwellComponent {
  height: number;   // feet (converted)
  period: number;   // seconds
  direction: string; // cardinal
  degrees: number;
}

interface ForecastData {
  primary: SwellComponent;
  secondary: SwellComponent;
  windSpeed: number;      // mph (converted)
  windDirection: string;  // cardinal
  windDegrees: number;
  tide: number;
  airTemp: number;        // Fahrenheit (converted)
  tideDirection: string;  // 'rising' | 'falling' | 'slack'
}
```

---

## NOAA CO-OPS - Tide Data

Real-time and predicted tide information.

### Endpoint

```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
  ?station={STATION_ID}
  &product=predictions
  &datum=MLLW
  &units=english
  &time_zone=lst_ldt
  &format=json
  &interval=hilo
  &begin_date={YYYYMMDD}
  &range=48
  &application=wave-wire
```

**Authentication:** None required (free public API)

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `station` | 7-digit NOAA tide station ID | `9410230` |
| `product` | Type of data | `predictions` |
| `datum` | Reference point | `MLLW` |
| `units` | Unit system | `english` |
| `time_zone` | Timezone | `lst_ldt` (local with DST) |
| `format` | Response format | `json` |
| `interval` | Data interval | `hilo` (high/low only) |

### Response Format

```json
{
  "predictions": [
    { "t": "2025-12-15 05:42", "v": "5.234", "type": "H" },
    { "t": "2025-12-15 11:18", "v": "1.123", "type": "L" },
    { "t": "2025-12-15 17:54", "v": "4.876", "type": "H" },
    { "t": "2025-12-15 23:36", "v": "0.543", "type": "L" }
  ]
}
```

### Key Tide Stations

| Region | Station ID | Name |
|--------|------------|------|
| San Diego | 9410230 | La Jolla |
| San Diego | 9410170 | San Diego |
| Los Angeles | 9410660 | Los Angeles |
| Corpus Christi | 8775870 | Corpus Christi |
| Galveston | 8771450 | Galveston Pier 21 |

### Display Format

```
TDE  2.3ft ↑  (high @ 5:42 PM)
```

- Current tide height (interpolated)
- Direction: rising (↑), falling (↓), or slack (→)
- Next significant tide event

---

## Traffic Data (Planned)

### Google Routes API

**Endpoint:** `https://routes.googleapis.com/directions/v2:computeRoutes`

**Authentication:** API key required

**Pricing:** ~$10/1000 requests

### Implementation Plan

1. **Set up Google Cloud project**
   - Enable Routes API
   - Create API key with restrictions
   - Store key in environment variables

2. **Create Vercel proxy** (to hide API key)
   - `api/traffic.ts`
   - Accept origin/destination, return duration

3. **Create React hook**
   - `src/hooks/useTrafficData.ts`
   - Cache for 15-30 minutes

### Cost Mitigation

For a user checking traffic 2x/day:
- 2 requests × 30 days = 60 requests/month/user
- 1000 users = 60,000 requests/month = ~$600/month

**Strategies:**
- Cache aggressively (15-30 min)
- Only fetch when user opens dashboard
- Only fetch for "unlimited" tier users
- Batch requests for alerts (backend)

---

## React Hooks

### `useBuoyData(stationId)`

Fetch live buoy data with caching.

```typescript
const { data, isLoading, error, refresh } = useBuoyData('42035');
```

### `useForecastData(lat, lon)`

Fetch marine forecast with caching.

```typescript
const { data, isLoading, error, refresh } = useForecastData(28.94, -95.29);
```

### `useTideData(stationId)`

Fetch tide predictions.

```typescript
const { data, isLoading, error, refresh } = useTideData('8771450');
```

---

## Error Handling

| Error | Detection | User Experience |
|-------|-----------|-----------------|
| Buoy offline | 404 or "MM" values | "No Signal" with last known data |
| Network error | Fetch fails | Show cached data with warning |
| Rate limited | 429 response | Queue request, show cached |
| Stale data | Timestamp > 2hr | Show with "Updated X ago" badge |

---

## Caching Strategy

| Data Type | Memory TTL | localStorage TTL |
|-----------|------------|------------------|
| Buoy data | 5 min | 15 min |
| Forecast | 30 min | 1 hour |
| Tide | 6 hours | 24 hours |

### Cache Key Format

```typescript
// Buoy
`buoy:${stationId}`  // e.g., "buoy:42035"

// Forecast (rounded coordinates)
`forecast:${lat.toFixed(2)}:${lon.toFixed(2)}`

// Tide
`tide:${stationId}`
```
