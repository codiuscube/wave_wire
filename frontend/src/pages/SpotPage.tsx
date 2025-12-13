import { useState } from "react";
import { Crosshair, Plus, Trash2, Waves, ChevronDown } from "lucide-react";
import {
  Button,
  Badge,
  AddSpotModal,
} from "../components/ui";
import { IconPickerModal, AVAILABLE_ICONS } from "../components/ui/IconPickerModal";
import type { SpotOption } from "../components/ui";

const buoyOptions = [
  { value: "42035", label: "Galveston (22nm SE)" },
  { value: "42020", label: "Corpus Christi (50nm SE)" },
  { value: "42019", label: "Freeport (60nm S)" },
  { value: "42001", label: "Mid Gulf (180nm S)" },
];

const defaultSpot: any = { // Changed type to 'any' or 'Spot' if Spot is defined elsewhere
  id: "surfside",
  name: "Surfside Beach",
  region: "Texas Gulf Coast",
  lat: 28.944,
  lon: -95.291,
  buoyId: "42035",
  buoyName: "Galveston (22nm SE)",
  buoy: {
    waveHeight: 4.2,
    wavePeriod: 6,
    waterTemp: 76,
    meanWaveDirection: "SE",
    meanWaveDegrees: 135,
    timestamp: new Date().toISOString(), // Recent data
  },
  forecast: {
    primary: {
      height: 3.5,
      period: 11,
      direction: "SE",
      degrees: 140,
    },
    secondary: {
      height: 1.2,
      period: 8,
      direction: "E",
      degrees: 90,
    },
    windSpeed: 8,
    windDirection: "NW",
    tide: 1.2,
    airTemp: 78,
  }
};

