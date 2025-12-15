import type { BuoyData } from '../../components/SpotCard';

// Unit conversion constants
const METERS_TO_FEET = 3.28084;
const MS_TO_KNOTS = 1.94384;

// Convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number): number => (celsius * 9 / 5) + 32;

// Convert degrees to cardinal direction (16-point compass)
const degreesToCardinal = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Format timestamp to relative time string
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Round to specified decimal places
const round = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// NOAA column indices
// #YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
//  0   1  2  3  4   5    6    7    8      9    10   11    12    13    14    15   16   17    18
const NOAA_COLUMNS = {
  YEAR: 0,
  MONTH: 1,
  DAY: 2,
  HOUR: 3,
  MINUTE: 4,
  WDIR: 5,      // Wind direction (degrees)
  WSPD: 6,      // Wind speed (m/s)
  GST: 7,       // Wind gust (m/s)
  WVHT: 8,      // Significant wave height (m)
  DPD: 9,       // Dominant wave period (s)
  APD: 10,      // Average wave period (s)
  MWD: 11,      // Mean wave direction (degrees)
  PRES: 12,     // Atmospheric pressure (hPa)
  ATMP: 13,     // Air temperature (C)
  WTMP: 14,     // Water temperature (C)
} as const;

interface ParsedBuoyRow {
  timestamp: Date;
  waveHeight: number | null;      // WVHT in meters
  wavePeriod: number | null;      // DPD in seconds
  meanWaveDirection: number | null; // MWD in degrees
  windSpeed: number | null;       // WSPD in m/s
  windGust: number | null;        // GST in m/s
  windDirection: number | null;   // WDIR in degrees
  waterTemp: number | null;       // WTMP in Celsius
  airTemp: number | null;         // ATMP in Celsius
  pressure: number | null;        // PRES in hPa
}

