import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { mapSurfSession, toDbSurfSessionInsert, toDbSurfSessionUpdate, type SurfSession } from '../lib/mappers';
import { showError } from '../lib/toast';

interface UseSurfSessionsReturn {
  /** The user's surf sessions */
  sessions: SurfSession[];
  /** Whether the sessions are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  /** Add a new surf session */
  addSession: (session: Omit<SurfSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<{ data: SurfSession | null; error: string | null }>;
  /** Update an existing surf session */
  updateSession: (sessionId: string, updates: Partial<Omit<SurfSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<{ error: string | null }>;
  /** Delete a surf session */
  deleteSession: (sessionId: string) => Promise<{ error: string | null }>;
  /** Get sessions filtered by quality (for trigger integration) */
  getGoodSessions: () => SurfSession[];
}

/**
 * Hook to manage a user's surf sessions.
 *
 * @param userId - The user's ID
 * @param spotId - Optional spot ID to filter sessions by
 * @returns Sessions data and CRUD functions
 *
 * @example
 * ```tsx
 * const { sessions, addSession, deleteSession } = useSurfSessions(user.id);
 *
 * // Get only good/epic sessions for trigger fill
 * const goodSessions = getGoodSessions();
 * ```
 */
export function useSurfSessions(
  userId: string | undefined,
  spotId?: string
): UseSurfSessionsReturn {
  const [sessions, setSessions] = useState<SurfSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('surf_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('session_date', { ascending: false });

      // Filter by spot if provided
      if (spotId) {
        query = query.eq('spot_id', spotId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        showError('Failed to load surf sessions');
        setSessions([]);
      } else if (data) {
        setSessions(data.map(mapSurfSession));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId, spotId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const addSession = useCallback(
    async (
      session: Omit<SurfSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<{ data: SurfSession | null; error: string | null }> => {
      if (!userId) {
        return { data: null, error: 'No user ID provided' };
      }

      const dbSession = toDbSurfSessionInsert({ ...session, userId });

      const { data, error: insertError } = await supabase
        .from('surf_sessions')
        .insert(dbSession)
        .select()
        .single();

      if (insertError) {
        showError('Failed to add surf session');
        return { data: null, error: insertError.message };
      }

      if (data) {
        const mappedSession = mapSurfSession(data);
        setSessions((prev) => [mappedSession, ...prev]);
        return { data: mappedSession, error: null };
      }

      return { data: null, error: 'No data returned' };
    },
    [userId]
  );

  const updateSession = useCallback(
    async (
      sessionId: string,
      updates: Partial<Omit<SurfSession, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const dbUpdates = toDbSurfSessionUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('surf_sessions')
        .update(dbUpdates)
        .eq('id', sessionId)
        .eq('user_id', userId) // Ensure user owns the session
        .select()
        .single();

      if (updateError) {
        showError('Failed to update surf session');
        return { error: updateError.message };
      }

      if (data) {
        const mappedSession = mapSurfSession(data);
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? mappedSession : s))
        );
      }

      return { error: null };
    },
    [userId]
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<{ error: string | null }> => {
      if (!userId) {
        return { error: 'No user ID provided' };
      }

      const { error: deleteError } = await supabase
        .from('surf_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId); // Ensure user owns the session

      if (deleteError) {
        showError('Failed to delete surf session');
        return { error: deleteError.message };
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return { error: null };
    },
    [userId]
  );

  const getGoodSessions = useCallback(() => {
    return sessions.filter((s) => s.quality === 'good' || s.quality === 'epic');
  }, [sessions]);

  return {
    sessions,
    isLoading,
    error,
    refresh: fetchSessions,
    addSession,
    updateSession,
    deleteSession,
    getGoodSessions,
  };
}

export default useSurfSessions;
