import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, GripVertical, Info, Radar, MapPin, Edit2, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  Button,
  TriggerModal,
  Badge,
} from "../components/ui";
import type { TriggerTier, SurfSpot } from "../types";
import { generateTriggerSummary } from "../lib/triggerUtils";

// Mock spots - in real app this would come from context/store
const userSpots: SurfSpot[] = [
  {
    id: "surfside",
    name: "Surfside Beach",
    buoyId: "42035",
    lat: 29.2,
    lon: -95.2, // Added longitude
    timezone: "America/Chicago", // Added timezone
    region: "Texas",
    country: "United States" // Changed from USA to match string matching logic better
  },
  {
    id: "galveston",
    name: "Galveston (61st St)",
    buoyId: "42035",
    lat: 29.2,
    lon: -94.8,
    timezone: "America/Chicago",
    region: "Texas",
    country: "United States"
  },
  {
    id: "bob-hall",
    name: "Bob Hall Pier",
    buoyId: "42020",
    lat: 27.58, // More accurate lat
    lon: -97.22,
    timezone: "America/Chicago",
    region: "Texas",
    country: "United States"
  },
];

const defaultTriggers: TriggerTier[] = [
  {
    id: "1",
    name: "Dawn Patrol",
    emoji: "🔥",
    condition: "epic",
    minHeight: 5,
    maxHeight: 15,
    minPeriod: 10,
    maxPeriod: 20,
    minWindSpeed: 0,
    maxWindSpeed: 12,
    minWindDirection: 290, // Offshore (WNW)
    maxWindDirection: 20,  // Offshore (NNE)
    minSwellDirection: 90,
    maxSwellDirection: 180,
    tideType: "any",
    minTideHeight: -2,
    maxTideHeight: 3,
    spotId: "surfside",
    messageTemplate: "Dawn Patrol Alert! [Spot Name] is firing. [Height]ft @ [Period]s.",
  },
  {
    id: "2",
    name: "Lunch Session",
    emoji: "🏄",
    condition: "good",
    minHeight: 3,
    maxHeight: 6,
    minPeriod: 8,
    maxPeriod: 15,
    minWindSpeed: 0,
    maxWindSpeed: 15,
    minWindDirection: 290, // Offshore
    maxWindDirection: 20,
    minSwellDirection: 90,
    maxSwellDirection: 180,
    tideType: "any",
    minTideHeight: -2,
    maxTideHeight: 3,
    spotId: "surfside",
    messageTemplate: "Lunch break surf? [Spot Name] looks fun.",
  },
];

