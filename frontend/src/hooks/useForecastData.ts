import { useState, useEffect, useCallback } from 'react';
import {
  fetchForecastData,
  fetchForecastDataForTime,
  type ForecastFetchResult,
  type ForecastTime,
} from '../services/api';
import type { ForecastData } from '../components/SpotCard';

interface UseForecastDataOptions {
  /** Refresh interval in milliseconds. Set to 0 to disable auto-refresh. */
  refreshInterval?: number;
  /** Whether to fetch data immediately on mount */
  fetchOnMount?: boolean;
  /** Forecast time period: 'now', 'tomorrow', or 'next_day' */
  time?: ForecastTime;
}

interface UseForecastDataReturn {
  /** The forecast data, or null if not yet loaded */
  data: ForecastData | null;
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether the current data is stale (from cache) */
  isStale: boolean;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
}

const DEFAULT_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to fetch and manage Open-Meteo forecast data for a location.
 *
 * @param lat - Latitude of the location
 * @param lon - Longitude of the location
 * @param options - Configuration options
 * @returns Forecast data state and controls
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refresh } = useForecastData(28.944, -95.291);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * if (data) return <ForecastDisplay data={data} />;
 * ```
 */
export function useForecastData(
  lat: number | undefined,
  lon: number | undefined,
  options: UseForecastDataOptions = {}
): UseForecastDataReturn {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    fetchOnMount = true,
    time = 'now',
  } = options;

  const [data, setData] = useState<ForecastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetchData = useCallback(async () => {
    if (lat === undefined || lon === undefined) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      let result: ForecastFetchResult;

      if (time === 'now') {
        result = await fetchForecastData(lat, lon);
      } else {
        result = await fetchForecastDataForTime(lat, lon, time);
      }

      setData(result.data);
      setError(result.error);
      setIsStale(result.isStale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon, time]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchData, fetchOnMount]);

  // Set up refresh interval
  useEffect(() => {
    if (lat === undefined || lon === undefined || refreshInterval <= 0) return;

    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [lat, lon, refreshInterval, fetchData]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refresh: fetchData,
  };
}

/**
 * Hook to fetch forecast data for multiple locations.
 *
 * @param locations - Array of locations with lat/lon and optional id
 * @param options - Configuration options
 * @returns Map of location key to forecast data state
 *
 * @example
 * ```tsx
 * const forecastMap = useMultipleForecastData([
 *   { lat: 28.944, lon: -95.291, id: 'surfside' },
 *   { lat: 29.301, lon: -94.788, id: 'galveston' },
 * ]);
 * const surfsideForecast = forecastMap.get('surfside');
 * ```
 */
export function useMultipleForecastData(
  locations: Array<{ lat: number; lon: number; id?: string }>,
  options: UseForecastDataOptions = {}
): {
  data: Map<string, ForecastData | null>;
  isLoading: boolean;
  errors: Map<string, string | null>;
  refresh: () => Promise<void>;
} {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    fetchOnMount = true,
  } = options;

  const [data, setData] = useState<Map<string, ForecastData | null>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, string | null>>(new Map());

  // Create a stable key for the locations array
  const locationsKey = locations
    .map((l) => `${l.id ?? ''}:${l.lat}:${l.lon}`)
    .join('|');

  const fetchAllData = useCallback(async () => {
    if (locations.length === 0) {
      setData(new Map());
      setErrors(new Map());
      return;
    }

    setIsLoading(true);

    try {
      const results = await Promise.all(
        locations.map(async (loc) => {
          const result = await fetchForecastData(loc.lat, loc.lon);
          const key = loc.id ?? `${loc.lat.toFixed(2)}:${loc.lon.toFixed(2)}`;
          return { key, result };
        })
      );

      const newData = new Map<string, ForecastData | null>();
      const newErrors = new Map<string, string | null>();

      for (const { key, result } of results) {
        newData.set(key, result.data);
        newErrors.set(key, result.error);
      }

      setData(newData);
      setErrors(newErrors);
    } catch (err) {
      console.error('Error fetching multiple forecast data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [locationsKey]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchAllData();
    }
  }, [fetchAllData, fetchOnMount]);

  // Set up refresh interval
  useEffect(() => {
    if (locations.length === 0 || refreshInterval <= 0) return;

    const intervalId = setInterval(fetchAllData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [locations.length, refreshInterval, fetchAllData]);

  return {
    data,
    isLoading,
    errors,
    refresh: fetchAllData,
  };
}

export default useForecastData;
