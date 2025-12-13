import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  Navigation,
  Search,
  Plus,
  Check,
  Star,
  Palmtree,
  Waves,
  Sun,
  Cloud,
} from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import type { Spot } from "../SpotCard";

const popularSpots: Spot[] = [
  {
    id: "1",
    name: "Surfside Beach",
    region: "Texas Gulf Coast",
    lat: 29.0469,
    lon: -95.2882,
  },
  {
    id: "2",
    name: "Galveston (61st St)",
    region: "Texas Gulf Coast",
    lat: 29.2874,
    lon: -94.8031,
  },
  {
    id: "3",
    name: "South Padre Island",
    region: "Texas Gulf Coast",
    lat: 26.1118,
    lon: -97.1681,
  },
  {
    id: "4",
    name: "Malibu (Surfrider)",
    region: "Southern California",
    lat: 34.0381,
    lon: -118.682,
  },
  {
    id: "5",
    name: "Ocean Beach (SF)",
    region: "Northern California",
    lat: 37.7594,
    lon: -122.5107,
  },
  {
    id: "6",
    name: "Pipeline",
    region: "Oahu, Hawaii",
    lat: 21.664,
    lon: -158.053,
  },
  {
    id: "7",
    name: "Cocoa Beach",
    region: "Florida",
    lat: 28.32,
    lon: -80.6076,
  },
];

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSpots: Spot[];
  onAddSpot: (spot: Spot) => void;
}

export type SpotOption = Spot;

export function AddSpotModal({
  isOpen,
  onClose,
  savedSpots,
  onAddSpot,
}: AddSpotModalProps) {
  const [activeTab, setActiveTab] = useState<"popular" | "custom">("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [customSpot, setCustomSpot] = useState({
    name: "",
    lat: "",
    lon: "",
  });

  const filteredSpots = popularSpots.filter(
    (spot) =>
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (spot.region?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const isSpotSaved = (spotId: string) =>
    savedSpots.some((s) => s.id === spotId);

  const getSpotIcon = (spot: Spot) => {
    const region = spot.region?.toLowerCase() || "";
    const name = spot.name.toLowerCase();

    if (region.includes("texas")) return <Star className="w-4 h-4 text-foreground" />;
    if (region.includes("hawaii")) return <Waves className="w-4 h-4 text-foreground" />;
    if (region.includes("florida")) return <Sun className="w-4 h-4 text-foreground" />;

    if (region.includes("california")) {
      if (
        name.includes("sf") ||
        name.includes("francisco") ||
        name.includes("ocean beach") ||
        region.includes("northern")
      ) {
        return <Cloud className="w-4 h-4 text-foreground" />;
      }
      return <Palmtree className="w-4 h-4 text-foreground" />;
    }

    return <MapPin className="w-4 h-4 text-foreground" />;
  };

  const handleAddSpot = (spot: Spot) => {
    onAddSpot(spot);
  };

  const handleAddCustomSpot = () => {
    if (!customSpot.name || !customSpot.lat || !customSpot.lon) return;
    const newSpot: Spot = {
      id: `custom-${Date.now()}`,
      name: customSpot.name,
      region: "Custom Location",
      lat: parseFloat(customSpot.lat),
      lon: parseFloat(customSpot.lon),
    };
    onAddSpot(newSpot);
    setCustomSpot({ name: "", lat: "", lon: "" });
    onClose();
  };

  const resetAndClose = () => {
    setSearchQuery("");
    setActiveTab("popular");
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-card/95 tech-card rounded-lg w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2.5 h-2.5 bg-primary animate-pulse" />
              <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">
                Add Surf Spot
              </h2>
            </div>
            <p className="font-mono text-sm text-muted-foreground/60">
              Configure a wave wire location.
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab("popular")}
            className={`flex-1 px-4 py-3 text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === "popular"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
              }`}
          >
            <MapPin className="w-4 h-4" />
            Popular Spots
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 px-4 py-3 text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === "custom"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
              }`}
          >
            <Navigation className="w-4 h-4" />
            Custom Location
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "popular" ? (
            <>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="SEARCH DATABASE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 font-mono text-sm"
                />
              </div>

              {/* 
                TODO: BACKEND: The "Popular Spots" list should be populated based on a geospatial lookup 
                relative to the user's assigned "Home Base" location coordinates.
                If the user has not completed onboarding/set a home location, this list might be empty or default to a global list.
              */}

              {/* Spots List */}
              <div className="space-y-3">
                {filteredSpots.map((spot) => {
                  const saved = isSpotSaved(spot.id);
                  return (
                    <div
                      key={spot.id}
                      className={`flex items-center justify-between p-4 rounded-sm border transition-all ${saved
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 bg-secondary/10 hover:bg-secondary/20 hover:border-border"
                        }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`h-10 w-10 rounded-sm flex items-center justify-center shrink-0 ${saved ? "bg-primary/20" : "bg-card border border-border/50"
                          }`}>
                          {getSpotIcon(spot)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-mono text-sm uppercase tracking-wider text-foreground/90 truncate">
                            {spot.name}
                          </h4>
                          <p className="font-mono text-xs text-muted-foreground/60 uppercase">
                            {spot.region}
                          </p>
                        </div>
                      </div>
                      {saved ? (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/50">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddSpot(spot)}
                          className="shrink-0 font-mono text-xs uppercase"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })}
                {filteredSpots.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground/50 border border-dashed border-border/50 rounded-sm">
                    <p className="font-mono text-sm uppercase">No signals found</p>
                    <p className="font-mono text-xs mt-2 opacity-60">
                      Try different coordinates
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Custom Location Form */
            <div className="space-y-6">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                  Spot Name
                </label>
                <Input
                  placeholder="E.G., CLASSIFIED SECTOR 7"
                  value={customSpot.name}
                  onChange={(e) =>
                    setCustomSpot({ ...customSpot, name: e.target.value })
                  }
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                    Latitude
                  </label>
                  <Input
                    placeholder="29.0469"
                    value={customSpot.lat}
                    onChange={(e) =>
                      setCustomSpot({ ...customSpot, lat: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                    Longitude
                  </label>
                  <Input
                    placeholder="-95.2882"
                    value={customSpot.lon}
                    onChange={(e) =>
                      setCustomSpot({ ...customSpot, lon: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-secondary/10 border border-border/50 rounded-sm">
                <p className="text-xs font-mono text-muted-foreground/80">
                  <span className="text-primary mr-2">TIP:</span>
                  Buoy telemetry can be assigned after initialization.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleAddCustomSpot}
                disabled={!customSpot.name || !customSpot.lat || !customSpot.lon}
              >
                <Plus className="w-4 h-4 mr-2" />
                INITIALIZE SPOT
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
