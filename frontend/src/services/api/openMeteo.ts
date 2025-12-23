import type { ForecastData, SwellComponent } from '../../components/SpotCard';
import type { WaveModel } from '../../types';

// Unit conversion constants
const METERS_TO_FEET = 3.28084;
const KMH_TO_KNOTS = 0.539957;

// Convert degrees to cardinal direction (16-point compass)
const degreesToCardinal = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

// Round to specified decimal places
const round = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// Open-Meteo Marine API response structure
interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
    wave_height?: number[];
    wave_period?: number[];
    wave_direction?: number[];
    swell_wave_height?: number[];
    swell_wave_period?: number[];
    swell_wave_direction?: number[];
    wind_wave_height?: number[];
    wind_wave_period?: number[];
    wind_wave_direction?: number[];
  };
}

// Open-Meteo Weather API response structure
interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    temperature_2m?: number[];
  };
}

// Simple in-memory cache
interface CacheEntry {
  data: ForecastData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Generate cache key from coordinates and model (rounded to reduce cache fragmentation)
const getCacheKey = (lat: number, lon: number, model?: WaveModel): string => {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;
  return `${roundedLat}:${roundedLon}:${model ?? 'best_match'}`;
};

// Build model query parameter for Open-Meteo Marine API
const getModelParam = (model?: WaveModel): string => {
  // Only add models parameter if not best_match (best_match = auto-select)
  if (model && model !== 'best_match') {
    return `&models=${model}`;
  }
  return '';
};

// Find the index for current hour or nearest future hour
const findCurrentHourIndex = (times: string[]): number => {
  const now = new Date();
  const nowHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

  for (let i = 0; i < times.length; i++) {
    const timeDate = new Date(times[i]);
    if (timeDate >= nowHour) {
      return i;
    }
  }
  return 0; // Fallback to first entry
};

// Get index for "tomorrow" (24 hours from now)
const getTomorrowIndex = (times: string[], currentIndex: number): number => {
  return Math.min(currentIndex + 24, times.length - 1);
};

// Get index for "next day" (48 hours from now)
const getNextDayIndex = (times: string[], currentIndex: number): number => {
  return Math.min(currentIndex + 48, times.length - 1);
};

// Extract swell component from response at given index
const extractSwellComponent = (
  hourly: OpenMeteoMarineResponse['hourly'],
  index: number,
  type: 'swell' | 'wind'
): SwellComponent => {
  const heightKey = type === 'swell' ? 'swell_wave_height' : 'wind_wave_height';
  const periodKey = type === 'swell' ? 'swell_wave_period' : 'wind_wave_period';
  const directionKey = type === 'swell' ? 'swell_wave_direction' : 'wind_wave_direction';

  const height = hourly[heightKey]?.[index] ?? 0;
  const period = hourly[periodKey]?.[index] ?? 0;
  const degrees = hourly[directionKey]?.[index] ?? 0;

  return {
    height: round(height * METERS_TO_FEET, 1),
    period: round(period, 0),
    direction: degreesToCardinal(degrees),
    degrees: round(degrees, 0),
  };
};

export interface ForecastFetchResult {
  data: ForecastData | null;
  error: string | null;
  isStale: boolean;
}

// Fetch forecast data for a location
export async function fetchForecastData(
  lat: number,
  lon: number,
  model?: WaveModel
): Promise<ForecastFetchResult> {
  const cacheKey = getCacheKey(lat, lon, model);
  const modelParam = getModelParam(model);

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[OpenMeteo] Cache HIT for:', cacheKey);
    return {
      data: cached.data,
      error: null,
      isStale: false,
    };
  }

  console.log('[OpenMeteo] Cache MISS for:', cacheKey);

  try {
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?` +
      `latitude=${lat}&longitude=${lon}&` +
      `hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction&` +
      `forecast_days=3&timezone=auto${modelParam}`;

    console.log('[OpenMeteo] Fetching forecast data with model:', model ?? 'best_match', 'URL:', marineUrl);

    // Fetch marine data and weather data in parallel
    const [marineResponse, weatherResponse] = await Promise.all([
      fetch(marineUrl),
      fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=wind_speed_10m,wind_direction_10m,temperature_2m&` +
        `forecast_days=3&timezone=auto`
      ),
    ]);

    if (!marineResponse.ok) {
      return {
        data: cached?.data ?? null,
        error: `Marine API error (${marineResponse.status})`,
        isStale: !!cached,
      };
    }

    if (!weatherResponse.ok) {
      return {
        data: cached?.data ?? null,
        error: `Weather API error (${weatherResponse.status})`,
        isStale: !!cached,
      };
    }

    const marineData: OpenMeteoMarineResponse = await marineResponse.json();
    const weatherData: OpenMeteoWeatherResponse = await weatherResponse.json();

    // Find current hour index
    const times = marineData.hourly.time;
    if (!times || times.length === 0) {
      return {
        data: cached?.data ?? null,
        error: 'No forecast data available',
        isStale: !!cached,
      };
    }

    const currentIndex = findCurrentHourIndex(times);

    // Extract swell components
    const primary = extractSwellComponent(marineData.hourly, currentIndex, 'swell');
    const secondary = extractSwellComponent(marineData.hourly, currentIndex, 'wind');

    // Extract wind data
    const windSpeedKmh = weatherData.hourly.wind_speed_10m?.[currentIndex] ?? 0;
    const windDegrees = weatherData.hourly.wind_direction_10m?.[currentIndex] ?? 0;
    const airTempC = weatherData.hourly.temperature_2m?.[currentIndex] ?? 0;

    // Convert units
    const windSpeed = round(windSpeedKmh * KMH_TO_KNOTS, 0);
    const airTemp = round((airTempC * 9 / 5) + 32, 0); // C to F

    const forecastData: ForecastData = {
      primary,
      secondary,
      windSpeed,
      windDirection: degreesToCardinal(windDegrees),
      windDegrees: round(windDegrees, 0),
      tide: 0, // Tide data not available from Open-Meteo
      airTemp,
      tideDirection: '', // Tide direction not available
    };

    // Update cache
    cache.set(cacheKey, {
      data: forecastData,
      timestamp: Date.now(),
    });

    return {
      data: forecastData,
      error: null,
      isStale: false,
    };
  } catch (error) {
    console.error(`Error fetching forecast for ${lat},${lon}:`, error);
    return {
      data: cached?.data ?? null,
      error: error instanceof Error ? error.message : 'Network error',
      isStale: !!cached,
    };
  }
}

