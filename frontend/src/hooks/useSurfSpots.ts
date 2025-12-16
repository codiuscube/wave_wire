import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapSurfSpot, toDbSurfSpotInsert, toDbSurfSpotUpdate, type SurfSpot } from '../lib/mappers';

type CountryGroup = 'USA' | 'Mexico' | 'Central America' | 'Canada';

interface UseSurfSpotsOptions {
  /** Filter by country group */
  countryGroup?: CountryGroup;
  /** Filter by region */
  region?: string;
  /** Search by name (case-insensitive partial match) */
  search?: string;
  /** Include unverified spots (admin only) */
  includeUnverified?: boolean;
  /** Limit results */
  limit?: number;
}

interface UseSurfSpotsReturn {
  /** The surf spots matching filters */
  spots: SurfSpot[];
  /** Whether the spots are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Total count of matching spots */
  totalCount: number;
  /** Admin: Add a new surf spot */
  addSpot: (spot: Omit<SurfSpot, 'createdAt' | 'updatedAt'>) => Promise<{ data: SurfSpot | null; error: string | null }>;
  /** Admin: Update a surf spot */
  updateSpot: (spotId: string, updates: Partial<Omit<SurfSpot, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<{ error: string | null }>;
  /** Admin: Delete a surf spot */
  deleteSpot: (spotId: string) => Promise<{ error: string | null }>;
  /** Admin: Toggle verified status */
  toggleVerified: (spotId: string, verified: boolean) => Promise<{ error: string | null }>;
}

/**
 * Hook to query the master surf spots table with filters.
 *
 * @param options - Filter and pagination options
 * @returns Surf spots data and admin mutation functions
 *
 * @example
 * ```tsx
 * // Basic usage in AddSpotModal
 * const { spots, isLoading } = useSurfSpots({ countryGroup: 'USA', search: 'pipeline' });
 *
 * // Admin usage
 * const { spots, toggleVerified, deleteSpot } = useSurfSpots({ includeUnverified: true });
 * ```
 */
export function useSurfSpots(options: UseSurfSpotsOptions = {}): UseSurfSpotsReturn {
  const { countryGroup, region, search, includeUnverified = false, limit } = options;

  const [spots, setSpots] = useState<SurfSpot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSpots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from('surf_spots').select('*', { count: 'exact' });

      // Apply filters
      if (!includeUnverified) {
        query = query.eq('verified', true);
      }

      if (countryGroup) {
        query = query.eq('country_group', countryGroup);
      }

      if (region) {
        query = query.eq('region', region);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Order and limit
      query = query.order('name', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setSpots([]);
        setTotalCount(0);
      } else if (data) {
        setSpots(data.map(mapSurfSpot));
        setTotalCount(count ?? data.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [countryGroup, region, search, includeUnverified, limit]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  // Admin mutations
  const addSpot = useCallback(
    async (
      spot: Omit<SurfSpot, 'createdAt' | 'updatedAt'>
    ): Promise<{ data: SurfSpot | null; error: string | null }> => {
      const dbSpot = toDbSurfSpotInsert(spot);

      const { data, error: insertError } = await supabase
        .from('surf_spots')
        .insert(dbSpot)
        .select()
        .single();

      if (insertError) {
        return { data: null, error: insertError.message };
      }

      if (data) {
        const mappedSpot = mapSurfSpot(data);
        setSpots((prev) => [...prev, mappedSpot].sort((a, b) => a.name.localeCompare(b.name)));
        setTotalCount((prev) => prev + 1);
        return { data: mappedSpot, error: null };
      }

      return { data: null, error: 'No data returned' };
    },
    []
  );

  const updateSpot = useCallback(
    async (
      spotId: string,
      updates: Partial<Omit<SurfSpot, 'id' | 'createdAt' | 'updatedAt'>>
    ): Promise<{ error: string | null }> => {
      const dbUpdates = toDbSurfSpotUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('surf_spots')
        .update(dbUpdates)
        .eq('id', spotId)
        .select()
        .single();

      if (updateError) {
        return { error: updateError.message };
      }

      if (data) {
        const mappedSpot = mapSurfSpot(data);
        setSpots((prev) =>
          prev.map((s) => (s.id === spotId ? mappedSpot : s))
        );
      }

      return { error: null };
    },
    []
  );

  const deleteSpot = useCallback(
    async (spotId: string): Promise<{ error: string | null }> => {
      const { error: deleteError } = await supabase
        .from('surf_spots')
        .delete()
        .eq('id', spotId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      setTotalCount((prev) => prev - 1);
      return { error: null };
    },
    []
  );

  const toggleVerified = useCallback(
    async (spotId: string, verified: boolean): Promise<{ error: string | null }> => {
      return updateSpot(spotId, { verified });
    },
    [updateSpot]
  );

  return {
    spots,
    isLoading,
    error,
    refresh: fetchSpots,
    totalCount,
    addSpot,
    updateSpot,
    deleteSpot,
    toggleVerified,
  };
}

export default useSurfSpots;
