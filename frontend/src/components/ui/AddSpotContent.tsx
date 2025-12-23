import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    MapPoint,
    Routing,
    Magnifer,
    AddCircle,
    VerifiedCheck,
    AltArrowDown,
} from '@solar-icons/react';
import { Button } from "./Button";
import { Input } from "./Input";
import type { Spot } from "../SpotCard";
import {
    COUNTRY_GROUP_LABELS,
    type CountryGroup,
} from "../../data/surfSpots";
import { useSurfSpots } from "../../hooks";
import type { SurfSpot } from "../../lib/mappers";
import { AVAILABLE_ICONS } from "./IconPickerModal";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { Sheet } from "./Sheet";
import { LocationPickerMap } from "./LocationPickerMap";
import { NaturalLanguageSpotInput } from "./NaturalLanguageSpotInput";
import type { AddressSuggestion } from "../../services/api/addressService";
import type { ParsedSpot } from "../../services/api/spotAiService";

export interface SpotOption extends Spot { }

// Minimum characters before showing search results
const MIN_SEARCH_LENGTH = 2;

interface AddSpotContentProps {
    savedSpots: Spot[];
    onAddSpot: (spot: Spot) => void;
    className?: string;
    /** User's home location for showing nearby spots */
    userLocation?: { lat: number; lon: number } | null;
    onCancel?: () => void;
}

