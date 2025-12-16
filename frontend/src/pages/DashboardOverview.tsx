import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SpotCard } from '../components/SpotCard';
import type { Spot } from '../components/SpotCard';
import { AlertsModal } from '../components/dashboard/AlertsModal';
import { Button, OnboardingModal } from '../components/ui';
import { AlertCard } from '../components/dashboard/AlertCard';
import { useMultipleBuoyData } from '../hooks/useBuoyData';
import { useMultipleForecastData } from '../hooks/useForecastData';
import { useAuth } from '../contexts/AuthContext';
import { useUserSpots, useSentAlerts, useProfile } from '../hooks';
import { Loader2, Waves } from 'lucide-react';
import type { UserSpot, SentAlert } from '../lib/mappers';

// Convert UserSpot to base spot format for the dashboard
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

function userSpotToBaseSpot(userSpot: UserSpot): BaseSpot | null {
  // Skip spots without coordinates
  if (!userSpot.latitude || !userSpot.longitude) return null;

  return {
    id: userSpot.id,
    name: userSpot.name,
    region: userSpot.region || 'Unknown Region',
    lat: userSpot.latitude,
    lon: userSpot.longitude,
    buoyId: userSpot.buoyId || undefined,
    status: 'unknown',
    triggersMatched: 0,
    icon: userSpot.icon || undefined,
  };
}

// Convert SentAlert to alert card format
interface AlertCardData {
  id: string;
  spotName: string;
  type: string;
  message: string;
  time: string;
  condition: 'epic' | 'good' | 'fair' | 'poor';
}

function sentAlertToAlertCard(alert: SentAlert): AlertCardData {
  // Map delivery status / alert type to condition
  let condition: 'epic' | 'good' | 'fair' | 'poor' = 'good';
  if (alert.conditionMatched?.toLowerCase().includes('epic')) {
    condition = 'epic';
  } else if (alert.conditionMatched?.toLowerCase().includes('poor')) {
    condition = 'poor';
  } else if (alert.conditionMatched?.toLowerCase().includes('fair')) {
    condition = 'fair';
  }

  return {
    id: alert.id,
    spotName: alert.spotId || 'Unknown Spot', // Would need to join with spots for name
    type: alert.alertType || 'Alert',
    message: alert.messageContent || 'No message content',
    time: alert.sentAt || alert.createdAt || new Date().toISOString(),
    condition,
  };
}



export function DashboardOverview() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { profile, isLoading: profileLoading, refresh: refreshProfile } = useProfile(user?.id);
  // Admins automatically get premium tier access
  const tier = isAdmin ? 'premium' : (profile?.subscriptionTier || 'free');

  const [searchParams, setSearchParams] = useSearchParams();

  // Fetch user's spots from DB
  const {
    spots: dbSpots,
    isLoading: spotsLoading,
    error: spotsError,
    refresh: refreshSpots,
  } = useUserSpots(user?.id, tier);

  // Fetch recent alerts from DB
  const {
    alerts: dbAlerts,
    isLoading: alertsLoading,
  } = useSentAlerts(user?.id, { limit: 5 });

  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Convert DB spots to base spots format
  const baseSpots: BaseSpot[] = useMemo(() => {
    return dbSpots
      .map(userSpotToBaseSpot)
      .filter((spot): spot is BaseSpot => spot !== null);
  }, [dbSpots]);

  // Convert DB alerts to alert card format
  const recentAlerts: AlertCardData[] = useMemo(() => {
    return dbAlerts.map(sentAlertToAlertCard);
  }, [dbAlerts]);

  // Extract unique buoy IDs from spots
  const buoyIds = useMemo(() => {
    const ids = baseSpots
      .map((spot) => spot.buoyId)
      .filter((id): id is string => !!id);
    return [...new Set(ids)];
  }, [baseSpots]);

  // Extract locations for forecast data
  const forecastLocations = useMemo(() => {
    return baseSpots.map((spot) => ({
      lat: spot.lat,
      lon: spot.lon,
      id: spot.id,
    }));
  }, [baseSpots]);

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
  }, [baseSpots, buoyDataMap, forecastDataMap]);

  // Loading state
  if (authLoading || profileLoading || spotsLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (spotsError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="tech-card border-destructive p-6">
          <p className="text-destructive">Error loading dashboard: {spotsError}</p>
        </div>
      </div>
    );
  }

  // Show onboarding if incomplete (and not admin) OR if forced by URL param
  const forceShowOnboarding = searchParams.get('onboarding') === 'true';
  const showOnboarding = (!!profile && !profile.onboardingCompleted && !isAdmin) || (isAdmin && forceShowOnboarding);

  const handleOnboardingClose = () => {
    // Remove query param
    searchParams.delete('onboarding');
    setSearchParams(searchParams);

    refreshProfile();
    refreshSpots();
  };

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
            {alertsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="font-mono text-sm text-muted-foreground">No alerts yet</p>
                <p className="font-mono text-xs text-muted-foreground/60 mt-1">
                  Alerts will appear here when your triggers match conditions
                </p>
              </div>
            )}
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
            {userSpots.length > 0 ? (
              <div className="space-y-4">
                {userSpots.map((spot) => (
                  <SpotCard key={spot.id} spot={spot} buoyLoading={buoyLoading} forecastLoading={forecastLoading} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/20 mb-6 border border-border/50">
                  <Waves className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="font-mono text-sm text-muted-foreground">No spots configured</p>
                <p className="font-mono text-xs text-muted-foreground/60 mt-1 mb-4">
                  Add spots to start monitoring conditions
                </p>
                <Button variant="rogue-secondary" className="px-4 py-2" onClick={() => window.location.href = '/spots'}>
                  ADD_SPOTS
                </Button>
              </div>
            )}
          </div>
        </div>
        <AlertsModal
          isOpen={showAlertsModal}
          onClose={() => setShowAlertsModal(false)}
          initialAlerts={recentAlerts}
        />
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
        />
      </div>
    </div>
  );
}

