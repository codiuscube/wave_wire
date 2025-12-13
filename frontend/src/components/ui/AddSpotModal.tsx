import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  Navigation,
  Search,
  Plus,
  Check,
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
    name: "Bob Hall Pier",
    region: "Texas Gulf Coast",
    lat: 27.5816,
    lon: -97.2185,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={resetAndClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-background border border-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold">Add a Spot</h2>
          <button
            onClick={resetAndClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("popular")}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "popular"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Popular Spots
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "custom"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Navigation className="w-4 h-4" />
            Custom Location
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "popular" ? (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search spots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Spots List */}
              <div className="space-y-2">
                {filteredSpots.map((spot) => {
                  const saved = isSpotSaved(spot.id);
                  return (
                    <div
                      key={spot.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        saved
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-foreground" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {spot.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {spot.region}
                          </p>
                        </div>
                      </div>
                      {saved ? (
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddSpot(spot)}
                          className="shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {filteredSpots.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No spots found</p>
                    <p className="text-xs mt-1">
                      Try a different search or add a custom location
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Custom Location Form */
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Spot Name
                </label>
                <Input
                  placeholder="e.g., My Secret Spot"
                  value={customSpot.name}
                  onChange={(e) =>
                    setCustomSpot({ ...customSpot, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Latitude
                  </label>
                  <Input
                    placeholder="29.0469"
                    value={customSpot.lat}
                    onChange={(e) =>
                      setCustomSpot({ ...customSpot, lat: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Longitude
                  </label>
                  <Input
                    placeholder="-95.2882"
                    value={customSpot.lon}
                    onChange={(e) =>
                      setCustomSpot({ ...customSpot, lon: e.target.value })
                    }
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                You can assign a buoy to this spot after adding it.
              </p>

              <Button
                className="w-full mt-2"
                onClick={handleAddCustomSpot}
                disabled={!customSpot.name || !customSpot.lat || !customSpot.lon}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Spot
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
