import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotCard } from '../components/SpotCard';
import type { Spot } from '../components/SpotCard';
import { AlertsModal } from '../components/dashboard/AlertsModal';
import { Button, OnboardingModal } from '../components/ui';
import { AlertCard } from '../components/dashboard/AlertCard';
import { useMultipleBuoyData } from '../hooks/useBuoyData';
import { useMultipleForecastData } from '../hooks/useForecastData';
import { useAuth } from '../contexts/AuthContext';
import { useUserSpots, useSentAlerts, useMinimumLoading } from '../hooks';
import { AddCircle } from '@solar-icons/react';
import type { UserSpot, SentAlert } from '../lib/mappers';
import { DnaLogo } from '../components/ui/DnaLogo';

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
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
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
  const isLoading = useMinimumLoading(authLoading || spotsLoading);

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <DnaLogo className="w-16 h-16" />
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


    refreshSpots();
  };

  return (
    <div className="relative p-4 min-h-[calc(100vh-4rem)] flex flex-col items-center">
      {/* Background Tech Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Header - Centered */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
            // OPERATIONAL_OVERVIEW
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="DASHBOARD">
            DASHBOARD
          </h1>
          <p className="font-mono text-muted-foreground text-sm sm:text-base border-muted px-4">
            Monitor raw data feeds across your designated spots.
          </p>
        </div>

        {/* Recent Alerts Section */}
        <div className="w-full mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-destructive animate-pulse rounded-full" />
              <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Recent Wire Intercepts</h2>
            </div>
            {recentAlerts.length > 0 && (
              <Button
                onClick={() => setShowAlertsModal(true)}
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-[10px] uppercase font-mono text-muted-foreground hover:text-primary tracking-wider"
              >
                VIEW ALL LOGS
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {alertsLoading ? (
              <div className="flex items-center justify-center py-8">
                <DnaLogo className="w-10 h-10" />
              </div>
            ) : recentAlerts.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {recentAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-destructive/50 transition-colors group-hover:bg-destructive z-10 rounded-l" />
                      <AlertCard alert={alert} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="border border-dashed border-border/50 bg-secondary/5 rounded-lg p-6 text-center">
                <p className="font-mono text-xs text-muted-foreground">No recent intercepts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Your Spots Section */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary animate-pulse rounded-full" />
              <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Live Feeds</h2>
            </div>
            {/* Optional: Add simplified action buttons here or rely on Spot Cards */}
          </div>

          <div className="space-y-4 pb-20">
            {userSpots.length > 0 ? (
              <AnimatePresence>
                {userSpots.map((spot, index) => (
                  <motion.div
                    key={spot.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="relative group"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/50 transition-colors group-hover:bg-primary z-10 rounded-l" />
                    <SpotCard spot={spot} buoyLoading={buoyLoading} forecastLoading={forecastLoading} />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="w-full border border-dashed border-border/50 bg-secondary/5 rounded-lg p-12 flex flex-col items-center justify-center text-center">
                <div className="mb-6">
                  <DnaLogo className="w-16 h-16" />
                </div>
                <h3 className="font-mono text-xl font-bold uppercase mb-3 text-foreground">No Spots Configured</h3>
                <p className="text-muted-foreground text-sm font-mono max-w-sm mb-8 leading-relaxed">
                  Add spots to start monitoring conditions.
                </p>
                <Button variant="rogue-secondary" className="px-4 py-2" onClick={() => window.location.href = '/spots'}>
                  <AddCircle weight="Bold" size={16} className="mr-2" />
                  ADD TARGET SPOTS
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
    </div >
  );
}