// Fetch forecast data with time offset (now, tomorrow, next_day)
export type ForecastTime = 'now' | 'tomorrow' | 'next_day';

export async function fetchForecastDataForTime(
  lat: number,
  lon: number,
  time: ForecastTime,
  model?: WaveModel
): Promise<ForecastFetchResult> {
  const cacheKey = `${getCacheKey(lat, lon, model)}:${time}`;
  const modelParam = getModelParam(model);

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[OpenMeteo] Cache HIT for time fetch:', cacheKey);
    return {
      data: cached.data,
      error: null,
      isStale: false,
    };
  }

  console.log('[OpenMeteo] Cache MISS for time fetch:', cacheKey);

  try {
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?` +
      `latitude=${lat}&longitude=${lon}&` +
      `hourly=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction&` +
      `forecast_days=3&timezone=auto${modelParam}`;

    console.log('[OpenMeteo] Fetching forecast for time:', time, 'model:', model ?? 'best_match', 'URL:', marineUrl);

    // Fetch marine data and weather data in parallel
    const [marineResponse, weatherResponse] = await Promise.all([
      fetch(marineUrl),
      fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}&` +
        `hourly=wind_speed_10m,wind_direction_10m,temperature_2m&` +
        `forecast_days=3&timezone=auto`
      ),
    ]);

    if (!marineResponse.ok || !weatherResponse.ok) {
      return {
        data: cached?.data ?? null,
        error: `API error`,
        isStale: !!cached,
      };
    }

    const marineData: OpenMeteoMarineResponse = await marineResponse.json();
    const weatherData: OpenMeteoWeatherResponse = await weatherResponse.json();

    const times = marineData.hourly.time;
    if (!times || times.length === 0) {
      return {
        data: cached?.data ?? null,
        error: 'No forecast data available',
        isStale: !!cached,
      };
    }

    const currentIndex = findCurrentHourIndex(times);

    // Determine which index to use based on time parameter
    let targetIndex: number;
    switch (time) {
      case 'tomorrow':
        targetIndex = getTomorrowIndex(times, currentIndex);
        break;
      case 'next_day':
        targetIndex = getNextDayIndex(times, currentIndex);
        break;
      default:
        targetIndex = currentIndex;
    }

    // Extract data at target index
    const primary = extractSwellComponent(marineData.hourly, targetIndex, 'swell');
    const secondary = extractSwellComponent(marineData.hourly, targetIndex, 'wind');

    const windSpeedKmh = weatherData.hourly.wind_speed_10m?.[targetIndex] ?? 0;
    const windDegrees = weatherData.hourly.wind_direction_10m?.[targetIndex] ?? 0;
    const airTempC = weatherData.hourly.temperature_2m?.[targetIndex] ?? 0;

    const windSpeed = round(windSpeedKmh * KMH_TO_KNOTS, 0);
    const airTemp = round((airTempC * 9 / 5) + 32, 0);

    const forecastData: ForecastData = {
      primary,
      secondary,
      windSpeed,
      windDirection: degreesToCardinal(windDegrees),
      windDegrees: round(windDegrees, 0),
      tide: 0,
      airTemp,
      tideDirection: '',
    };

    cache.set(cacheKey, {
      data: forecastData,
      timestamp: Date.now(),
    });

    return {
      data: forecastData,
      error: null,
      isStale: false,
    };
  } catch (error) {
    console.error(`Error fetching forecast for ${lat},${lon} (${time}):`, error);
    return {
      data: cached?.data ?? null,
      error: error instanceof Error ? error.message : 'Network error',
      isStale: !!cached,
    };
  }
}

// Fetch forecast data for multiple locations in parallel
export async function fetchMultipleForecastData(
  locations: Array<{ lat: number; lon: number; id?: string }>,
  model?: WaveModel
): Promise<Map<string, ForecastFetchResult>> {
  const results = await Promise.all(
    locations.map(async (loc) => {
      const result = await fetchForecastData(loc.lat, loc.lon, model);
      const key = loc.id ?? getCacheKey(loc.lat, loc.lon, model);
      return [key, result] as const;
    })
  );
  return new Map(results);
}

// Clear forecast cache
export function clearForecastCache(): void {
  cache.clear();
}
