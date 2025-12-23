import { useState, useEffect, useCallback } from 'react';
import { fetchBuoyData, type BuoyFetchResult } from '../services/api';
import type { BuoyData } from '../components/SpotCard';

interface UseBuoyDataOptions {
  /** Refresh interval in milliseconds. Set to 0 to disable auto-refresh. */
  refreshInterval?: number;
  /** Whether to fetch data immediately on mount */
  fetchOnMount?: boolean;
}

interface UseBuoyDataReturn {
  /** The buoy data, or null if not yet loaded */
  data: BuoyData | null;
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether the current data is stale (from cache) */
  isStale: boolean;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Raw timestamp of the buoy reading */
  rawTimestamp: Date | null;
}

const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to fetch and manage NOAA buoy data for a single station.
 *
 * @param stationId - The NOAA station ID (e.g., "42035")
 * @param options - Configuration options
 * @returns Buoy data state and controls
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refresh } = useBuoyData('42035');
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * if (data) return <BuoyDisplay data={data} />;
 * ```
 */
export function useBuoyData(
  stationId: string | undefined,
  options: UseBuoyDataOptions = {}
): UseBuoyDataReturn {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    fetchOnMount = true,
  } = options;

  const [data, setData] = useState<BuoyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [rawTimestamp, setRawTimestamp] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!stationId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result: BuoyFetchResult = await fetchBuoyData(stationId);

      setData(result.data);
      setError(result.error);
      setIsStale(result.isStale);
      setRawTimestamp(result.rawTimestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [stationId]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchData, fetchOnMount]);

  // Set up refresh interval
  useEffect(() => {
    if (!stationId || refreshInterval <= 0) return;

    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [stationId, refreshInterval, fetchData]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refresh: fetchData,
    rawTimestamp,
  };
}

/**
 * Hook to fetch buoy data for multiple stations.
 *
 * @param stationIds - Array of NOAA station IDs
 * @param options - Configuration options
 * @returns Map of station ID to buoy data state
 *
 * @example
 * ```tsx
 * const buoyDataMap = useMultipleBuoyData(['42035', '42020']);
 * const galvestonData = buoyDataMap.get('42035');
 * ```
 */
export function useMultipleBuoyData(
  stationIds: string[],
  options: UseBuoyDataOptions = {}
): {
  data: Map<string, BuoyData | null>;
  isLoading: boolean;
  errors: Map<string, string | null>;
  refresh: () => Promise<void>;
} {
  const {
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    fetchOnMount = true,
  } = options;

  const [data, setData] = useState<Map<string, BuoyData | null>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, string | null>>(new Map());

  const fetchAllData = useCallback(async () => {
    if (stationIds.length === 0) {
      setData(new Map());
      setErrors(new Map());
      return;
    }

    console.log('[useBuoyData] Fetching data for stations:', stationIds);
    setIsLoading(true);

    try {
      const results = await Promise.all(
        stationIds.map(async (id) => {
          const result = await fetchBuoyData(id);
          console.log(`[useBuoyData] Result for ${id}:`, { hasData: !!result.data, error: result.error });
          return { id: id.toUpperCase(), result };
        })
      );

      const newData = new Map<string, BuoyData | null>();
      const newErrors = new Map<string, string | null>();

      for (const { id, result } of results) {
        newData.set(id, result.data);
        newErrors.set(id, result.error);
      }

      setData(newData);
      setErrors(newErrors);
    } catch (err) {
      console.error('Error fetching multiple buoy data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [stationIds.join(',')]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchAllData();
    }
  }, [fetchAllData, fetchOnMount]);

  // Set up refresh interval
  useEffect(() => {
    if (stationIds.length === 0 || refreshInterval <= 0) return;

    const intervalId = setInterval(fetchAllData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [stationIds.length, refreshInterval, fetchAllData]);

  return {
    data,
    isLoading,
    errors,
    refresh: fetchAllData,
  };
}

export default useBuoyData;
