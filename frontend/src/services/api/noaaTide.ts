/**
 * NOAA CO-OPS Tide Data Service
 * Fetches tide predictions from NOAA tide stations
 */

import { findNearestTideStation } from '../../data/tideStations';

const NOAA_TIDE_API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

export interface TidePrediction {
  time: Date;
  height: number; // feet
  type: 'H' | 'L'; // High or Low
}

export interface HourlyTide {
  time: Date;
  height: number;
}

export interface TideData {
  stationId: string;
  stationName: string;
  currentHeight: number;
  currentDirection: 'rising' | 'falling' | 'slack';
  nextEvent: TidePrediction | null;
  predictions: TidePrediction[]; // High/low predictions
  hourly: HourlyTide[]; // Hourly data for chart
  lastUpdated: Date;
}

export interface TideFetchResult {
  data: TideData | null;
  error: string | null;
  isStale: boolean;
}

// Cache for tide data
const cache = new Map<string, { data: TideData; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (tide predictions don't change often)

// Format date for NOAA API (YYYYMMDD)
const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Parse NOAA date string to Date object
const parseNOAADate = (dateStr: string): Date => {
  // Format: "2025-12-15 05:42"
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

// Interpolate current tide height based on surrounding predictions
const interpolateTideHeight = (
  predictions: TidePrediction[],
  now: Date
): { height: number; direction: 'rising' | 'falling' | 'slack' } => {
  if (predictions.length < 2) {
    return { height: 0, direction: 'slack' };
  }

  // Find the predictions surrounding current time
  let before: TidePrediction | null = null;
  let after: TidePrediction | null = null;

  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i].time <= now) {
      before = predictions[i];
    }
    if (predictions[i].time > now && !after) {
      after = predictions[i];
      break;
    }
  }

  if (!before || !after) {
    // Edge case: use first two predictions
    before = predictions[0];
    after = predictions[1];
  }

  // Linear interpolation
  const totalDuration = after.time.getTime() - before.time.getTime();
  const elapsed = now.getTime() - before.time.getTime();
  const progress = Math.max(0, Math.min(1, elapsed / totalDuration));

  const height = before.height + (after.height - before.height) * progress;
  const direction = after.height > before.height ? 'rising' : 'falling';

  // Check for slack tide (within 15 minutes of high/low)
  const minutesToNext = (after.time.getTime() - now.getTime()) / (1000 * 60);
  const minutesFromPrev = (now.getTime() - before.time.getTime()) / (1000 * 60);
  const isSlack = minutesToNext < 15 || minutesFromPrev < 15;

  return {
    height: Math.round(height * 10) / 10,
    direction: isSlack ? 'slack' : direction,
  };
};

// Fetch high/low predictions
async function fetchHiLoPredictions(
  stationId: string,
  beginDate: string,
  hours: number
): Promise<TidePrediction[]> {
  const url = new URL(NOAA_TIDE_API);
  url.searchParams.set('station', stationId);
  url.searchParams.set('product', 'predictions');
  url.searchParams.set('datum', 'MLLW');
  url.searchParams.set('units', 'english');
  url.searchParams.set('time_zone', 'lst_ldt');
  url.searchParams.set('format', 'json');
  url.searchParams.set('interval', 'hilo');
  url.searchParams.set('begin_date', beginDate);
  url.searchParams.set('range', String(hours));
  url.searchParams.set('application', 'itspumping.ai');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`NOAA API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'NOAA API error');
  }

  if (!data.predictions || !Array.isArray(data.predictions)) {
    return [];
  }

  return data.predictions.map((p: { t: string; v: string; type: 'H' | 'L' }) => ({
    time: parseNOAADate(p.t),
    height: parseFloat(p.v),
    type: p.type,
  }));
}

// Fetch hourly predictions for chart
async function fetchHourlyPredictions(
  stationId: string,
  beginDate: string,
  hours: number
): Promise<HourlyTide[]> {
  const url = new URL(NOAA_TIDE_API);
  url.searchParams.set('station', stationId);
  url.searchParams.set('product', 'predictions');
  url.searchParams.set('datum', 'MLLW');
  url.searchParams.set('units', 'english');
  url.searchParams.set('time_zone', 'lst_ldt');
  url.searchParams.set('format', 'json');
  url.searchParams.set('interval', 'h'); // hourly
  url.searchParams.set('begin_date', beginDate);
  url.searchParams.set('range', String(hours));
  url.searchParams.set('application', 'itspumping.ai');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`NOAA API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'NOAA API error');
  }

  if (!data.predictions || !Array.isArray(data.predictions)) {
    return [];
  }

  return data.predictions.map((p: { t: string; v: string }) => ({
    time: parseNOAADate(p.t),
    height: parseFloat(p.v),
  }));
}

