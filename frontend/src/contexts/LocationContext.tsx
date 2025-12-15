import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSurfSpots, type SurfSpot } from '../data/surfSpots';
import { calculateDistance } from '../data/noaaBuoys';

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
  const [spot, setSpot] = useState<LocationSpot>(DEFAULT_SPOT);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestLocation = () => {
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
  };

  useEffect(() => {
    // Auto-request location on mount
    requestLocation();
  }, []);

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
