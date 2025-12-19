import { useState } from "react";
import { Link } from "react-router-dom";
import { AddCircle, TrashBinMinimalistic, MapPoint, Pen, AltArrowDown, Lock, InfoCircle } from '@solar-icons/react';
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useProfile, useUserSpots, useTriggers } from "../hooks";
import {
  Button,
  TriggerModal,
  Badge,
} from "../components/ui";
import type { TriggerTier } from "../types";
import type { Trigger } from "../lib/mappers";
import { generateTriggerSummary } from "../lib/triggerUtils";

// Fixed condition slots in priority order
const CONDITION_SLOTS = ['epic', 'good', 'fair'] as const;
type ConditionType = typeof CONDITION_SLOTS[number];

const conditionConfig: Record<ConditionType, { label: string; color: string; icon: string; description: string }> = {
  epic: {
    label: 'EPIC',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    icon: '🔥',
    description: 'Drop everything conditions'
  },
  good: {
    label: 'GOOD',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    icon: '🤙',
    description: 'Worth the drive'
  },
  fair: {
    label: 'FAIR',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    icon: '👍',
    description: 'Rideable, no pressure'
  },
};

// Convert DB Trigger to UI TriggerTier
const toTriggerTier = (t: Trigger): TriggerTier => ({
  id: t.id,
  name: t.name,
  emoji: t.emoji || '🌊',
  condition: (t.condition as 'fair' | 'good' | 'epic') || 'good',
  minHeight: t.minHeight ?? 0,
  maxHeight: t.maxHeight ?? 15,
  minPeriod: t.minPeriod ?? 0,
  maxPeriod: t.maxPeriod ?? 20,
  minWindSpeed: t.minWindSpeed ?? 0,
  maxWindSpeed: t.maxWindSpeed ?? 20,
  minWindDirection: t.minWindDirection ?? 0,
  maxWindDirection: t.maxWindDirection ?? 360,
  minSwellDirection: t.minSwellDirection ?? 0,
  maxSwellDirection: t.maxSwellDirection ?? 360,
  tideType: (t.tideType as 'rising' | 'falling' | 'any') || 'any',
  minTideHeight: t.minTideHeight ?? -2,
  maxTideHeight: t.maxTideHeight ?? 6,
  spotId: t.spotId,
  messageTemplate: t.messageTemplate || '',
  notificationStyle: t.notificationStyle as 'local' | 'hype' | 'custom' | undefined,
});

// Convert UI TriggerTier to DB Trigger format (for insert/update)
const fromTriggerTier = (t: TriggerTier): Omit<Trigger, 'id' | 'userId' | 'createdAt' | 'updatedAt'> => ({
  spotId: t.spotId,
  name: t.name,
  emoji: t.emoji,
  condition: t.condition,
  minHeight: t.minHeight,
  maxHeight: t.maxHeight,
  minPeriod: t.minPeriod,
  maxPeriod: t.maxPeriod,
  minWindSpeed: t.minWindSpeed,
  maxWindSpeed: t.maxWindSpeed,
  minWindDirection: t.minWindDirection,
  maxWindDirection: t.maxWindDirection,
  minSwellDirection: t.minSwellDirection,
  maxSwellDirection: t.maxSwellDirection,
  tideType: t.tideType,
  minTideHeight: t.minTideHeight,
  maxTideHeight: t.maxTideHeight,
  messageTemplate: t.messageTemplate,
  notificationStyle: t.notificationStyle || null,
  priority: null,
});

