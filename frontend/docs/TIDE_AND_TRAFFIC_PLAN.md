# Tide & Traffic Data Integration Plan

## Overview

This document outlines the plan to integrate:
1. **NOAA CO-OPS Tide Data** - Real-time and predicted tide information
2. **Traffic Data** - Drive time from user's home to surf spots

---

## Part A: NOAA Tide Data Integration

### API Details

**Endpoint:** `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`

**Authentication:** None required (free public API)

**Rate Limits:** Data length limitations based on interval type

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `station` | 7-digit NOAA tide station ID | `9410230` |
| `product` | Type of data | `predictions` |
| `datum` | Reference point | `MLLW` (Mean Lower Low Water) |
| `units` | Unit system | `english` |
| `time_zone` | Timezone | `lst_ldt` (local with DST) |
| `format` | Response format | `json` |
| `application` | App identifier | `itspumping.ai` |

### Useful Products

- `predictions` - Tide predictions (high/low or hourly)
- `water_level` - Real-time observed water level
- `high_low` - Just high/low tide times

### Example API Call

```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
  ?station=9410230
  &product=predictions
  &datum=MLLW
  &units=english
  &time_zone=lst_ldt
  &format=json
  &interval=hilo
  &begin_date=20251215
  &range=48
  &application=itspumping.ai
```

### Response Format (predictions with hilo)

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

### Implementation Steps

1. **Create tide station reference data**
   - Map California/Texas coastal areas to nearest tide stations
   - Store in `src/data/tideStations.ts`

2. **Create tide service**
   - `src/services/api/noaaTide.ts`
   - Fetch predictions for next 48 hours
   - Parse high/low times
   - Calculate current tide state (rising/falling/slack)
   - Determine current tide height

3. **Create React hook**
   - `src/hooks/useTideData.ts`
   - Cache tide predictions (valid for several hours)

4. **Update SpotCard**
   - Replace "N/A" with actual tide data
   - Show: current height, direction (↑↓→), next high/low time

### Key Tide Stations

| Region | Station ID | Name |
|--------|------------|------|
| San Diego | 9410230 | La Jolla |
| San Diego | 9410170 | San Diego |
| Oceanside | 9410660 | Los Angeles |
| Corpus Christi | 8775870 | Corpus Christi |
| Galveston | 8771450 | Galveston Pier 21 |

### Data to Display

```
TDE  2.3ft ↑  (high @ 5:42 PM)
```

- Current tide height (interpolated)
- Direction: rising (↑), falling (↓), or slack (→)
- Next significant tide event

---

## Part B: Traffic Data Integration

### API Options

| Provider | Cost | Notes |
|----------|------|-------|
| Google Routes API | ~$10/1000 requests | Most accurate traffic |
| Mapbox Directions | ~$5/1000 requests | Good alternative |
| HERE Routing | ~$5/1000 requests | European coverage |
| TomTom | ~$4/1000 requests | Real-time traffic |

**Recommendation:** Start with Google Routes API for accuracy, consider Mapbox as cost-effective alternative.

### Google Routes API

**Endpoint:** `https://routes.googleapis.com/directions/v2:computeRoutes`

**Authentication:** API key required

**Pricing:** ~$10/1000 requests for traffic-aware routing

### Required Data

1. **User's home address** - Already in `profiles.home_address`
2. **Spot coordinates** - Already have lat/lon for spots
3. **Departure time** - For traffic predictions

### Implementation Steps

1. **Set up Google Cloud project**
   - Enable Routes API
   - Create API key with restrictions
   - Store key in environment variables

2. **Create Vercel proxy** (to hide API key)
   - `api/traffic.ts`
   - Accept origin/destination, return duration

3. **Create traffic service**
   - `src/services/api/traffic.ts`
   - Geocode home address if needed
   - Fetch route with traffic

4. **Create React hook**
   - `src/hooks/useTrafficData.ts`
   - Cache for 15-30 minutes
   - Refresh on demand

5. **Update alert messages**
   - Include "Traffic: 45min" in morning alerts
   - Show on dashboard if user has home address

### Data to Display

```
🚗 45 min from home (via I-5)
```

- Duration with traffic
- Route summary (optional)
- "Leave by X:XX" suggestion

### Cost Considerations

For a user checking traffic 2x/day:
- 2 requests × 30 days = 60 requests/month/user
- 1000 users = 60,000 requests/month = ~$600/month

**Mitigation strategies:**
- Cache aggressively (15-30 min)
- Only fetch when user opens dashboard
- Only fetch for "unlimited" tier users
- Batch requests for alerts (backend)

---

## Implementation Order

### Phase 1: Tide Data (No API key required)
1. Create tide station mapping
2. Create tide service + hook
3. Update SpotCard to display tide
4. Test with San Diego and Texas spots

### Phase 2: Traffic Data (Requires API key setup)
1. Set up Google Cloud / Routes API
2. Create Vercel proxy
3. Create traffic service + hook
4. Add to alert generation (backend)
5. Display on dashboard

---

## Files to Create

### Tide
- `src/data/tideStations.ts` - Station ID mapping
- `src/services/api/noaaTide.ts` - NOAA tide service
- `src/hooks/useTideData.ts` - React hook

### Traffic
- `api/traffic.ts` - Vercel proxy (hides API key)
- `src/services/api/traffic.ts` - Traffic service
- `src/hooks/useTrafficData.ts` - React hook

---

## Environment Variables Needed

```env
# Traffic (Google Routes API)
GOOGLE_ROUTES_API_KEY=your_api_key_here

# Or for Mapbox alternative
MAPBOX_ACCESS_TOKEN=your_token_here
```

---

## References

- [NOAA CO-OPS API Documentation](https://api.tidesandcurrents.noaa.gov/api/prod/)
- [Google Routes API](https://developers.google.com/maps/documentation/routes)
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
