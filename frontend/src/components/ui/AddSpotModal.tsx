import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  Navigation,
  Search,
  Plus,
  Check,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import type { Spot } from "../SpotCard";
import {
  getSurfSpots,
  COUNTRY_GROUP_LABELS,
  type CountryGroup,
  type SurfSpot,
} from "../../data/surfSpots";

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSpots: Spot[];
  onAddSpot: (spot: Spot) => void;
}

export type SpotOption = Spot;

// Minimum characters before showing search results
const MIN_SEARCH_LENGTH = 2;

export function AddSpotModal({
  isOpen,
  onClose,
  savedSpots,
  onAddSpot,
}: AddSpotModalProps) {
  const [activeTab, setActiveTab] = useState<"popular" | "custom">("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<CountryGroup>("USA");
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [customSpot, setCustomSpot] = useState({
    name: "",
    lat: "",
    lon: "",
    exposure: "pacific" as string,
  });

  // Exposure options for custom spots (maps to inferExposure logic)
  const exposureOptions = [
    { value: "pacific", label: "Pacific / West Coast", region: "Pacific West Coast" },
    { value: "atlantic", label: "Atlantic / East Coast", region: "Atlantic East Coast" },
    { value: "gulf", label: "Gulf Coast", region: "Gulf Coast" },
    { value: "hawaii-north", label: "Hawaii - North Shore", region: "Hawaii North Shore" },
    { value: "hawaii-south", label: "Hawaii - South Shore", region: "Hawaii South Shore" },
    { value: "caribbean", label: "Caribbean", region: "Caribbean" },
    { value: "unknown", label: "Other / Unknown", region: "Custom Location" },
  ];

  // Get spots from centralized data
  const allSpots = useMemo(() => getSurfSpots(), []);

  // Filter by region first, then by search query
  const filteredSpots = useMemo(() => {
    // Filter by selected region
    const regionSpots = allSpots.filter(
      (spot) => spot.countryGroup === selectedRegion
    );

    // Only show results if search query meets minimum length
    if (searchQuery.length < MIN_SEARCH_LENGTH) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    return regionSpots.filter(
      (spot) =>
        spot.name.toLowerCase().includes(query) ||
        spot.region.toLowerCase().includes(query)
    );
  }, [allSpots, selectedRegion, searchQuery]);

  // Convert SurfSpot to Spot format for compatibility
  const convertToSpot = (surfSpot: SurfSpot): Spot => ({
    id: surfSpot.id,
    name: surfSpot.name,
    region: surfSpot.region,
    lat: surfSpot.lat,
    lon: surfSpot.lon,
  });

  const isSpotSaved = (spotId: string) =>
    savedSpots.some((s) => s.id === spotId);

  const handleAddSpot = (surfSpot: SurfSpot) => {
    onAddSpot(convertToSpot(surfSpot));
  };

  const handleAddCustomSpot = () => {
    if (!customSpot.name || !customSpot.lat || !customSpot.lon) return;
    const selectedExposure = exposureOptions.find(e => e.value === customSpot.exposure);
    const newSpot: Spot = {
      id: `custom-${Date.now()}`,
      name: customSpot.name,
      region: selectedExposure?.region || "Custom Location",
      lat: parseFloat(customSpot.lat),
      lon: parseFloat(customSpot.lon),
    };
    onAddSpot(newSpot);
    setCustomSpot({ name: "", lat: "", lon: "", exposure: "pacific" });
    onClose();
  };

  const resetAndClose = () => {
    setSearchQuery("");
    setActiveTab("popular");
    setRegionDropdownOpen(false);
    onClose();
  };

  const currentRegionLabel = COUNTRY_GROUP_LABELS[selectedRegion];

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
              {/* Region Filter + Search */}
              <div className="flex gap-3 mb-6">
                {/* Region Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-secondary/20 border border-border/50 rounded-sm hover:bg-secondary/30 transition-colors font-mono text-sm"
                  >
                    <span>{currentRegionLabel.flag}</span>
                    <span className="uppercase tracking-wider">{currentRegionLabel.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {regionDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border/50 rounded-sm shadow-lg z-20">
                      {(Object.entries(COUNTRY_GROUP_LABELS) as [CountryGroup, typeof currentRegionLabel][]).map(
                        ([key, { label, flag, count }]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedRegion(key);
                              setRegionDropdownOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors font-mono text-sm ${
                              selectedRegion === key ? 'bg-primary/10 text-primary' : ''
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{flag}</span>
                              <span className="uppercase tracking-wider">{label}</span>
                            </span>
                            <span className="text-muted-foreground/60 text-xs">
                              {count} spots
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={`SEARCH ${currentRegionLabel.count} SPOTS...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Search Results or Prompt */}
              <div className="space-y-3">
                {searchQuery.length < MIN_SEARCH_LENGTH ? (
                  // Show search prompt before user types
                  <div className="text-center py-12 border border-dashed border-border/50 rounded-sm">
                    <Search className="w-8 h-8 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="font-mono text-sm text-muted-foreground/70">
                      Start typing to search {currentRegionLabel.count} spots...
                    </p>
                    <p className="font-mono text-xs mt-3 text-muted-foreground/50">
                      <span className="text-primary">TIP:</span> Try "Malibu", "Pipeline", or a state name
                    </p>
                  </div>
                ) : filteredSpots.length > 0 ? (
                  // Show search results
                  <>
                    <p className="font-mono text-xs text-muted-foreground/60 uppercase mb-4">
                      Showing {filteredSpots.length} result{filteredSpots.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </p>
                    {filteredSpots.slice(0, 50).map((spot) => {
                      const saved = isSpotSaved(spot.id);
                      return (
                        <div
                          key={spot.id}
                          className={`flex items-center justify-between p-4 rounded-sm border transition-all ${
                            saved
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 bg-secondary/10 hover:bg-secondary/20 hover:border-border"
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className={`h-10 w-10 rounded-sm flex items-center justify-center shrink-0 ${
                                saved ? "bg-primary/20" : "bg-card border border-border/50"
                              }`}
                            >
                              {spot.verified ? (
                                <CheckCircle className="w-4 h-4 text-primary" />
                              ) : (
                                <MapPin className="w-4 h-4 text-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-mono text-sm uppercase tracking-wider text-foreground/90 truncate">
                                  {spot.name}
                                </h4>
                              </div>
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
                    {filteredSpots.length > 50 && (
                      <p className="font-mono text-xs text-muted-foreground/50 text-center py-2">
                        Showing first 50 results. Refine your search for more specific results.
                      </p>
                    )}
                  </>
                ) : (
                  // No results found
                  <div className="text-center py-12 text-muted-foreground/50 border border-dashed border-border/50 rounded-sm">
                    <p className="font-mono text-sm uppercase">No signals found</p>
                    <p className="font-mono text-xs mt-2 opacity-60">
                      Try a different search term or region
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

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                  Swell Exposure
                </label>
                <p className="text-xs font-mono text-muted-foreground/60 mb-3">
                  Select the ocean/coast this spot faces for better buoy recommendations
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {exposureOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCustomSpot({ ...customSpot, exposure: option.value })}
                      className={`px-3 py-2 text-left font-mono text-xs uppercase tracking-wider border transition-colors ${
                        customSpot.exposure === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-secondary/10 text-muted-foreground hover:bg-secondary/20 hover:border-border"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-secondary/10 border border-border/50 rounded-sm">
                <p className="text-xs font-mono text-muted-foreground/80">
                  <span className="text-primary mr-2">TIP:</span>
                  Swell exposure helps recommend buoys that are upstream of incoming waves.
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
