import { useState, useEffect, useCallback } from 'react';
import {
  fetchTideDataForLocation,
  type TideData,
} from '../services/api';

interface UseTideDataOptions {
  /** Refresh interval in milliseconds. Set to 0 to disable auto-refresh. */
  refreshInterval?: number;
  /** Whether to fetch data immediately on mount */
  fetchOnMount?: boolean;
}

interface UseTideDataReturn {
  /** The tide data, or null if not yet loaded */
  data: TideData | null;
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether the current data is stale (from cache) */
  isStale: boolean;
  /** Distance to tide station in miles */
  stationDistance: number | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
}

const DEFAULT_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour (tide predictions rarely change)

/**
 * Hook to fetch and manage NOAA tide data for a location.
 *
 * @param lat - Latitude of the location
 * @param lon - Longitude of the location
 * @param options - Configuration options
 * @returns Tide data state and controls
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTideData(32.82, -117.28);
 *
 * if (isLoading) return <Spinner />;
 * if (data) {
 *   console.log(`Current: ${data.currentHeight}ft ${data.currentDirection}`);
 *   console.log(`Next: ${data.nextEvent?.type} @ ${data.nextEvent?.time}`);
 * }
 * ```
 */
export function useTideData(
  lat: number | undefined,
  lon: number | undefined,
  options: UseTideDataOptions = {}
): UseTideDataReturn {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    fetchOnMount = true,
  } = options;

  const [data, setData] = useState<TideData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [stationDistance, setStationDistance] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (lat === undefined || lon === undefined) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetchTideDataForLocation(lat, lon);

      setData(result.data);
      setError(result.error);
      setIsStale(result.isStale);
      setStationDistance(result.stationDistance ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [lat, lon]);

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
    stationDistance,
    refresh: fetchData,
  };
}

/**
 * Hook to fetch tide data for multiple locations.
 */
export function useMultipleTideData(
  locations: Array<{ lat: number; lon: number; id?: string }>,
  options: UseTideDataOptions = {}
): {
  data: Map<string, TideData | null>;
  isLoading: boolean;
  errors: Map<string, string | null>;
  refresh: () => Promise<void>;
} {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    fetchOnMount = true,
  } = options;

  const [data, setData] = useState<Map<string, TideData | null>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, string | null>>(new Map());

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
          const result = await fetchTideDataForLocation(loc.lat, loc.lon);
          const key = loc.id ?? `${loc.lat.toFixed(2)}:${loc.lon.toFixed(2)}`;
          return { key, result };
        })
      );

      const newData = new Map<string, TideData | null>();
      const newErrors = new Map<string, string | null>();

      for (const { key, result } of results) {
        newData.set(key, result.data);
        newErrors.set(key, result.error);
      }

      setData(newData);
      setErrors(newErrors);
    } catch (err) {
      console.error('Error fetching multiple tide data:', err);
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

export default useTideData;