// Parse a single value, returning null if it's "MM" (missing) or invalid
const parseValue = (value: string): number | null => {
  if (!value || value === 'MM' || value === 'N/A') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// Parse NOAA text format into structured data
const parseNOAAText = (text: string): ParsedBuoyRow[] => {
  const lines = text.trim().split('\n');
  const dataRows: ParsedBuoyRow[] = [];

  for (const line of lines) {
    // Skip header lines (start with #)
    if (line.startsWith('#')) continue;

    // Split by whitespace
    const parts = line.trim().split(/\s+/);
    if (parts.length < 15) continue; // Need at least 15 columns

    // Parse timestamp
    const year = parseInt(parts[NOAA_COLUMNS.YEAR], 10);
    const month = parseInt(parts[NOAA_COLUMNS.MONTH], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[NOAA_COLUMNS.DAY], 10);
    const hour = parseInt(parts[NOAA_COLUMNS.HOUR], 10);
    const minute = parseInt(parts[NOAA_COLUMNS.MINUTE], 10);

    // Handle 2-digit year (NOAA uses 2-digit years)
    const fullYear = year < 100 ? 2000 + year : year;

    // NOAA timestamps are in UTC
    const timestamp = new Date(Date.UTC(fullYear, month, day, hour, minute));

    dataRows.push({
      timestamp,
      waveHeight: parseValue(parts[NOAA_COLUMNS.WVHT]),
      wavePeriod: parseValue(parts[NOAA_COLUMNS.DPD]),
      meanWaveDirection: parseValue(parts[NOAA_COLUMNS.MWD]),
      windSpeed: parseValue(parts[NOAA_COLUMNS.WSPD]),
      windGust: parseValue(parts[NOAA_COLUMNS.GST]),
      windDirection: parseValue(parts[NOAA_COLUMNS.WDIR]),
      waterTemp: parseValue(parts[NOAA_COLUMNS.WTMP]),
      airTemp: parseValue(parts[NOAA_COLUMNS.ATMP]),
      pressure: parseValue(parts[NOAA_COLUMNS.PRES]),
    });
  }

  return dataRows;
};

// Transform parsed NOAA data to BuoyData interface
const transformToBuoyData = (row: ParsedBuoyRow): BuoyData | null => {
  // Need at least wave height to be useful
  if (row.waveHeight === null) return null;

  return {
    waveHeight: round(row.waveHeight * METERS_TO_FEET, 1),
    wavePeriod: row.wavePeriod ?? 0,
    waterTemp: row.waterTemp !== null
      ? round(celsiusToFahrenheit(row.waterTemp), 0)
      : 0,
    meanWaveDirection: row.meanWaveDirection !== null
      ? degreesToCardinal(row.meanWaveDirection)
      : 'N/A',
    meanWaveDegrees: row.meanWaveDirection ?? 0,
    timestamp: formatRelativeTime(row.timestamp),
    windSpeed: row.windSpeed !== null
      ? round(row.windSpeed * MS_TO_KNOTS, 0)
      : undefined,
    windGust: row.windGust !== null
      ? round(row.windGust * MS_TO_KNOTS, 0)
      : undefined,
    windDirection: row.windDirection !== null
      ? degreesToCardinal(row.windDirection)
      : undefined,
    windDegrees: row.windDirection ?? undefined,
    airTemp: row.airTemp !== null
      ? round(celsiusToFahrenheit(row.airTemp), 0)
      : undefined,
    pressure: row.pressure ?? undefined,
  };
};

export interface BuoyFetchResult {
  data: BuoyData | null;
  error: string | null;
  isStale: boolean;
  rawTimestamp: Date | null;
}

// Simple in-memory cache
const cache = new Map<string, { data: BuoyData; timestamp: number; rawTimestamp: Date }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_DATA_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours - data older than this is considered "no signal"

// Fetch buoy data for a station
export async function fetchBuoyData(stationId: string): Promise<BuoyFetchResult> {
  const normalizedId = stationId.toUpperCase();

  // Check cache first
  const cached = cache.get(normalizedId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      data: cached.data,
      error: null,
      isStale: false,
      rawTimestamp: cached.rawTimestamp,
    };
  }

  try {
    // Use relative URL to hit Vercel API route
    const response = await fetch(`/api/noaa-buoy?station=${normalizedId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: cached?.data ?? null, // Return stale data if available
        error: errorData.message || `Failed to fetch buoy data (${response.status})`,
        isStale: !!cached,
        rawTimestamp: cached?.rawTimestamp ?? null,
      };
    }

    const text = await response.text();
    const parsedRows = parseNOAAText(text);

    if (parsedRows.length === 0) {
      return {
        data: cached?.data ?? null,
        error: 'No valid data found for this buoy',
        isStale: !!cached,
        rawTimestamp: cached?.rawTimestamp ?? null,
      };
    }

    // Get most recent reading (first row after headers)
    const latestRow = parsedRows[0];
    const buoyData = transformToBuoyData(latestRow);

    if (!buoyData) {
      return {
        data: cached?.data ?? null,
        error: 'Buoy data unavailable (all values missing)',
        isStale: !!cached,
        rawTimestamp: cached?.rawTimestamp ?? null,
      };
    }

    // Check if data is too old (>48 hours) - treat as no signal
    const dataAge = Date.now() - latestRow.timestamp.getTime();
    if (dataAge > STALE_DATA_THRESHOLD_MS) {
      return {
        data: null,
        error: 'Buoy offline - last reading over 48 hours ago',
        isStale: true,
        rawTimestamp: latestRow.timestamp,
      };
    }

    // Update cache
    cache.set(normalizedId, {
      data: buoyData,
      timestamp: Date.now(),
      rawTimestamp: latestRow.timestamp,
    });

    return {
      data: buoyData,
      error: null,
      isStale: false,
      rawTimestamp: latestRow.timestamp,
    };
  } catch (error) {
    console.error(`Error fetching buoy ${normalizedId}:`, error);
    return {
      data: cached?.data ?? null,
      error: error instanceof Error ? error.message : 'Network error',
      isStale: !!cached,
      rawTimestamp: cached?.rawTimestamp ?? null,
    };
  }
}

// Fetch buoy data for multiple stations in parallel
export async function fetchMultipleBuoyData(
  stationIds: string[]
): Promise<Map<string, BuoyFetchResult>> {
  const results = await Promise.all(
    stationIds.map(async (id) => {
      const result = await fetchBuoyData(id);
      return [id.toUpperCase(), result] as const;
    })
  );
  return new Map(results);
}

// Clear cache (useful for forcing refresh)
export function clearBuoyCache(): void {
  cache.clear();
}

// Get cached data without fetching
export function getCachedBuoyData(stationId: string): BuoyData | null {
  const cached = cache.get(stationId.toUpperCase());
  return cached?.data ?? null;
}
