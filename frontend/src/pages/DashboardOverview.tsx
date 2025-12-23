import { useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { SpotCard } from '../components/SpotCard';
import type { Spot } from '../components/SpotCard';
import { AlertsModal } from '../components/dashboard/AlertsModal';
import { Button, OnboardingModal } from '../components/ui';
import { AlertCard } from '../components/dashboard/AlertCard';
import { useMultipleBuoyData } from '../hooks/useBuoyData';
import { useMultipleForecastData } from '../hooks/useForecastData';
import { useAuth } from '../contexts/AuthContext';
import { useUserSpots, useSentAlerts, useMinimumLoading } from '../hooks';
import { AddCircle, MenuDots, CheckCircle, MinusCircle, Target } from '@solar-icons/react';
import { AVAILABLE_ICONS } from '../components/ui/IconPickerModal';
import type { UserSpot, SentAlert } from '../lib/mappers';
import { DnaLogo } from '../components/ui/DnaLogo';

// Convert UserSpot to base spot format for the dashboard
interface BaseSpot {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  /** Offshore latitude for wave model queries */
  oceanLat?: number;
  /** Offshore longitude for wave model queries */
  oceanLon?: number;
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
    oceanLat: userSpot.oceanLat ?? undefined,
    oceanLon: userSpot.oceanLon ?? undefined,
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

function sentAlertToAlertCard(alert: SentAlert, spotNames: Map<string, string>): AlertCardData {
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
    spotName: (alert.spotId && spotNames.get(alert.spotId)) || 'Unknown Spot',
    type: alert.alertType || 'Alert',
    message: alert.messageContent || 'No message content',
    time: alert.sentAt || alert.createdAt || new Date().toISOString(),
    condition,
  };
}

// Draggable Dashboard Card Component
interface DraggableDashboardCardProps {
  spot: Spot;
  userSpot: UserSpot;
  buoyLoading: boolean;
  forecastLoading: boolean;
  isReordering: boolean;
  onToggleVisibility: () => void;
}

function DraggableDashboardCard({
  spot,
  userSpot,
  buoyLoading,
  forecastLoading,
  isReordering,
  onToggleVisibility,
}: DraggableDashboardCardProps) {
  const controls = useDragControls();
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerRef = useRef<React.PointerEvent | null>(null);

  const handleLongPressStart = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    pointerRef.current = e;
    longPressTimeout.current = setTimeout(() => {
      if (pointerRef.current) {
        controls.start(pointerRef.current);
      }
    }, 400);
  }, [controls]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    pointerRef.current = null;
  }, []);

  const isHidden = userSpot.hiddenOnDashboard;

  return (
    <Reorder.Item
      value={userSpot}
      dragListener={false}
      dragControls={controls}
      layout="position"
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      dragElastic={0}
      dragMomentum={false}
      className="group relative flex"
      whileDrag={{
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 50,
        cursor: "grabbing"
      }}
    >
      {/* Drag Handle - visible in reorder mode */}
      {isReordering && (
        <div
          className="flex items-center justify-center px-2 py-4 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground active:text-primary transition-colors select-none"
          onPointerDown={(e) => {
            e.preventDefault();
            controls.start(e);
          }}
          style={{ touchAction: 'none' }}
        >
          <div className="flex -space-x-3">
            <MenuDots weight="Bold" size={16} className="rotate-90" />
            <MenuDots weight="Bold" size={16} className="rotate-90" />
          </div>
        </div>
      )}

      {/* Card Container */}
      <div
        className="flex-1 relative"
        onPointerDown={handleLongPressStart}
        onPointerUp={handleLongPressEnd}
        onPointerCancel={handleLongPressEnd}
        onPointerLeave={handleLongPressEnd}
      >
        {/* Side Accent Line */}
        <div className={`absolute left-0 top-0 bottom-0 w-0.5 transition-colors z-10 rounded-l ${isHidden ? 'bg-muted-foreground/20' : 'bg-primary/50 group-hover:bg-primary'}`} />

        {isReordering ? (
          /* Reorder mode - always collapsed view */
          <div className={`border backdrop-blur-sm p-4 flex items-center justify-between ${isHidden ? 'border-border/10 bg-card/10 opacity-40' : 'border-border/30 bg-card/60'}`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-md border ${isHidden ? 'border-muted-foreground/10 bg-muted/10 text-muted-foreground/30' : 'border-cyan-500/50 bg-cyan-950/30 text-cyan-400'}`}>
                {(() => {
                  const IconComponent = spot.icon && AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
                    ? AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
                    : Target;
                  return <IconComponent weight="BoldDuotone" size={24} />;
                })()}
              </div>
              <p className={`font-mono font-bold text-lg tracking-tight truncate uppercase ${isHidden ? 'text-muted-foreground/40' : 'text-foreground'}`}>{spot.name}</p>
            </div>
            <button
              onClick={onToggleVisibility}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-2 rounded transition-colors ${isHidden
                  ? 'bg-muted/50 text-primary hover:bg-primary hover:text-primary-foreground hover:opacity-100'
                  : 'bg-muted text-muted-foreground hover:bg-destructive/20 hover:text-destructive'
                }`}
              title={isHidden ? "Show on dashboard" : "Hide from dashboard"}
            >
              {isHidden ? (
                <AddCircle weight="Outline" size={20} />
              ) : (
                <MinusCircle weight="Bold" size={20} />
              )}
            </button>
          </div>
        ) : (
          /* Normal mode - full SpotCard (only visible items shown) */
          <SpotCard spot={spot} buoyLoading={buoyLoading} forecastLoading={forecastLoading} />
        )}
      </div>
    </Reorder.Item>
  );
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
    reorderSpots,
    saveSpotOrder,
    toggleSpotVisibility,
  } = useUserSpots(user?.id, tier);

  // Fetch recent alerts from DB
  const {
    alerts: dbAlerts,
    isLoading: alertsLoading,
  } = useSentAlerts(user?.id, { limit: 5 });

  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Filter spots for display based on reorder mode
  const visibleDbSpots = useMemo(() => {
    if (isReordering) {
      // Show all spots in reorder mode (including hidden ones)
      return dbSpots;
    }
    // In normal mode, filter out hidden spots
    return dbSpots.filter(spot => !spot.hiddenOnDashboard);
  }, [dbSpots, isReordering]);

  // Convert visible DB spots to base spots format
  const baseSpots: BaseSpot[] = useMemo(() => {
    return visibleDbSpots
      .map(userSpotToBaseSpot)
      .filter((spot): spot is BaseSpot => spot !== null);
  }, [visibleDbSpots]);

  // Create spot names lookup map
  const spotNamesMap = useMemo(() => {
    return new Map(dbSpots.map(s => [s.id, s.name]));
  }, [dbSpots]);

  // Convert DB alerts to alert card format
  const recentAlerts: AlertCardData[] = useMemo(() => {
    return dbAlerts.map(alert => sentAlertToAlertCard(alert, spotNamesMap));
  }, [dbAlerts, spotNamesMap]);

  // Extract unique buoy IDs from visible spots
  const buoyIds = useMemo(() => {
    const ids = baseSpots
      .map((spot) => spot.buoyId)
      .filter((id): id is string => !!id);
    return [...new Set(ids)];
  }, [baseSpots]);

  // Extract locations for forecast data from visible spots
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
  // TODO: Re-enable onboarding when ready
  const forceShowOnboarding = searchParams.get('onboarding') === 'true';
  const showOnboarding = forceShowOnboarding; // Temporarily disabled - was: (!!profile && !profile.onboardingCompleted && !isAdmin) || (isAdmin && forceShowOnboarding);

  const handleOnboardingClose = () => {
    // Remove query param
    searchParams.delete('onboarding');
    setSearchParams(searchParams);


    refreshSpots();
  };

  // Handle reorder mode toggle - save order when exiting
  const handleReorderToggle = async () => {
    if (isReordering) {
      // Exiting reorder mode - save the current order
      await saveSpotOrder(dbSpots);
    }
    setIsReordering(!isReordering);
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
                className="h-auto py-1 px-2 text-xs uppercase font-mono text-muted-foreground hover:text-primary tracking-wider"
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
                <p className="font-mono text-xs text-muted-foreground">No recent wires.</p>
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

            {/* Reorder Button */}
            {dbSpots.length > 1 && (
              <button
                onClick={handleReorderToggle}
                className={`font-mono text-xs px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${isReordering
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/10 text-muted-foreground hover:text-foreground hover:bg-secondary/20'
                  }`}
              >
                {isReordering ? (
                  <>
                    <CheckCircle weight="Bold" size={12} />
                    Done
                  </>
                ) : (
                  <>
                    <MenuDots weight="Bold" size={12} className="rotate-90" />
                    Reorder
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-4 pb-20">
            {userSpots.length > 0 ? (
              isReordering ? (
                // Reorder mode - use Reorder.Group with all spots (including hidden)
                <Reorder.Group
                  axis="y"
                  values={visibleDbSpots}
                  onReorder={reorderSpots}
                  className="space-y-4"
                >
                  {visibleDbSpots.map((dbSpot) => {
                    const baseSpot = userSpotToBaseSpot(dbSpot);
                    if (!baseSpot) return null;

                    const buoyData = baseSpot.buoyId
                      ? buoyDataMap.get(baseSpot.buoyId.toUpperCase())
                      : null;
                    const forecastData = forecastDataMap.get(baseSpot.id);

                    const spot: Spot = {
                      ...baseSpot,
                      buoy: buoyData ?? undefined,
                      forecast: forecastData ?? undefined,
                    };

                    return (
                      <DraggableDashboardCard
                        key={dbSpot.id}
                        spot={spot}
                        userSpot={dbSpot}
                        buoyLoading={buoyLoading}
                        forecastLoading={forecastLoading}
                        isReordering={isReordering}
                        onToggleVisibility={() => toggleSpotVisibility(dbSpot.id)}
                      />
                    );
                  })}
                </Reorder.Group>
              ) : (
                // Normal mode - use AnimatePresence with visible spots only
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
              )
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
                  ADD SPOTS
                </Button>
              </div>
            )}
          </div>
        </div>

        <AlertsModal
          isOpen={showAlertsModal}
          onClose={() => setShowAlertsModal(false)}
          userId={user?.id}
          spotNames={new Map(dbSpots.map(s => [s.id, s.name]))}
        />
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
        />
      </div>
    </div >
  );
}
