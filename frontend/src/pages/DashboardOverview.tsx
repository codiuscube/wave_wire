import { useState, useMemo } from 'react';
import { SpotCard } from '../components/SpotCard';
import type { Spot } from '../components/SpotCard';
import { AlertsModal } from '../components/dashboard/AlertsModal';
import { Button } from '../components/ui';
import { AlertCard } from '../components/dashboard/AlertCard';
import { useMultipleBuoyData } from '../hooks/useBuoyData';
import { useMultipleForecastData } from '../hooks/useForecastData';

// Base spot data - would come from Supabase in production
// Buoy and forecast data will be fetched live via hooks
interface BaseSpot {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  buoyId?: string;
  buoyName?: string;
  status?: 'epic' | 'good' | 'fair' | 'poor' | 'unknown';
  triggersMatched?: number;
  nextCheck?: string;
  icon?: string;
}

const baseSpots: BaseSpot[] = [
  {
    id: 'hogans',
    name: 'Hogans',
    region: 'San Diego County',
    lat: 32.820789,
    lon: -117.280503,
    buoyId: '46225',
    buoyName: 'Torrey Pines Outer',
    status: 'unknown',
    triggersMatched: 0,
    nextCheck: '6:00 AM',
    icon: 'Star',
  },
  {
    id: 'swamis',
    name: 'Swamis',
    region: 'San Diego County',
    lat: 33.034470,
    lon: -117.292324,
    buoyId: '46254',
    buoyName: 'Oceanside Offshore',
    status: 'unknown',
    triggersMatched: 0,
    nextCheck: '6:30 AM',
    icon: 'Radio',
  },
  {
    id: 'trestles',
    name: 'Trestles',
    region: 'Orange County',
    lat: 33.3825,
    lon: -117.5889,
    buoyId: '46086',
    buoyName: 'San Clemente Basin',
    status: 'unknown',
    triggersMatched: 0,
    nextCheck: '6:00 AM',
    icon: 'Waves',
  },
  {
    id: 'huntington',
    name: 'Huntington Beach',
    region: 'Orange County',
    lat: 33.6553,
    lon: -118.0053,
    buoyId: '46253',
    buoyName: 'Newport Beach',
    status: 'unknown',
    triggersMatched: 0,
    nextCheck: '6:00 AM',
    icon: 'Sun',
  },
  {
    id: 'bob-hall',
    name: 'Bob Hall Pier',
    region: 'Texas Gulf Coast',
    lat: 27.5806,
    lon: -97.2167,
    buoyId: '42020',
    buoyName: 'Corpus Christi (25nm E)',
    status: 'unknown',
    triggersMatched: 0,
    nextCheck: '7:00 AM',
    icon: 'Anchor',
  },
  {
    id: 'hanalei',
    name: 'Hanalei Bay',
    region: 'Kauai, Hawaii',
    lat: 22.2089,
    lon: -159.5031,
    buoyId: '51201',
    buoyName: 'Waimea Bay',
    status: 'unknown',
    triggersMatched: 0,
    nextCheck: '5:00 AM',
    icon: 'Palmtree',
  },
];

const recentAlerts = [
  {
    id: '1',
    spotName: 'Swamis',
    type: 'Pop-Up Alert',
    message: 'Swamis is firing! 5ft sets, offshore wind. GO NOW!',
    time: '2025-12-14T14:32:00Z',
    condition: 'epic' as const,
  },
  {
    id: '2',
    spotName: 'Hogans',
    type: 'Morning Check',
    message: 'Good conditions expected. 4ft @ 11s from the SW.',
    time: '2025-12-14T06:15:00Z',
    condition: 'good' as const,
  },
  {
    id: '3',
    spotName: 'Bob Hall Pier',
    type: 'Night Before',
    message: 'Tomorrow looking fun. Swell building overnight.',
    time: '2025-12-13T20:45:00Z',
    condition: 'good' as const,
  },
];



export function DashboardOverview() {
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Extract unique buoy IDs from spots
  const buoyIds = useMemo(() => {
    const ids = baseSpots
      .map((spot) => spot.buoyId)
      .filter((id): id is string => !!id);
    return [...new Set(ids)];
  }, []);

  // Extract locations for forecast data
  const forecastLocations = useMemo(() => {
    return baseSpots.map((spot) => ({
      lat: spot.lat,
      lon: spot.lon,
      id: spot.id,
    }));
  }, []);

  // Fetch live buoy data
  const {
    data: buoyDataMap,
    isLoading: buoyLoading,
  } = useMultipleBuoyData(buoyIds);

  // Fetch live forecast data
  const {
    data: forecastDataMap,
    isLoading: forecastLoading,
  } = useMultipleForecastData(forecastLocations);

  // Merge live data with base spots
  const userSpots: Spot[] = useMemo(() => {
    return baseSpots.map((baseSpot) => {
      const buoyData = baseSpot.buoyId
        ? buoyDataMap.get(baseSpot.buoyId.toUpperCase())
        : null;
      const forecastData = forecastDataMap.get(baseSpot.id);

      return {
        ...baseSpot,
        buoy: buoyData ?? undefined,
        forecast: forecastData ?? undefined,
      };
    });
  }, [buoyDataMap, forecastDataMap]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 lg:mb-12">
        <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
          // OPERATIONAL_OVERVIEW
        </div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="DASHBOARD">
          Dashboard
        </h1>
        <p className="font-mono text-muted-foreground text-base sm:text-lg border-l-2 border-muted pl-4">
          Monitor raw data feeds across your designated spots.
        </p>
      </div>

      {/* Recent Alerts */}
      <div className="mb-8 lg:mb-12">
        <div className="tech-card rounded-lg bg-card/50 backdrop-blur-md">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-destructive animate-pulse" />
              <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">Recent Wire Intercepts</h2>
            </div>
            <Button
              onClick={() => setShowAlertsModal(true)}
              variant="rogue-secondary"
              className="px-4 py-2"
            >
              VIEW_LOGS
            </Button>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Spots Status */}
      <div>
        <div className="tech-card rounded-lg bg-card/50 backdrop-blur-md">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-primary animate-pulse" />
              <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">YOUR_SPOTS</h2>
            </div>
            <div className="flex gap-4">
              <Button variant="rogue-secondary" className="px-4 py-2">
                EDIT_SPOTS
              </Button>
              <Button variant="rogue-secondary" className="px-4 py-2">
                EDIT_TRIGGERS
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {userSpots.map((spot) => (
                <SpotCard key={spot.id} spot={spot} buoyLoading={buoyLoading} forecastLoading={forecastLoading} />
              ))}
            </div>
          </div>
        </div>
        <AlertsModal
          isOpen={showAlertsModal}
          onClose={() => setShowAlertsModal(false)}
          initialAlerts={recentAlerts}
        />
      </div>
    </div>
  );
}

