import { useState } from "react";
import { Target, AddCircle, TrashBinMinimalistic, AltArrowDown, DangerTriangle, MapPoint } from '@solar-icons/react';
import {
  Button,
  AddSpotModal,
  UpgradeModal,
} from "../components/ui";
import { DnaLogo } from "../components/ui/DnaLogo";
import { IconPickerModal, AVAILABLE_ICONS } from "../components/ui/IconPickerModal";
import type { SpotOption } from "../components/ui";
import {
  getRecommendedBuoysWithScoring,
  formatDistance,
  type BuoyRecommendation,
} from "../data/noaaBuoys";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useUserSpots, useProfile, useMinimumLoading } from "../hooks";
import type { UserSpot } from "../lib/mappers";

// Convert UserSpot (DB) to SpotOption (UI)
function userSpotToSpotOption(userSpot: UserSpot): SpotOption {
  return {
    id: userSpot.id,
    name: userSpot.name,
    region: userSpot.region || undefined,
    lat: userSpot.latitude || undefined,
    lon: userSpot.longitude || undefined,
    buoyId: userSpot.buoyId || undefined,
    icon: userSpot.icon || undefined,
  };
}

export function SpotPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);
  // Admins automatically get premium tier access
  const tier = isAdmin ? 'premium' : (profile?.subscriptionTier || 'free');

  const {
    spots: userSpots,
    isLoading: dataLoading,
    error,
    canAddSpot,
    spotCount,
    spotLimit,
    addSpot: addUserSpot,
    updateSpot: updateUserSpot,
    deleteSpot: deleteUserSpot,
  } = useUserSpots(user?.id, tier);

  // Convert DB spots to UI format
  const mySpots: SpotOption[] = userSpots.map(userSpotToSpotOption);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSpotId, setExpandedSpotId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Icon Picker State
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [selectedSpotForIcon, setSelectedSpotForIcon] = useState<string | null>(null);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const isSpotSaved = (spotId: string) => mySpots.some((s) => s.id === spotId);

  const addSpot = async (spot: SpotOption) => {
    if (!isSpotSaved(spot.id) && canAddSpot) {
      const { error } = await addUserSpot({
        name: spot.name,
        latitude: spot.lat || null,
        longitude: spot.lon || null,
        region: spot.region || null,
        buoyId: spot.buoyId || null,
        icon: spot.icon || null,
        masterSpotId: spot.id, // Link to master surf_spots table
      });
      if (error) {
        console.error('Error adding spot:', error);
      }
    }
  };

  const removeSpot = async (spotId: string) => {
    setIsDeleting(spotId);
    const { error } = await deleteUserSpot(spotId);
    if (error) {
      console.error('Error removing spot:', error);
    }
    setIsDeleting(null);
  };

  const assignBuoy = async (spotId: string, buoy: BuoyRecommendation) => {
    const { error } = await updateUserSpot(spotId, {
      buoyId: buoy.id,
    });
    if (error) {
      console.error('Error assigning buoy:', error);
    }
    setExpandedSpotId(null);
  };

  // Get recommended buoys for a specific spot using swell-aware scoring
  const getSpotBuoys = (spot: SpotOption): BuoyRecommendation[] => {
    if (spot.lat === undefined || spot.lon === undefined) {
      return [];
    }
    // Pass region and country for exposure-based scoring
    return getRecommendedBuoysWithScoring(
      spot.lat,
      spot.lon,
      spot.region || '',
      (spot as any).country || '',
      500,
      10
    );
  };



  const updateSpotIcon = async (iconName: string) => {
    if (!selectedSpotForIcon) return;
    const { error } = await updateUserSpot(selectedSpotForIcon, { icon: iconName });
    if (error) {
      console.error('Error updating icon:', error);
    }
  };

  // Loading state
  const isLoading = useMinimumLoading(authLoading || profileLoading || dataLoading);

  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <DnaLogo className="w-16 h-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="tech-card border-destructive p-6">
          <p className="text-destructive">Error loading spots: {error}</p>
        </div>
      </div>
    );
  }

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
            // MY_SPOTS
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="HOMEBREAK">
            HOMEBREAK
          </h1>
          <p className="font-mono text-muted-foreground text-sm sm:text-base border-muted px-4">
            Configure your spots and buoy sources.
          </p>

          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="font-mono text-xs text-muted-foreground bg-secondary/10 px-2 py-1 rounded">
              {spotCount} / {spotLimit === Infinity ? '∞' : spotLimit} spots active
            </span>
          </div>
        </div>

        {/* Tier Limit Warning - Clickable to open upgrade modal */}
        {!canAddSpot && (
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="w-full mb-6 p-4 border border-amber-500/50 bg-amber-500/10 flex items-start gap-3 rounded-md hover:bg-amber-500/20 hover:border-amber-500 transition-all cursor-pointer text-left group"
          >
            <DangerTriangle weight="Bold" size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-mono text-sm text-amber-500 font-medium">Spot Limit Reached</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Free (Limited) allows {spotLimit} spot{spotLimit === 1 ? '' : 's'}. <span className="underline underline-offset-2 group-hover:text-amber-500 transition-colors">Click to upgrade to Free (Beta)</span>
              </p>
            </div>
          </button>
        )}

        {/* Spots List */}
        <div className="w-full space-y-4 mb-8">
          {mySpots.length > 0 ? (
            <AnimatePresence>
              {mySpots.map((spot, index) => (
                <motion.div
                  key={spot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="group relative overflow-hidden border border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                >
                  {/* Side Accent Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/50 transition-colors group-hover:bg-primary" />
                  {/* Spot Header */}
                  <div className="flex items-center justify-between p-4 sm:p-5 gap-4 border-b border-border/10">
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        onClick={() => {
                          setSelectedSpotForIcon(spot.id);
                          setIsIconModalOpen(true);
                        }}
                        className="h-12 w-12 shrink-0 flex items-center justify-center rounded-md border border-cyan-500/50 bg-cyan-950/30 text-cyan-50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] backdrop-blur-sm ring-1 ring-cyan-500/20 group/icon hover:bg-cyan-950/40 transition-all cursor-pointer"
                        title="Change Icon"
                      >
                        {(() => {
                          const IconComponent = spot.icon && AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
                            ? AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
                            : Target;
                          return <IconComponent weight="BoldDuotone" size={24} className="text-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)] transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:text-cyan-300" />;
                        })()}
                      </button>
                      <div className="min-w-0">
                        <h4 className="font-mono font-bold text-lg uppercase tracking-tight text-foreground truncate">{spot.name}</h4>
                        <div className="flex items-center gap-2 text-muted-foreground/70">
                          <MapPoint weight="Bold" size={12} />
                          <p className="font-mono text-xs uppercase tracking-wide">
                            {spot.region}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeSpot(spot.id)}
                      disabled={isDeleting === spot.id}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                      title="Remove target"
                    >
                      {isDeleting === spot.id ? (
                        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-current rounded-full animate-spin" />
                      ) : (
                        <TrashBinMinimalistic weight="Bold" size={20} />
                      )}
                    </button>
                  </div>

                  {/* Buoy Section */}
                  <div className="p-4 sm:p-5 bg-secondary/5">
                    {spot.buoyId ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider shrink-0 px-1.5 py-0.5 border border-border/30 bg-background/50">
                            LINKED BUOY
                          </div>

                          {/* Stale Data Indicator */}
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${!spot.buoy?.timestamp || (new Date().getTime() - new Date(spot.buoy.timestamp).getTime() > 24 * 60 * 60 * 1000)
                              ? "bg-red-500"
                              : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              }`}
                            title={spot.buoy?.timestamp ? `Data from: ${new Date(spot.buoy.timestamp).toLocaleString()}` : "No data timestamp"}
                          />

                          <a
                            href={`https://www.ndbc.noaa.gov/station_page.php?station=${spot.buoyId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm font-bold text-foreground/80 hover:text-primary transition-colors truncate"
                          >
                            {spot.buoyName || `Station ${spot.buoyId}`}
                          </a>
                        </div>
                        <button
                          onClick={() => setExpandedSpotId(expandedSpotId === spot.id ? null : spot.id)}
                          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider underline underline-offset-4 decoration-dotted"
                        >
                          [ RECONFIGURE ]
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setExpandedSpotId(expandedSpotId === spot.id ? null : spot.id)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-dashed border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all group/btn bg-background/50"
                      >
                        <span className="font-mono text-sm uppercase tracking-wide group-hover/btn:tracking-wider transition-all">ASSIGN BUOY SOURCE</span>
                        <AltArrowDown weight="Bold" size={16} className={`transition-transform ${expandedSpotId === spot.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {/* Buoy Selector Dropdown */}
                    {expandedSpotId === spot.id && (
                      <div className="mt-4 border border-border/50 bg-background z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 border-b border-border/30 bg-secondary/10">
                          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                            Nearest Signal Sources
                          </span>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {getSpotBuoys(spot).map((buoy, index) => (
                            <button
                              key={buoy.id}
                              onClick={() => assignBuoy(spot.id, buoy)}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors border-l-2 ${spot.buoyId === buoy.id
                                ? "bg-primary/5 text-primary border-primary"
                                : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground border-transparent hover:border-primary/50"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs text-muted-foreground/50 w-4">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <span className="font-mono font-bold mr-2 text-xs">{buoy.id}</span>
                                    <span className="font-mono text-xs uppercase opacity-80">
                                      {buoy.name}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-mono text-xs text-muted-foreground/60 shrink-0 ml-2 bg-secondary/20 px-1 py-0.5 rounded">
                                  {formatDistance(buoy.distance)}
                                </span>
                              </div>
                            </button>
                          ))}
                          {getSpotBuoys(spot).length === 0 && (
                            <div className="px-4 py-6 text-center text-muted-foreground/50 font-mono text-xs">
                              No signal sources found within range
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            /* Empty State */
            <div className="w-full border border-dashed border-border/50 bg-secondary/5 rounded-lg p-12 flex flex-col items-center justify-center text-center">
              <div className="mb-6">
                <DnaLogo className="w-16 h-16" />
              </div>
              <h3 className="font-mono text-xl font-bold uppercase mb-3 text-foreground">No Spots Configured</h3>
              <p className="text-muted-foreground text-sm font-mono max-w-sm mb-8 leading-relaxed">
                Add your home breaks to begin monitoring swell conditions.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="rogue-secondary"
                disabled={!canAddSpot}
                className="h-auto py-3 px-8"
              >
                <AddCircle weight="Bold" size={16} className="mr-2" />
                ADD TARGET SPOTS
              </Button>
            </div>
          )}
        </div>

        {/* Add Spot Button (Only show if we have spots, otherwise empty state handles it) */}
        {mySpots.length > 0 && (
          <div className="flex justify-center pb-20">
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="rogue-secondary"
              disabled={!canAddSpot}
              className="h-auto py-3 px-8"
            >
              <AddCircle weight="Bold" size={16} className="mr-2" />
              ADD TARGET SPOTS
            </Button>
          </div>
        )}

      </div>

      {/* Add Spot Modal */}
      <AddSpotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        savedSpots={mySpots}
        onAddSpot={addSpot}
      />

      <IconPickerModal
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        onSelectIcon={updateSpotIcon}
        currentIcon={selectedSpotForIcon ? mySpots.find(s => s.id === selectedSpotForIcon)?.icon : undefined}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature="spots"
        currentTier={tier as 'free' | 'pro' | 'premium'}
      />
    </div>
  );
}