/**
 * Fetch tide data for a station
 */
export async function fetchTideData(stationId: string, stationName: string): Promise<TideFetchResult> {
  // Check cache
  const cached = cache.get(stationId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      data: cached.data,
      error: null,
      isStale: false,
    };
  }

  try {
    const now = new Date();
    const beginDate = formatDateForAPI(now);

    // Fetch both hi/lo and hourly data in parallel
    const [predictions, hourly] = await Promise.all([
      fetchHiLoPredictions(stationId, beginDate, 72), // 3 days of hi/lo
      fetchHourlyPredictions(stationId, beginDate, 72), // 3 days hourly for chart
    ]);

    if (predictions.length === 0) {
      return {
        data: cached?.data ?? null,
        error: 'No tide predictions available for this station',
        isStale: !!cached,
      };
    }

    // Calculate current state
    const { height, direction } = interpolateTideHeight(predictions, now);

    // Find next tide event
    const nextEvent = predictions.find(p => p.time > now) ?? null;

    const tideData: TideData = {
      stationId,
      stationName,
      currentHeight: height,
      currentDirection: direction,
      nextEvent,
      predictions,
      hourly,
      lastUpdated: now,
    };

    // Update cache
    cache.set(stationId, { data: tideData, timestamp: Date.now() });

    return {
      data: tideData,
      error: null,
      isStale: false,
    };
  } catch (error) {
    console.error(`Error fetching tide data for ${stationId}:`, error);
    return {
      data: cached?.data ?? null,
      error: error instanceof Error ? error.message : 'Failed to fetch tide data',
      isStale: !!cached,
    };
  }
}

/**
 * Fetch tide data for a location (finds nearest station)
 */
export async function fetchTideDataForLocation(
  lat: number,
  lon: number
): Promise<TideFetchResult & { stationDistance?: number }> {
  const result = findNearestTideStation(lat, lon);

  if (!result) {
    return {
      data: null,
      error: 'No tide stations found near this location',
      isStale: false,
    };
  }

  const tideResult = await fetchTideData(result.station.id, result.station.name);
  return {
    ...tideResult,
    stationDistance: result.distance,
  };
}

/**
 * Get tide predictions for a specific day (for chart)
 */
export function getTidePredictionsForDay(
  tideData: TideData,
  dayOffset: number = 0 // 0 = today, 1 = tomorrow, 2 = day after
): { hourly: HourlyTide[]; hiLo: TidePrediction[] } {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + dayOffset);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const hourly = tideData.hourly.filter(
    h => h.time >= targetDate && h.time < nextDay
  );

  const hiLo = tideData.predictions.filter(
    p => p.time >= targetDate && p.time < nextDay
  );

  return { hourly, hiLo };
}

/**
 * Format tide height for display
 */
export function formatTideHeight(height: number): string {
  return `${height.toFixed(1)}ft`;
}

/**
 * Format next tide event for display
 */
export function formatNextTideEvent(prediction: TidePrediction): string {
  const time = prediction.time;
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  const typeLabel = prediction.type === 'H' ? 'high' : 'low';

  return `${typeLabel} @ ${displayHour}:${displayMinutes} ${ampm}`;
}

// Clear tide cache
export function clearTideCache(): void {
  cache.clear();
}
