import type { VercelRequest, VercelResponse } from '@vercel/node';

// Unit conversion constants
const METERS_TO_FEET = 3.28084;
const KMH_TO_KNOTS = 0.539957;
const CELSIUS_TO_FAHRENHEIT = (c: number) => (c * 9) / 5 + 32;

interface SessionConditions {
  waveHeight: number | null;
  wavePeriod: number | null;
  swellDirection: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  tideHeight: number | null;
  tideState: 'rising' | 'falling' | null;
  waterTemp: number | null;
  fetchedAt: string;
  source: 'live' | 'historical';
}

interface OpenMeteoHistoricalResponse {
  hourly: {
    time: string[];
    wave_height?: number[];
    wave_period?: number[];
    wave_direction?: number[];
    swell_wave_direction?: number[];
  };
}

interface OpenMeteoWeatherHistoricalResponse {
  hourly: {
    time: string[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
  };
}

interface NOAATidePrediction {
  predictions: Array<{
    t: string; // time
    v: string; // value (height in feet)
    type?: string; // 'H' or 'L' for high/low
  }>;
}

// Check if coordinates are within US coastal waters (rough bounds)
function isUSCoastalLocation(lat: number, lon: number): boolean {
  // West Coast (California to Washington)
  if (lat >= 32 && lat <= 49 && lon >= -130 && lon <= -117) return true;
  // Hawaii
  if (lat >= 18 && lat <= 23 && lon >= -161 && lon <= -154) return true;
  // East Coast (Florida to Maine)
  if (lat >= 24 && lat <= 45 && lon >= -82 && lon <= -66) return true;
  // Gulf Coast
  if (lat >= 25 && lat <= 31 && lon >= -98 && lon <= -80) return true;
  // Alaska
  if (lat >= 51 && lat <= 72 && lon >= -180 && lon <= -130) return true;
  return false;
}

// Find nearest NOAA tide station (simplified - returns null for international)
async function findNearestTideStation(lat: number, lon: number): Promise<string | null> {
  if (!isUSCoastalLocation(lat, lon)) {
    return null;
  }

  // Common tide stations by region (simplified mapping)
  // In production, you'd query NOAA's station API
  const stations: { id: string; lat: number; lon: number }[] = [
    // California
    { id: '9410230', lat: 32.8669, lon: -117.2578 }, // La Jolla
    { id: '9410660', lat: 33.7200, lon: -118.2717 }, // Los Angeles
    { id: '9413450', lat: 36.9628, lon: -122.0167 }, // Monterey
    { id: '9414290', lat: 37.8063, lon: -122.4659 }, // San Francisco
    // Hawaii
    { id: '1612340', lat: 21.3067, lon: -157.8644 }, // Honolulu
    // East Coast
    { id: '8518750', lat: 40.7006, lon: -74.0156 }, // The Battery, NY
    { id: '8443970', lat: 42.3539, lon: -71.0503 }, // Boston
    // Florida
    { id: '8723214', lat: 25.7742, lon: -80.1867 }, // Virginia Key, FL
    // Gulf
    { id: '8775870', lat: 27.5800, lon: -97.2167 }, // Corpus Christi
  ];

  // Find nearest station
  let nearest = stations[0];
  let minDist = Infinity;

  for (const station of stations) {
    const dist = Math.sqrt(
      Math.pow(station.lat - lat, 2) + Math.pow(station.lon - lon, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = station;
    }
  }

  // Only return if reasonably close (within ~100 miles / ~1.5 degrees)
  return minDist < 1.5 ? nearest.id : null;
}

// Fetch tide data from NOAA
async function fetchTideData(
  stationId: string,
  timestamp: string
): Promise<{ height: number; state: 'rising' | 'falling' } | null> {
  try {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    // Fetch predictions for the day
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?` +
      `begin_date=${dateStr}&end_date=${dateStr}&` +
      `station=${stationId}&product=predictions&datum=MLLW&` +
      `time_zone=lst_ldt&units=english&interval=h&format=json`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data: NOAATidePrediction = await response.json();
    if (!data.predictions || data.predictions.length === 0) return null;

    // Find the prediction closest to the requested time
    const targetHour = date.getHours();
    const predictions = data.predictions.map((p, i) => ({
      ...p,
      hour: new Date(p.t).getHours(),
      index: i,
    }));

    const closest = predictions.reduce((prev, curr) =>
      Math.abs(curr.hour - targetHour) < Math.abs(prev.hour - targetHour)
        ? curr
        : prev
    );

    const height = parseFloat(closest.v);

    // Determine tide state by comparing to adjacent predictions
    const prevIndex = Math.max(0, closest.index - 1);
    const prevHeight = parseFloat(data.predictions[prevIndex].v);
    const state: 'rising' | 'falling' = height > prevHeight ? 'rising' : 'falling';

    return { height, state };
  } catch (error) {
    console.error('NOAA tide fetch error:', error);
    return null;
  }
}

// Fetch historical marine data from Open-Meteo
async function fetchHistoricalConditions(
  lat: number,
  lon: number,
  timestamp: string,
  timezone: string
): Promise<Partial<SessionConditions>> {
  try {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0];

    // Determine if this is historical (past) or forecast (future)
    const now = new Date();
    const isHistorical = date < now;

    // Use appropriate API based on date
    const marineBaseUrl = isHistorical
      ? 'https://marine-api.open-meteo.com/v1/marine'  // Archive has same base URL with past_days
      : 'https://marine-api.open-meteo.com/v1/marine';

    // Build URL based on whether historical or forecast
    let marineUrl: string;
    if (isHistorical) {
      // For historical data, use start_date and end_date
      marineUrl = `${marineBaseUrl}?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=wave_height,wave_period,wave_direction,swell_wave_direction&` +
        `start_date=${dateStr}&end_date=${dateStr}&` +
        `timezone=${timezone || 'auto'}`;
    } else {
      // For forecast, use standard forecast_days
      marineUrl = `${marineBaseUrl}?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=wave_height,wave_period,wave_direction,swell_wave_direction&` +
        `forecast_days=3&timezone=${timezone || 'auto'}`;
    }

    // Weather URL (for wind)
    const weatherBaseUrl = isHistorical
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast';

    let weatherUrl: string;
    if (isHistorical) {
      weatherUrl = `${weatherBaseUrl}?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=wind_speed_10m,wind_direction_10m&` +
        `start_date=${dateStr}&end_date=${dateStr}&` +
        `timezone=${timezone || 'auto'}`;
    } else {
      weatherUrl = `${weatherBaseUrl}?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=wind_speed_10m,wind_direction_10m&` +
        `forecast_days=3&timezone=${timezone || 'auto'}`;
    }

    const [marineResponse, weatherResponse] = await Promise.all([
      fetch(marineUrl),
      fetch(weatherUrl),
    ]);

    let waveData: Partial<SessionConditions> = {};
    let windData: Partial<SessionConditions> = {};

    // Parse marine data
    if (marineResponse.ok) {
      const marineJson: OpenMeteoHistoricalResponse = await marineResponse.json();
      const times = marineJson.hourly?.time || [];
      const targetHour = date.getHours();

      // Find index for the target hour
      const index = times.findIndex((t) => {
        const timeDate = new Date(t);
        return timeDate.getHours() === targetHour &&
          timeDate.toDateString() === date.toDateString();
      });

      if (index !== -1) {
        const heightM = marineJson.hourly.wave_height?.[index];
        const period = marineJson.hourly.wave_period?.[index];
        const swellDir = marineJson.hourly.swell_wave_direction?.[index] ??
          marineJson.hourly.wave_direction?.[index];

        waveData = {
          waveHeight: heightM != null ? Math.round(heightM * METERS_TO_FEET * 10) / 10 : null,
          wavePeriod: period != null ? Math.round(period) : null,
          swellDirection: swellDir != null ? Math.round(swellDir) : null,
        };
      }
    }

    // Parse weather data
    if (weatherResponse.ok) {
      const weatherJson: OpenMeteoWeatherHistoricalResponse = await weatherResponse.json();
      const times = weatherJson.hourly?.time || [];
      const targetHour = date.getHours();

      const index = times.findIndex((t) => {
        const timeDate = new Date(t);
        return timeDate.getHours() === targetHour &&
          timeDate.toDateString() === date.toDateString();
      });

      if (index !== -1) {
        const windKmh = weatherJson.hourly.wind_speed_10m?.[index];
        const windDir = weatherJson.hourly.wind_direction_10m?.[index];

        windData = {
          windSpeed: windKmh != null ? Math.round(windKmh * KMH_TO_KNOTS) : null,
          windDirection: windDir != null ? Math.round(windDir) : null,
        };
      }
    }

    return {
      ...waveData,
      ...windData,
      source: isHistorical ? 'historical' : 'live',
    };
  } catch (error) {
    console.error('Open-Meteo historical fetch error:', error);
    return {};
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract parameters from query (GET) or body (POST)
  const params = req.method === 'GET' ? req.query : req.body;
  const lat = parseFloat(params.lat as string);
  const lon = parseFloat(params.lon as string);
  const timestamp = params.timestamp as string;
  const timezone = (params.timezone as string) || 'auto';

  // Validate required params
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid latitude or longitude' });
  }

  if (!timestamp) {
    return res.status(400).json({ error: 'Missing timestamp parameter' });
  }

  try {
    // Fetch wave/wind data from Open-Meteo
    const conditions = await fetchHistoricalConditions(lat, lon, timestamp, timezone);

    // Attempt to fetch tide data (US only)
    const stationId = await findNearestTideStation(lat, lon);
    let tideData: { height: number; state: 'rising' | 'falling' } | null = null;

    if (stationId) {
      tideData = await fetchTideData(stationId, timestamp);
    }

    const result: SessionConditions = {
      waveHeight: conditions.waveHeight ?? null,
      wavePeriod: conditions.wavePeriod ?? null,
      swellDirection: conditions.swellDirection ?? null,
      windSpeed: conditions.windSpeed ?? null,
      windDirection: conditions.windDirection ?? null,
      tideHeight: tideData?.height ?? null,
      tideState: tideData?.state ?? null,
      waterTemp: null, // Not available from Open-Meteo historical
      fetchedAt: new Date().toISOString(),
      source: conditions.source ?? 'historical',
    };

    // Cache for 1 hour (historical data doesn't change)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

    return res.status(200).json(result);
  } catch (error) {
    console.error('fetch-conditions error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to fetch conditions', details: errorMessage });
  }
}