const conditionColors = {
  fair: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  good: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  epic: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function TriggersPage() {
  const { isAdmin } = useAuth();
  const [triggers, setTriggers] = useState<TriggerTier[]>(defaultTriggers);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string>(
    userSpots.length > 0 ? userSpots[0].id : ""
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<TriggerTier | undefined>(undefined);
  // Spot Selector Dropdown State
  const [isSpotDropdownOpen, setIsSpotDropdownOpen] = useState(false);

  const hasSpots = userSpots.length > 0;

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="mb-8 lg:mb-12">
          <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
            // TRIGGER_CONFIG
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="TRIGGERS">
            TRIGGERS
          </h1>
        </div>
        <div className="tech-card border-dashed">
          <div className="pt-12 pb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/20 mb-6 border border-border/50">
              <Radar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-mono uppercase font-bold mb-2">Coming Soon</h2>
            <p className="font-mono text-muted-foreground max-w-md mx-auto">
              Custom triggers are coming soon. You'll be able to set specific wave height, period, and wind conditions that match your preferences.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredTriggers = selectedSpotId
    ? triggers.filter((t) => t.spotId === selectedSpotId)
    : [];

  const handleCreateTrigger = () => {
    setEditingTrigger(undefined);
    setIsModalOpen(true);
  };

  const handleEditTrigger = (trigger: TriggerTier) => {
    setEditingTrigger(trigger);
    setIsModalOpen(true);
  };

  const handleSaveTrigger = (trigger: TriggerTier) => {
    // Check if it's an update or new
    const exists = triggers.some(t => t.id === trigger.id);
    if (exists) {
      setTriggers(prev => prev.map(t => t.id === trigger.id ? trigger : t));
    } else {
      setTriggers(prev => [...prev, trigger]);
    }
    setIsModalOpen(false);
  };

  const deleteTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this trigger?")) {
      setTriggers(triggers.filter((t) => t.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const selectedSpot = userSpots.find((s) => s.id === selectedSpotId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 lg:mb-12">
        <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
          // CONFIGURATION_PARAMETERS
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="TRIGGER_CONFIG">
          TRIGGER_CONFIG
        </h1>
        <p className="font-mono text-muted-foreground text-base sm:text-lg border-l-2 border-muted pl-4">
          Define automated intercept conditions.
        </p>
      </div>

      {/* Spot Selector */}
      <div className="mb-8 lg:mb-12">
        <div className="tech-card rounded-lg bg-card/50 backdrop-blur-md">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-primary rounded-none" />
              <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">TARGET_ACQUISITION</h2>
            </div>
          </div>

          <div className="p-6">
            {hasSpots ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                  <div>
                    <label className="text-sm font-bold font-mono uppercase mb-1 block tracking-wider">
                      Select Target Spot
                    </label>
                    <p className="text-xs font-mono text-muted-foreground">
                      Triggers are configured per spot.
                    </p>
                  </div>

                  {/* Custom Select Implementation for Aesthetic */}
                  <div className="relative w-full sm:w-72">
                    <button
                      onClick={() => setIsSpotDropdownOpen(!isSpotDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-secondary/10 border border-border/50 hover:border-primary/50 text-foreground transition-all group"
                    >
                      <span className="font-mono text-sm uppercase truncate">
                        {selectedSpot ? selectedSpot.name : "Select Spot"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform group-hover:text-primary ${isSpotDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSpotDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-md border border-border/50 z-50 max-h-60 overflow-y-auto shadow-xl">
                        {userSpots.map((spot) => (
                          <button
                            key={spot.id}
                            onClick={() => {
                              setSelectedSpotId(spot.id);
                              setIsSpotDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 font-mono text-sm uppercase transition-colors hover:bg-secondary/20
                            ${selectedSpotId === spot.id ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-muted-foreground border-l-2 border-transparent'}
                          `}
                          >
                            {spot.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedSpot && (
                  <div className="mt-6 pt-6 border-t border-border/30 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-pulse" />
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      <span className="text-primary">{selectedSpot.buoyId}</span> • {filteredTriggers.length} CONDITION SET{filteredTriggers.length !== 1 ? 'S' : ''} ACTIVE
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-800 mb-3 border border-zinc-700">
                  <MapPin className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="font-mono font-bold text-foreground mb-1 uppercase">No targets found</p>
                <p className="font-mono text-xs text-muted-foreground mb-6">
                  Acquire target first to set triggers.
                </p>
                <Link to="/dashboard/spots">
                  <Button variant="outline" className="font-mono uppercase text-xs">
                    <Plus className="w-3 h-3 mr-2" />
                    Create Spot
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner - Only show when no triggers */}
      {hasSpots && filteredTriggers.length === 0 && (
        <div className="mb-6 lg:mb-8 p-4 border border-primary/30 bg-primary/5 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-mono font-bold text-sm text-foreground uppercase tracking-wide">Configuration Mode</p>
            <p className="font-mono text-xs text-muted-foreground mt-1 leading-relaxed">
              Triggers watch forecast data for matches. You can set specific wind, swell, and tide conditions.
              Messages can be customized for each trigger.
            </p>
          </div>
        </div>
      )}

      {/* Triggers List */}
      <div className="mb-8">
        {hasSpots && (
          <div className="tech-card rounded-lg bg-card/50 backdrop-blur-md">
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-brand-rogue rounded-none" />
                <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">INTERCEPT_CONDITIONS</h2>
              </div>
            </div>

            <div className="p-0">
              {filteredTriggers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/20 mb-6 border border-border/50">
                    <Radar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider mb-6">
                    No active conditions for this target
                  </p>
                  <Button
                    onClick={handleCreateTrigger}
                    variant="outline"
                    className="font-mono uppercase text-xs border-dashed border-muted-foreground/50 hover:border-primary hover:text-primary"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Initialize First Trigger
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredTriggers.map((trigger) => (
                    <div
                      key={trigger.id}
                      className="group p-4 sm:p-6 flex items-center gap-4 hover:bg-secondary/10 transition-colors cursor-pointer"
                      onClick={() => handleEditTrigger(trigger)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />

                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl filter grayscale group-hover:grayscale-0 transition-all">{trigger.emoji}</span>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono font-bold text-base uppercase tracking-tight">{trigger.name}</span>
                              <Badge
                                variant="outline"
                                className={`font-mono text-[10px] uppercase border px-1.5 py-0 rounded-none ${conditionColors[trigger.condition] || ''}`}
                              >
                                {trigger.condition}
                              </Badge>
                            </div>
                            <div className="font-mono text-xs text-muted-foreground/70 line-clamp-1">
                              <span dangerouslySetInnerHTML={{ __html: generateTriggerSummary(trigger) }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTrigger(trigger);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={(e) => deleteTrigger(trigger.id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Action */}
            {filteredTriggers.length > 0 && (
              <div className="p-4 bg-secondary/5 border-t border-border/30">
                <Button
                  onClick={handleCreateTrigger}
                  variant="outline"
                  className="w-full font-mono uppercase text-xs border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary hover:bg-primary/5 h-10"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Another Condition
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <TriggerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTrigger}
        spotId={selectedSpotId}
        spot={selectedSpot}
        triggerToEdit={editingTrigger}
      />
    </div>
  );
}
