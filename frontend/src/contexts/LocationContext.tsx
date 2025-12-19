import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getSurfSpots, type SurfSpot } from '../data/surfSpots';
import { calculateDistance } from '../data/noaaBuoys';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// Interface for location context (uses lng for legacy compatibility)
interface LocationSpot {
  name: string;
  lat: number;
  lng: number;
  region: string;
}

// Get spots from centralized data
const ALL_SURF_SPOTS = getSurfSpots();

// Default fallback spot
const FALLBACK_SPOT: LocationSpot = { name: "your local break", lat: 0, lng: 0, region: "Unknown" };

interface LocationContextType {
  spot: LocationSpot;
  isLoading: boolean;
  hasPermission: boolean | null;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

/**
 * Find the nearest surf spot to a given coordinate
 */
function findNearestSpot(lat: number, lng: number): LocationSpot {
  let nearest: SurfSpot | null = null;
  let minDistance = Infinity;

  for (const spot of ALL_SURF_SPOTS) {
    const distance = calculateDistance(lat, lng, spot.lat, spot.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = spot;
    }
  }

  if (!nearest) return FALLBACK_SPOT;

  // Convert SurfSpot to LocationSpot (lon -> lng for legacy compatibility)
  return {
    name: nearest.name,
    lat: nearest.lat,
    lng: nearest.lon,
    region: nearest.region,
  };
}

// Default spot before location is determined (find Blacks Beach or fallback to first USA spot)
const DEFAULT_SPOT: LocationSpot = (() => {
  const blacksBeach = ALL_SURF_SPOTS.find(s => s.name.toLowerCase().includes("blacks"));
  const spot = blacksBeach || ALL_SURF_SPOTS.find(s => s.countryGroup === "USA") || ALL_SURF_SPOTS[0];
  if (!spot) return FALLBACK_SPOT;
  return {
    name: spot.name,
    lat: spot.lat,
    lng: spot.lon,
    region: spot.region,
  };
})();

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [spot, setSpot] = useState<LocationSpot>(DEFAULT_SPOT);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Fetch user's first spot (their "home" spot) when logged in
  const fetchUserHomeSpot = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      // Get the user's first spot (ordered by created_at ascending = oldest first = their home)
      const { data, error } = await supabase
        .from('user_spots')
        .select('name, latitude, longitude, region, master_spot_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        // No spots found, use default
        setSpot(DEFAULT_SPOT);
        setIsLoading(false);
        return;
      }

      // If they have a master_spot_id, get the master spot details
      if (data.master_spot_id) {
        const masterSpot = ALL_SURF_SPOTS.find(s => s.id === data.master_spot_id);
        if (masterSpot) {
          setSpot({
            name: data.name || masterSpot.name,
            lat: masterSpot.lat,
            lng: masterSpot.lon,
            region: masterSpot.region,
          });
          setIsLoading(false);
          return;
        }
      }

      // Use the user spot's own coordinates if available
      if (data.latitude && data.longitude) {
        setSpot({
          name: data.name,
          lat: data.latitude,
          lng: data.longitude,
          region: data.region || 'Unknown',
        });
      } else {
        setSpot(DEFAULT_SPOT);
      }
    } catch {
      setSpot(DEFAULT_SPOT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request browser geolocation (only called manually, not on mount)
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestSpot(position.coords.latitude, position.coords.longitude);
        setSpot(nearest);
        setHasPermission(true);
        setIsLoading(false);
      },
      () => {
        setHasPermission(false);
        setIsLoading(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    if (user) {
      // Logged in: fetch user's home spot
      fetchUserHomeSpot(user.id);
    } else {
      // Not logged in: use default fallback (no geolocation prompt)
      setSpot(DEFAULT_SPOT);
      setIsLoading(false);
    }
  }, [user, authLoading, fetchUserHomeSpot]);

  return (
    <LocationContext.Provider value={{ spot, isLoading, hasPermission, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export function useSpotName() {
  const { spot } = useLocation();
  return spot.name;
}
