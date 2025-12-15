# Live API Integration

Frontend service layer for fetching live NOAA buoy data and Open-Meteo marine forecasts.

---

## Architecture

```
React Components
       │
       ▼
┌─────────────────────┐
│    React Hooks      │
│  useBuoyData()      │
│  useForecastData()  │
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

---

## Files to Create

```
frontend/
├── api/
│   └── noaa-buoy.ts              # Vercel serverless proxy
└── src/
    ├── services/
    │   ├── api/
    │   │   ├── noaaBuoy.ts       # NOAA fetching + parsing
    │   │   ├── openMeteo.ts      # Open-Meteo marine + weather
    │   │   └── index.ts
    │   └── index.ts
    └── hooks/
        ├── useBuoyData.ts        # Single buoy hook
        ├── useForecastData.ts    # Single location hook
        └── index.ts
```

---

## NOAA Buoy Service

### Data Source
- **URL:** `https://www.ndbc.noaa.gov/data/realtime2/{STATION_ID}.txt`
- **Format:** Space-delimited text with header rows
- **CORS:** Blocked (requires proxy)

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

### Unit Conversions
```typescript
const METERS_TO_FEET = 3.28084;
const MS_TO_KNOTS = 1.94384;
const celsiusToFahrenheit = (c: number) => (c * 9/5) + 32;
```

### Target Interface (from SpotCard.tsx)
```typescript
interface BuoyData {
  waveHeight: number;       // feet
  wavePeriod: number;       // seconds
  waterTemp: number;        // Fahrenheit
  meanWaveDirection: string; // cardinal (SE, NW, etc.)
  meanWaveDegrees: number;
  timestamp: string;
  windSpeed?: number;       // knots
  windDirection?: string;   // cardinal
  windDegrees?: number;
}
```

---

## Open-Meteo Service

### Endpoints

**Marine API (waves):**
```
https://marine-api.open-meteo.com/v1/marine
  ?latitude={lat}
  &longitude={lon}
  &hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction
  &forecast_days=7
```

**Weather API (wind/temp):**
```
https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &hourly=wind_speed_10m,wind_direction_10m,temperature_2m
  &forecast_days=7
```

### CORS
Open-Meteo allows direct browser requests (no proxy needed).

### Target Interface (from SpotCard.tsx)
```typescript
interface ForecastData {
  primary: SwellComponent;
  secondary: SwellComponent;
  windSpeed: number;
  windDirection: string;
  windDegrees: number;
  tide: number;
  airTemp: number;
  tideDirection: string;
}

interface SwellComponent {
  height: number;   // feet
  period: number;   // seconds
  direction: string; // cardinal
  degrees: number;
}
```

---

## Vercel Proxy

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

## Caching Strategy

| Data Type | Memory TTL | localStorage TTL |
|-----------|------------|------------------|
| Buoy data | 5 min | 15 min |
| Forecast | 30 min | 1 hour |

### Cache Key Format
```typescript
// Buoy
`buoy:${stationId}`  // e.g., "buoy:42035"

// Forecast (rounded coordinates)
`forecast:${lat.toFixed(2)}:${lon.toFixed(2)}`  // e.g., "forecast:28.94:-95.29"
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

## Integration Points

### DashboardOverview.tsx
Replace mock `userSpots` array with live data from hooks.

### SpotPage.tsx
Show live buoy preview when selecting/assigning buoys.

### SpotCard.tsx
No changes needed - already handles undefined buoy/forecast gracefully.

---

## Implementation Order

1. Create Vercel proxy (`api/noaa-buoy.ts`)
2. Create NOAA service (`services/api/noaaBuoy.ts`)
3. Create Open-Meteo service (`services/api/openMeteo.ts`)
4. Create React hooks (`hooks/useBuoyData.ts`, `hooks/useForecastData.ts`)
5. Wire up DashboardOverview.tsx
6. Wire up SpotPage.tsx
