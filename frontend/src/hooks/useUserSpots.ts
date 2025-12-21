

type SubscriptionTier = 'free' | 'pro' | 'premium';

const SPOT_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  pro: Infinity, // Free (Beta) - same as premium during beta
  premium: Infinity,
};

interface UseUserSpotsReturn {
  /** The user's spots */
  spots: UserSpot[];
  /** Whether the spots are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Whether the user can add another spot based on their tier */
  canAddSpot: boolean;
  /** Current spot count */
  spotCount: number;
  /** Maximum spots allowed for tier */
  spotLimit: number;
  /** Add a new spot */
  addSpot: (spot: Omit<UserSpot, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => Promise<{ data: UserSpot | null; error: string | null }>;
  /** Update an existing spot */
  updateSpot: (spotId: string, updates: Partial<Omit<UserSpot, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<{ error: string | null }>;
  /** Delete a spot */
  deleteSpot: (spotId: string) => Promise<{ error: string | null }>;
  /** Reorder spots (local only) */
  reorderSpots: (reorderedSpots: UserSpot[]) => Promise<{ error: string | null }>;
  /** Save spot order to database */
  saveSpotOrder: (orderedSpots: UserSpot[]) => Promise<{ error: string | null }>;
}

/**
 * Hook to manage a user's tracked surf spots with tier-based limits.
 *
 * @param userId - The user's ID
 * @param tier - The user's subscription tier (determines spot limit)
 * @returns User spots data and CRUD functions
 *
 * @example
 * ```tsx
 * const { spots, canAddSpot, addSpot, deleteSpot } = useUserSpots(user.id, 'free');
 *
 * if (!canAddSpot) {
 *   return <UpgradePrompt />;
 * }
 * ```
 */
export function useUserSpots(
  userId: string | undefined,
  tier: SubscriptionTier = 'free'
): UseUserSpotsReturn {
  const [spots, setSpots] = useState<UserSpot[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  const spotLimit = SPOT_LIMITS[tier];
  const spotCount = spots.length;
  const canAddSpot = spotCount < spotLimit;

  const fetchSpots = useCallback(async () => {
    if (!userId) {
      setSpots([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_spots')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setSpots([]);
      } else if (data) {
        setSpots(data.map(mapUserSpot));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  const addSpot = useCallback(
    async (
      spot: Omit<UserSpot, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sortOrder'>
    ): Promise<{ data: UserSpot | null; error: string | null }> => {
      if (!userId) {
        return { data: null, error: 'No user ID provided' };
      }

      // Frontend validation for better UX
      if (!canAddSpot) {
        return {
          data: null,
          error: `You've reached the ${tier} tier limit of ${spotLimit} spot${spotLimit === 1 ? '' : 's'}. Upgrade to add more.`,
        };
      }

      // New spots go at the end (highest sort_order)
      const maxSortOrder = spots.length > 0 ? Math.max(...spots.map(s => s.sortOrder)) + 1 : 0;
      const dbSpot = toDbUserSpotInsert({ ...spot, userId, sortOrder: maxSortOrder });

      const { data, error: insertError } = await supabase
        .from('user_spots')
        .insert(dbSpot)
        .select()
        .single();

      if (insertError) {
        // Handle server-side spot limit trigger error
        if (insertError.message.includes('spot maximum')) {
          return { data: null, error: insertError.message };
        }
        return { data: null, error: insertError.message };
      }

      if (data) {
        const mappedSpot = mapUserSpot(data);
        setSpots((prev) => [...prev, mappedSpot]);
        return { data: mappedSpot, error: null };
      }

      return { data: null, error: 'No data returned' };
    },
    [userId, canAddSpot, tier, spotLimit, spots]
  );

  const updateSpot = useCallback(
    async (
      spotId: string,
      updates: Partial<Omit<UserSpot, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const dbUpdates = toDbUserSpotUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('user_spots')
        .update(dbUpdates)
        .eq('id', spotId)
        .eq('user_id', userId) // Ensure user owns the spot
        .select()
        .single();

      if (updateError) {
        return { error: updateError.message };
      }

      if (data) {
        const mappedSpot = mapUserSpot(data);
        setSpots((prev) =>
          prev.map((s) => (s.id === spotId ? mappedSpot : s))
        );
      }

      return { error: null };
    },
    [userId]
  );

  const deleteSpot = useCallback(
    async (spotId: string): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const { error: deleteError } = await supabase
        .from('user_spots')
        .delete()
        .eq('id', spotId)
        .eq('user_id', userId); // Ensure user owns the spot

      if (deleteError) {
        return { error: deleteError.message };
      }

      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      return { error: null };
    },
    [userId]
  );

  // Save function - persists order to DB
  const saveSpotOrder = useCallback(
    async (orderedSpots: UserSpot[]) => {
      if (!userId) return { error: 'No user ID' };

      // Update all spots in parallel for speed
      const updates = orderedSpots.map((spot, index) =>
        supabase
          .from('user_spots')
          .update({ sort_order: index })
          .eq('id', spot.id)
          .eq('user_id', userId)
      );

      const results = await Promise.all(updates);
      const firstError = results.find(r => r.error)?.error;

      if (firstError) {
        console.error('Error saving spot order', firstError);
        // Revert on error
        await fetchSpots();
        return { error: firstError.message };
      }

      return { error: null };
    },
    [userId, fetchSpots]
  );

  const reorderSpots = useCallback(
    async (reorderedSpots: UserSpot[]): Promise<{ error: string | null }> => {
      // Immediate local state update for smooth UI
      setSpots(reorderedSpots);
      return { error: null };
    },
    []
  );

  return {
    spots,
    isLoading,
    error,
    refresh: fetchSpots,
    canAddSpot,
    spotCount,
    spotLimit,
    addSpot,
    updateSpot,
    deleteSpot,
    reorderSpots,
    saveSpotOrder,
  };
}

export default useUserSpots;