// Calculate distance between two points using Haversine formula (returns km)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function AddSpotContent({
    savedSpots,
    onAddSpot,
    className = "",
    userLocation,
    onCancel,
}: AddSpotContentProps) {
    const [activeTab, setActiveTab] = useState<"popular" | "custom">("popular");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRegion, setSelectedRegion] = useState<CountryGroup>("USA");
    const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const regionButtonRef = useRef<HTMLButtonElement>(null);
    const regionDropdownRef = useRef<HTMLDivElement>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [customSpot, setCustomSpot] = useState({
        name: "",
        lat: "",
        lon: "",
        exposure: "pacific-us" as string,
    });

    // Exposure options for custom spots
    const exposureOptions = [
        // North America
        { value: "pacific-us", label: "US Pacific / West Coast", region: "Pacific West Coast" },
        { value: "atlantic-us", label: "US Atlantic / East Coast", region: "Atlantic East Coast" },
        { value: "gulf", label: "Gulf of Mexico", region: "Gulf Coast" },
        { value: "hawaii-north", label: "Hawaii - North Shore", region: "Hawaii North Shore" },
        { value: "hawaii-south", label: "Hawaii - South Shore", region: "Hawaii South Shore" },
        // Central America & Caribbean
        { value: "central-pacific", label: "Central America Pacific", region: "Central America" },
        { value: "caribbean", label: "Caribbean", region: "Caribbean" },
        // South America
        { value: "south-pacific", label: "South America Pacific", region: "South America Pacific" },
        { value: "south-atlantic", label: "South America Atlantic", region: "South America Atlantic" },
        // Europe & Africa
        { value: "europe-atlantic", label: "Europe Atlantic", region: "Europe Atlantic" },
        { value: "europe-med", label: "Mediterranean", region: "Mediterranean" },
        { value: "africa-atlantic", label: "Africa Atlantic", region: "Africa Atlantic" },
        { value: "indian-ocean", label: "Indian Ocean", region: "Indian Ocean" },
        // Asia Pacific
        { value: "asia-pacific", label: "Asia Pacific", region: "Asia Pacific" },
        { value: "australia-east", label: "Australia East Coast", region: "Australia East" },
        { value: "australia-west", label: "Australia West Coast", region: "Australia West" },
        { value: "indonesia", label: "Indonesia", region: "Indonesia" },
        // Other
        { value: "unknown", label: "Other / Unknown", region: "Custom Location" },
    ];

    // Fetch spots from Supabase with filters
    const isSearching = searchQuery.length >= MIN_SEARCH_LENGTH;
    const shouldFetchForSearch = isSearching;
    const shouldFetchForNearby = !isSearching && !!userLocation;

    // Fetch for search results
    const {
        spots: searchSpots,
        isLoading: isSearchLoading,
    } = useSurfSpots({
        countryGroup: selectedRegion,
        search: shouldFetchForSearch ? searchQuery : undefined,
        limit: 50,
    });

    // Fetch all spots in region for nearby calculation (when user has location set)
    const {
        spots: allRegionSpots,
        isLoading: isNearbyLoading,
    } = useSurfSpots({
        countryGroup: selectedRegion,
        limit: 500, // Fetch more to find nearby ones
    });

    const isLoading = isSearchLoading || (shouldFetchForNearby && isNearbyLoading);

    // Calculate nearby spots sorted by distance
    const nearbySpots = useMemo(() => {
        if (!userLocation || !allRegionSpots.length) return [];

        const spotsWithDistance = allRegionSpots.map(spot => ({
            ...spot,
            distance: getDistanceKm(userLocation.lat, userLocation.lon, spot.lat, spot.lon)
        }));

        // Sort by distance and take closest 20
        return spotsWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 20);
    }, [userLocation, allRegionSpots]);

    const filteredSpots = useMemo(() => {
        if (isSearching) return searchSpots;
        return [];
    }, [searchSpots, isSearching]);

    const convertToSpot = (surfSpot: SurfSpot): Spot => ({
        id: surfSpot.id,
        name: surfSpot.name,
        region: surfSpot.region,
        lat: surfSpot.lat,
        lon: surfSpot.lon,
    });

    // Check if a surf spot is already saved (by matching masterSpotId)
    const isSpotSaved = (spotId: string) =>
        savedSpots.some((s) => s.masterSpotId === spotId);

    // Get the saved spot data for a surf spot (to access custom icon)
    const getSavedSpot = (spotId: string) =>
        savedSpots.find((s) => s.masterSpotId === spotId);

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
        setCustomSpot({ name: "", lat: "", lon: "", exposure: "pacific-us" });
    };

    const handleAddressSelect = (suggestion: AddressSuggestion) => {
        setCustomSpot(prev => ({
            ...prev,
            lat: suggestion.lat.toString(),
            lon: suggestion.lon.toString(),
        }));
        setIsMapOpen(true);
    };

    const handleLocationChange = (lat: number, lon: number) => {
        setCustomSpot(prev => ({
            ...prev,
            lat: lat.toString(),
            lon: lon.toString(),
        }));
    };

    const handleAIParsed = (parsedSpot: ParsedSpot) => {
        setCustomSpot(prev => ({
            ...prev,
            name: parsedSpot.name || prev.name,
            lat: parsedSpot.lat?.toString() || prev.lat,
            lon: parsedSpot.lon?.toString() || prev.lon,
            exposure: parsedSpot.exposure || prev.exposure,
        }));
        // Open map if we got coordinates
        if (parsedSpot.lat && parsedSpot.lon) {
            setIsMapOpen(true);
        }
    };

    const currentRegionLabel = COUNTRY_GROUP_LABELS[selectedRegion];

    // Handle click outside for region dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                regionButtonRef.current && !regionButtonRef.current.contains(event.target as Node) &&
                regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)
            ) {
                setRegionDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown position when it opens
    useEffect(() => {
        if (regionDropdownOpen && regionButtonRef.current) {
            const rect = regionButtonRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                minWidth: Math.max(rect.width, 224), // 224px = w-56
            });
        }
    }, [regionDropdownOpen]);

    return (
        <div className={`flex flex-col h-full bg-card ${className}`}>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-32">
                {/* Tabs - now inside scroll */}
                <div className="flex border-b border-border/50 sticky top-0 bg-card z-10">
                    <button
                        onClick={() => setActiveTab("popular")}
                        className={`flex-1 px-4 py-3 text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === "popular"
                            ? "text-primary border-b-2 border-primary bg-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                            }`}
                    >
                        <MapPoint weight="Bold" size={16} />
                        Popular Spots
                    </button>
                    <button
                        onClick={() => setActiveTab("custom")}
                        className={`flex-1 px-4 py-3 text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === "custom"
                            ? "text-primary border-b-2 border-primary bg-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                            }`}
                    >
                        <Routing weight="Bold" size={16} />
                        Custom Spot
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === "popular" ? (
                        <>
                            {/* Region Filter + Search */}
                            <div className="flex gap-3 mb-6">
                                {/* Region Dropdown */}
                                <div className="relative">
                                    <button
                                        ref={regionButtonRef}
                                        onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                                        className="flex items-center gap-2 px-3 py-2 bg-secondary/20 border border-border/50 rounded-sm hover:bg-secondary/30 transition-colors font-mono text-sm"
                                    >
                                        <span>{currentRegionLabel.flag}</span>
                                        <span className="uppercase tracking-wider">{currentRegionLabel.label}</span>
                                        <AltArrowDown weight="Bold" size={16} className={`transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {regionDropdownOpen && createPortal(
                                        <div
                                            ref={regionDropdownRef}
                                            style={dropdownStyle}
                                            className="bg-card border border-border/50 rounded-sm shadow-lg z-50"
                                        >
                                            {(Object.entries(COUNTRY_GROUP_LABELS) as [CountryGroup, typeof currentRegionLabel][]).map(
                                                ([key, { label, flag, count }]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => {
                                                            setSelectedRegion(key);
                                                            setRegionDropdownOpen(false);
                                                            setSearchQuery("");
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/30 transition-colors font-mono text-sm ${selectedRegion === key ? 'bg-primary/10 text-primary' : ''
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
                                        </div>,
                                        document.body
                                    )}
                                </div>

                                {/* Search Input */}
                                <div className="relative flex-1">
                                    <Magnifer weight="Bold" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder={`SEARCH ${currentRegionLabel.count} SPOTS...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 font-mono text-sm"
                                    />
                                </div>
                            </div>

                            {/* Search Results, Nearby Spots, or Prompt */}
                            <div className="space-y-3">
                                {searchQuery.length < MIN_SEARCH_LENGTH && nearbySpots.length > 0 ? (
                                    // Show nearby spots when user has location set
                                    <>
                                        <p className="font-mono text-xs text-muted-foreground/60 uppercase mb-4">
                                            Spots near you
                                        </p>
                                        {nearbySpots.map((spot) => {
                                            const saved = isSpotSaved(spot.id);
                                            const distanceMiles = Math.round(spot.distance * 0.621371);
                                            return (
                                                <div
                                                    key={spot.id}
                                                    className={`flex items-center justify-between p-4 rounded-sm transition-all ${saved
                                                        ? "bg-muted/20"
                                                        : "border-border/50 bg-secondary/10 hover:bg-secondary/20 hover:border-border"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        {(() => {
                                                            const savedSpot = getSavedSpot(spot.id);
                                                            const iconKey = savedSpot?.icon as keyof typeof AVAILABLE_ICONS | undefined;
                                                            const IconComponent = iconKey && AVAILABLE_ICONS[iconKey] ? AVAILABLE_ICONS[iconKey] : MapPoint;
                                                            return (
                                                                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md border border-cyan-500/50 bg-cyan-950/30 text-cyan-50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] backdrop-blur-sm ring-1 ring-cyan-500/20">
                                                                    <IconComponent weight="BoldDuotone" size={20} className="text-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]" />
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-mono text-sm uppercase tracking-wider text-foreground/90 truncate">
                                                                    {spot.name}
                                                                </h4>
                                                                <span className="font-mono text-xs text-muted-foreground/50">
                                                                    {distanceMiles} mi
                                                                </span>
                                                            </div>
                                                            <p className="font-mono text-xs text-muted-foreground/60 uppercase">
                                                                {spot.region}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {saved ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled
                                                            className="shrink-0 font-mono text-xs uppercase opacity-50 cursor-not-allowed"
                                                        >
                                                            <VerifiedCheck weight="Bold" size={16} className="mr-2" />
                                                            Added
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAddSpot(spot)}
                                                            className="shrink-0 font-mono text-xs uppercase"
                                                        >
                                                            <AddCircle weight="Bold" size={16} className="mr-2" />
                                                            Add
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : searchQuery.length < MIN_SEARCH_LENGTH ? (
                                    // Show search prompt before user types (no nearby spots available)
                                    <div className="text-center py-12 border border-dashed border-border/50 rounded-sm">
                                        <Magnifer weight="BoldDuotone" size={32} className="mx-auto mb-4 text-muted-foreground/30" />
                                        <p className="font-mono text-sm text-muted-foreground/70">
                                            Start typing to search {currentRegionLabel.count} spots...
                                        </p>
                                        <p className="font-mono text-xs mt-3 text-muted-foreground/50">
                                            <span className="text-primary">TIP:</span> Try "Malibu", "Pipeline", or a state name
                                        </p>
                                    </div>
                                ) : isLoading ? (
                                    // Show loading state
                                    <div className="text-center py-12 border border-dashed border-border/50 rounded-sm">
                                        <div className="w-8 h-8 mx-auto mb-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                                        <p className="font-mono text-sm text-muted-foreground/70">
                                            Searching spots...
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
                                                    className={`flex items-center justify-between p-4 rounded-sm transition-all ${saved
                                                        ? "border-primary/50 bg-muted/20"
                                                        : "border-border/50 bg-secondary/10 hover:bg-secondary/20 hover:border-border"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        {(() => {
                                                            const savedSpot = getSavedSpot(spot.id);
                                                            const iconKey = savedSpot?.icon as keyof typeof AVAILABLE_ICONS | undefined;
                                                            const IconComponent = iconKey && AVAILABLE_ICONS[iconKey] ? AVAILABLE_ICONS[iconKey] : MapPoint;
                                                            return (
                                                                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md border border-cyan-500/50 bg-cyan-950/30 text-cyan-50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] backdrop-blur-sm ring-1 ring-cyan-500/20">
                                                                    <IconComponent weight="BoldDuotone" size={20} className="text-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]" />
                                                                </div>
                                                            );
                                                        })()}
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
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled
                                                            className="shrink-0 font-mono text-xs uppercase opacity-50 cursor-not-allowed"
                                                        >
                                                            <VerifiedCheck weight="Bold" size={16} className="mr-2" />
                                                            Added
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAddSpot(spot)}
                                                            className="shrink-0 font-mono text-xs uppercase"
                                                        >
                                                            <AddCircle weight="Bold" size={16} className="mr-2" />
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
                            {/* AI Assistant */}
                            <NaturalLanguageSpotInput onParsed={handleAIParsed} />

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

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">
                                        Search Address
                                    </label>
                                    <AddressAutocomplete
                                        value=""
                                        onChange={() => { }} // Managed internally by component for now, or could link to a state if needed
                                        onAddressSelect={handleAddressSelect}
                                        placeholder="SEARCH ADDRESS OR COORDINATES..."
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

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full font-mono text-xs uppercase"
                                    onClick={() => setIsMapOpen(true)}
                                >
                                    <MapPoint weight="BoldDuotone" size={16} className="mr-2" />
                                    Adjust on Map
                                </Button>
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
                                            className={`px-3 py-2 text-left font-mono text-xs uppercase tracking-wider border transition-colors ${customSpot.exposure === option.value
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
                                <AddCircle weight="Bold" size={16} className="mr-2" />
                                INITIALIZE SPOT
                            </Button>

                            {onCancel && (
                                <Button
                                    className="w-full mt-3"
                                    variant="ghost"
                                    onClick={onCancel}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Map Sheet/Drawer */}
            <Sheet
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                title="Adjust Location"
                description="Drag the map to fine-tune the position."
                className="w-full max-w-2xl"
            >
                <div className="w-full h-[300px] sm:h-[350px] relative rounded-md overflow-hidden bg-muted/20">
                    <LocationPickerMap
                        lat={parseFloat(customSpot.lat) || userLocation?.lat || 33.3822}
                        lon={parseFloat(customSpot.lon) || userLocation?.lon || -117.5889}
                        onLocationChange={handleLocationChange}
                    />
                </div>
                <div className="p-4 border-t border-border/50 space-y-3">
                    {/* Coordinates Display */}
                    <div className="flex items-center gap-4 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground uppercase">Lat</span>
                            <span className="text-primary">{parseFloat(customSpot.lat).toFixed(4) || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground uppercase">Lon</span>
                            <span className="text-primary">{parseFloat(customSpot.lon).toFixed(4) || "—"}</span>
                        </div>
                    </div>
                    <Button onClick={() => setIsMapOpen(false)} className="w-full">
                        LOOKS GOOD
                    </Button>
                </div>
            </Sheet>
        </div>
    );
}