export function TriggersPage() {
  const { user, isAdmin } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);

  // Admins get premium tier
  const tier = isAdmin ? 'premium' : (profile?.subscriptionTier || 'free');

  // Get user's spots for the spot selector
  const { spots: userSpots, isLoading: spotsLoading } = useUserSpots(user?.id, tier);

  // Get user's triggers
  const {
    triggers,
    isLoading: triggersLoading,
    canAddTrigger,
    triggerLimit,
    addTrigger,
    updateTrigger,
    deleteTrigger,
  } = useTriggers(user?.id, tier);

  const [selectedSpotId, setSelectedSpotId] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<TriggerTier | undefined>(undefined);
  const [lockedCondition, setLockedCondition] = useState<ConditionType | undefined>(undefined);
  const [autofillData, setAutofillData] = useState<Partial<TriggerTier> | undefined>(undefined);

  // Spot Selector Dropdown State
  const [isSpotDropdownOpen, setIsSpotDropdownOpen] = useState(false);

  const isLoading = profileLoading || spotsLoading || triggersLoading;
  const hasSpots = userSpots.length > 0;

  // Set default selected spot when spots load - REMOVED to allow "center" state
  // if (hasSpots && !selectedSpotId && userSpots[0]) {
  //   setSelectedSpotId(userSpots[0].id);
  // }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Get triggers for selected spot
  const spotTriggers = selectedSpotId
    ? triggers.filter((t) => t.spotId === selectedSpotId).map(toTriggerTier)
    : [];

  // Create a map of condition -> trigger for easy lookup
  const triggersByCondition = new Map<ConditionType, TriggerTier>();
  spotTriggers.forEach(t => {
    triggersByCondition.set(t.condition, t);
  });

  // Calculate how many triggers user has filled for this spot
  const filledSlotCount = spotTriggers.length;

  const handleCreateTrigger = (condition: ConditionType) => {
    // Find an existing trigger to use as autofill source
    const existingTrigger = spotTriggers[0];

    setEditingTrigger(undefined);
    setLockedCondition(condition);
    setAutofillData(existingTrigger ? {
      // Copy settings from existing trigger, but not the ID, name, or condition
      minHeight: existingTrigger.minHeight,
      maxHeight: existingTrigger.maxHeight,
      minPeriod: existingTrigger.minPeriod,
      maxPeriod: existingTrigger.maxPeriod,
      minWindSpeed: existingTrigger.minWindSpeed,
      maxWindSpeed: existingTrigger.maxWindSpeed,
      minWindDirection: existingTrigger.minWindDirection,
      maxWindDirection: existingTrigger.maxWindDirection,
      minSwellDirection: existingTrigger.minSwellDirection,
      maxSwellDirection: existingTrigger.maxSwellDirection,
      tideType: existingTrigger.tideType,
      minTideHeight: existingTrigger.minTideHeight,
      maxTideHeight: existingTrigger.maxTideHeight,
      notificationStyle: existingTrigger.notificationStyle,
    } : undefined);
    setIsModalOpen(true);
  };

  const handleEditTrigger = (trigger: TriggerTier) => {
    setEditingTrigger(trigger);
    setLockedCondition(trigger.condition); // Lock condition during edit too
    setAutofillData(undefined);
    setIsModalOpen(true);
  };

  const handleSaveTrigger = async (triggerData: TriggerTier) => {
    const dbTrigger = fromTriggerTier(triggerData);

    // Check if it's an update or new
    const existingTrigger = triggers.find(t => t.id === triggerData.id);

    if (existingTrigger) {
      // Update existing
      const { error } = await updateTrigger(triggerData.id, dbTrigger);
      if (error) {
        console.error('Error updating trigger:', error);
      }
    } else {
      // Create new
      const { error } = await addTrigger(dbTrigger);
      if (error) {
        console.error('Error adding trigger:', error);
      }
    }
    setIsModalOpen(false);
    setLockedCondition(undefined);
    setAutofillData(undefined);
  };

  const handleDeleteTrigger = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this trigger?")) {
      const { error } = await deleteTrigger(id);
      if (error) {
        console.error('Error deleting trigger:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTrigger(undefined);
    setLockedCondition(undefined);
    setAutofillData(undefined);
  };

  // Convert UserSpot to SurfSpot-like format for the spot selector and modal
  const selectedSpot = userSpots.find((s) => s.id === selectedSpotId);
  const spotForModal = selectedSpot ? {
    id: selectedSpot.id,
    name: selectedSpot.name,
    lat: selectedSpot.latitude ?? 0,
    lon: selectedSpot.longitude ?? 0,
    buoyId: selectedSpot.buoyId ?? '',
    timezone: 'America/Chicago', // Default timezone
    region: selectedSpot.region ?? undefined,
  } : undefined;

  // Check if user can add more triggers (tier limit)
  const canAddMoreTriggers = canAddTrigger;

  return (
    <div className="relative p-4 min-h-[calc(100vh-4rem)] flex flex-col items-center">

      {/* Background Tech Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Header - Always Visible */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
            // CONFIGURATION_PARAMETERS
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="TRIGGERS">
            TRIGGERS
          </h1>
          <p className="font-mono text-muted-foreground text-sm sm:text-base border-muted px-4">
            Define surf conditions that trigger alerts.
          </p>
        </div>

        {/* Spot Selector - Centered initially, stays top when spot selected */}
        <div className="w-full relative z-20 mb-8">
          {hasSpots ? (
            <div className="relative w-full max-w-sm mx-auto">
              <label className="text-xs font-bold font-mono uppercase mb-2 block tracking-wider text-center text-muted-foreground">
                Spot Select
              </label>

              <div className="relative group">
                {/* Dropdown Button */}
                <button
                  onClick={() => setIsSpotDropdownOpen(!isSpotDropdownOpen)}
                  className={`
                    w-full flex items-center justify-between px-6 py-4 
                    bg-card/80 backdrop-blur-md border border-border/50 
                    text-foreground transition-all duration-200
                    hover:border-primary/50 hover:shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]
                    ${isSpotDropdownOpen ? 'border-primary ring-1 ring-primary/20' : ''}
                    ${!selectedSpot ? 'text-muted-foreground' : ''}
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MapPoint weight="Bold" size={16} className={`shrink-0 ${selectedSpot ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-mono text-sm uppercase truncate font-bold tracking-wide">
                      {selectedSpot ? selectedSpot.name : "Select Target Spot"}
                    </span>
                  </div>
                  <AltArrowDown weight="Bold" size={16} className={`shrink-0 transition-transform duration-200 ${isSpotDropdownOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isSpotDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 z-50 max-h-60 overflow-y-auto shadow-2xl rounded-none"
                    >
                      {userSpots.map((spot) => (
                        <button
                          key={spot.id}
                          onClick={() => {
                            setSelectedSpotId(spot.id);
                            setIsSpotDropdownOpen(false);
                          }}
                          className={`
                            w-full text-left px-4 py-3 font-mono text-sm uppercase transition-colors
                            flex items-center justify-between
                            ${selectedSpotId === spot.id
                              ? 'bg-primary/5 text-primary border-l-2 border-primary'
                              : 'text-muted-foreground border-l-2 border-transparent hover:bg-secondary/20 hover:text-foreground'
                            }
                          `}
                        >
                          <span>{spot.name}</span>
                          {selectedSpotId === spot.id && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selection Indicator Line */}
              {selectedSpot && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-4"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Link to="/dashboard/spot">
                <Button variant="rogue-secondary" className="font-mono uppercase text-xs">
                  <AddCircle weight="Bold" size={12} className="mr-2" />
                  Create Target Spot First
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Drawer Reveal - Triggers List */}
        <AnimatePresence mode="wait">
          {selectedSpot && (
            <motion.div
              key="trigger-drawer"
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full overflow-hidden"
            >
              {/* Info Banner if empty */}
              {filledSlotCount === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8 p-8 border border-dashed border-border/50 bg-secondary/5 flex flex-col items-center justify-center text-center rounded-lg"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <InfoCircle weight="BoldDuotone" size={24} />
                  </div>
                  <h3 className="font-mono text-lg font-bold uppercase mb-2 text-foreground">No Triggers Configured</h3>
                  <p className="font-mono text-sm text-muted-foreground max-w-sm mb-6">
                    Configure triggers to get alerted when conditions for {selectedSpot?.name} are met.
                  </p>

                  <Button
                    variant="rogue-secondary"
                    onClick={() => handleCreateTrigger('good')}
                    className="font-mono text-xs"
                  >
                    <AddCircle weight="Bold" size={12} className="mr-2" />
                    START WITH 'GOOD'
                  </Button>
                </motion.div>
              )}

              {/* The 3 Slots */}
              <div className="space-y-3 pb-20">
                {CONDITION_SLOTS.map((condition, index) => {
                  const config = conditionConfig[condition];
                  const trigger = triggersByCondition.get(condition);
                  const isLocked = !canAddMoreTriggers && !trigger;
                  const showUpgradePrompt = isLocked && tier === 'free' && filledSlotCount >= triggerLimit;

                  return (
                    <motion.div
                      key={condition}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                      className={`
                        group relative overflow-hidden border transition-all duration-300
                        ${trigger
                          ? `bg-card/60 backdrop-blur-sm ${config.color.split(' ')[2] || 'border-border/60'} hover:border-primary/50`
                          : 'bg-transparent border-border/30 border-dashed hover:border-border/60 hover:bg-secondary/5'
                        }
                      `}
                    >
                      {/* Active Trigger Content */}
                      {trigger ? (
                        <div
                          onClick={() => handleEditTrigger(trigger)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4 cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110">
                              {trigger.emoji}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={`font-mono text-[10px] uppercase border px-1.5 py-0 rounded-none ${config.color}`}>
                                  {config.label}
                                </Badge>
                                <h3 className="font-mono font-bold text-base uppercase tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                                  {trigger.name}
                                </h3>
                              </div>
                              <div className="font-mono text-xs text-muted-foreground line-clamp-1 group-hover:text-muted-foreground/80">
                                <span dangerouslySetInnerHTML={{ __html: generateTriggerSummary(trigger) }} />
                              </div>
                            </div>
                          </div>

                          {/* Actions - Visible on hover/always on mobile */}
                          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTrigger(trigger);
                              }}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary/20 transition-colors"
                            >
                              <Pen weight="Bold" size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteTrigger(trigger.id, e)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <TrashBinMinimalistic weight="Bold" size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Empty/Locked Slot Content
                        <div className="p-4 sm:p-5 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 flex items-center justify-center border border-border/30 bg-secondary/10 text-xl text-muted-foreground/50 ${showUpgradePrompt ? 'opacity-50' : ''}`}>
                              {config.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="font-mono text-[10px] uppercase border px-1.5 py-0 rounded-none border-border/40 text-muted-foreground/50">
                                  {config.label} -- EMPTY
                                </Badge>
                                {showUpgradePrompt && (
                                  <span className="flex items-center text-[10px] text-amber-500 font-mono">
                                    <Lock weight="Bold" size={12} className="mr-1" />
                                    PREMIUM
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-xs text-muted-foreground/40 uppercase">
                                {config.description}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant="rogue-secondary"
                            size="sm"
                            disabled={showUpgradePrompt}
                            onClick={() => handleCreateTrigger(condition)}
                            className={`
                              font-mono uppercase text-[10px] h-8
                              ${showUpgradePrompt ? 'hidden' : ''}
                            `}
                          >
                            <AddCircle weight="Bold" size={12} className="mr-2" />
                            Configure
                          </Button>
                        </div>
                      )}

                      {/* Side Accent Line */}
                      <div className={`
                        absolute left-0 top-0 bottom-0 w-0.5 transition-colors
                        ${trigger ? config.color.split(' ')[0].replace('/10', '') : 'bg-transparent'}
                      `} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <TriggerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveTrigger}
        spotId={selectedSpotId}
        spot={spotForModal}
        triggerToEdit={editingTrigger}
        lockedCondition={lockedCondition}
        autofillData={autofillData}
      />
    </div>
  );
}