export function SpotPage() {
  const [mySpots, setMySpots] = useState<SpotOption[]>([defaultSpot]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSpotId, setExpandedSpotId] = useState<string | null>(null);

  // Icon Picker State
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [selectedSpotForIcon, setSelectedSpotForIcon] = useState<string | null>(null);

  const isSpotSaved = (spotId: string) => mySpots.some((s) => s.id === spotId);

  const addSpot = (spot: SpotOption) => {
    if (!isSpotSaved(spot.id)) {
      setMySpots([...mySpots, spot]);
    }
  };

  const removeSpot = (spotId: string) => {
    setMySpots(mySpots.filter((s) => s.id !== spotId));
  };

  const assignBuoy = (spotId: string, buoyId: string) => {
    const buoy = buoyOptions.find((b) => b.value === buoyId);
    setMySpots(
      mySpots.map((s) =>
        s.id === spotId ? { ...s, buoyId, buoyName: buoy?.label || buoyId } : s
      )
    );
    setExpandedSpotId(null);
  };



  const updateSpotIcon = (iconName: string) => {
    if (!selectedSpotForIcon) return;
    setMySpots(
      mySpots.map((s) =>
        s.id === selectedSpotForIcon ? { ...s, icon: iconName } : s
      )
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8 lg:mb-12">
        <div>
          <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
            // MY_SPOTS
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="HOME BREAK CONFIG">
            HOME BREAK CONFIG
          </h1>
          <p className="font-mono text-muted-foreground text-base max-w-xl border-l-2 border-muted pl-4">
            Configure your spots and buoy sources.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="rogue"
          className="shrink-0 h-auto py-3 px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          ADD A SPOT
        </Button>
      </div>

      {/* Saved Spots */}
      {mySpots.length > 0 ? (
        <div className="tech-card rounded-lg bg-card/50 backdrop-blur-md">
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-primary animate-pulse" />
              <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">Your Spots</h2>
            </div>
            <Badge variant="outline" className="font-mono rounded-none border-primary/50 text-primary">{mySpots.length}</Badge>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {mySpots.map((spot) => (
                <div
                  key={spot.id}
                  className="border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors group"
                >
                  <div className="flex items-center justify-between p-4 gap-4 border-b border-border/30">
                    <div className="flex items-center gap-4 min-w-0">
                      <button
                        onClick={() => {
                          setSelectedSpotForIcon(spot.id);
                          setIsIconModalOpen(true);
                        }}
                        className="h-12 w-12 bg-secondary/30 flex items-center justify-center shrink-0 border border-border/30 hover:bg-primary/20 hover:border-primary/50 transition-all group/icon"
                        title="Change Icon"
                      >
                        {(() => {
                          const IconComponent = spot.icon && AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
                            ? AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
                            : Crosshair;
                          return <IconComponent className="w-6 h-6 text-primary/80 group-hover/icon:text-primary transition-colors" />;
                        })()}
                      </button>
                      <div className="min-w-0">
                        <h4 className="font-mono font-bold text-lg uppercase tracking-tight text-foreground truncate">{spot.name}</h4>
                        <p className="font-mono text-sm text-muted-foreground/70 uppercase tracking-wide">
                          {spot.region}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSpot(spot.id)}
                      className="p-3 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove target"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Buoy Assignment */}
                  <div className="p-4 bg-background/20">
                    {spot.buoyId ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider shrink-0">Buoy:</span>
                          <div className="flex items-center gap-2">
                            {/* Stale Data Indicator */}
                            <div
                              className={`w-2 h-2 rounded-full ${!spot.buoy?.timestamp || (new Date().getTime() - new Date(spot.buoy.timestamp).getTime() > 24 * 60 * 60 * 1000)
                                ? "bg-red-500 animate-pulse"
                                : "bg-green-500 animate-pulse"
                                }`}
                              title={spot.buoy?.timestamp ? `Data from: ${new Date(spot.buoy.timestamp).toLocaleString()}` : "No data timestamp"}
                            />
                            <a
                              href={`https://www.ndbc.noaa.gov/station_page.php?station=${spot.buoyId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-sm text-primary/80 hover:text-primary transition-colors truncate border-b border-primary/30 hover:border-primary"
                            >
                              {spot.buoyName || `Buoy ${spot.buoyId}`}
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedSpotId(expandedSpotId === spot.id ? null : spot.id)}
                          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider underline underline-offset-4 decoration-dotted"
                        >
                          [ RECONFIGURE BUOY ]
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setExpandedSpotId(expandedSpotId === spot.id ? null : spot.id)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-dashed border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all group/btn"
                      >
                        <span className="font-mono text-sm uppercase tracking-wide group-hover/btn:tracking-wider transition-all">Assign Buoy</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedSpotId === spot.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {/* Buoy Selector Dropdown */}
                    {expandedSpotId === spot.id && (
                      <div className="mt-4 p-1 border border-border/50 bg-background/50 backdrop-blur-sm">
                        {buoyOptions.map((buoy) => (
                          <button
                            key={buoy.value}
                            onClick={() => assignBuoy(spot.id, buoy.value)}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors border-l-2 ${spot.buoyId === buoy.value
                              ? "bg-primary/10 text-primary border-primary"
                              : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground border-transparent hover:border-primary/50"
                              }`}
                          >
                            <span className="font-mono font-bold mr-3">{buoy.value}</span>
                            <span className="font-mono text-xs uppercase opacity-80">
                              {buoy.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="tech-card border-dashed border-border p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/20 mb-6 border border-border/50">
              <Waves className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-mono text-xl font-bold uppercase mb-3 text-foreground">No Spots</h3>
            <p className="text-muted-foreground text-base mb-8 leading-relaxed">
              Configure your first spots to begin intercepting swell signals.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="btn-brutal bg-transparent text-primary hover:bg-primary hover:text-background border-primary rounded-none h-auto py-3 px-8"
            >
              <Plus className="w-4 h-4 mr-2" />
              INITIATE TARGET
            </Button>
          </div>
        </div>
      )}

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
    </div>
  );
}
