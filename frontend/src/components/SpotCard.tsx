import { useState, useEffect, useMemo } from "react";
import { Select } from "./ui/Select";
import { AVAILABLE_ICONS } from "./ui/IconPickerModal";
import { Crosshair } from "lucide-react";
import { fetchForecastDataForTime, getTidePredictionsForDay, type ForecastTime } from "../services/api";
import { useTideData } from "../hooks/useTideData";
import { TideChart } from "./TideChart";

export interface BuoyData {
  waveHeight: number;
  wavePeriod: number;
  waterTemp: number;
  meanWaveDirection: string;
  meanWaveDegrees: number;
  timestamp: string;
  windSpeed?: number;
  windDirection?: string;
  windDegrees?: number;
}

export interface SwellComponent {
  height: number;
  period: number;
  direction: string;
  degrees: number;
}

export interface ForecastData {
  primary: SwellComponent;
  secondary: SwellComponent;
  windSpeed: number;
  windDirection: string;
  windDegrees: number;
  tide: number;
  airTemp: number;
  tideDirection: string;
}

export interface Spot {
  id: string;
  name: string;
  region?: string;
  lat?: number;
  lon?: number;
  buoyId?: string;
  buoyName?: string;
  buoy?: BuoyData;
  forecast?: ForecastData;
  status?: "epic" | "good" | "fair" | "poor" | "unknown";
  triggersMatched?: number;
  nextCheck?: string;
  icon?: string;
}

interface SpotCardProps {
  spot: Spot;
}

export function SpotCard({ spot }: SpotCardProps) {
  const [forecastSource, setForecastSource] = useState<"primary" | "secondary">("primary");
  const [forecastTime, setForecastTime] = useState<ForecastTime>("now");
  const [activeForecast, setActiveForecast] = useState<ForecastData | null | undefined>(spot.forecast);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Update active forecast when prop changes or time selector changes
  useEffect(() => {
    // If "now" is selected, use the passed-in forecast
    if (forecastTime === "now") {
      setActiveForecast(spot.forecast);
      setForecastError(null);
      if (spot.forecast) {
        setLastUpdated(new Date());
      }
      return;
    }

    // For tomorrow/next_day, fetch the data
    if (spot.lat === undefined || spot.lon === undefined) {
      setActiveForecast(null);
      setForecastError("No coordinates available");
      return;
    }

    let cancelled = false;
    setIsLoadingForecast(true);
    setForecastError(null);

    fetchForecastDataForTime(spot.lat, spot.lon, forecastTime)
      .then((result) => {
        if (!cancelled) {
          setActiveForecast(result.data);
          setForecastError(result.error);
          setLastUpdated(new Date());
          setIsLoadingForecast(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setActiveForecast(null);
          setForecastError(err.message || "Failed to fetch forecast");
          setIsLoadingForecast(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [forecastTime, spot.lat, spot.lon, spot.forecast]);

  // Format last updated time
  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  // Fetch tide data for this spot
  const { data: tideData, isLoading: tideLoading } = useTideData(spot.lat, spot.lon);

  // Get tide data for each day (for charts)
  const tideDays = useMemo(() => {
    if (!tideData) return null;
    return {
      today: getTidePredictionsForDay(tideData, 0),
      tomorrow: getTidePredictionsForDay(tideData, 1),
      nextDay: getTidePredictionsForDay(tideData, 2),
    };
  }, [tideData]);

  // Get tide direction arrow
  const getTideArrow = (direction: 'rising' | 'falling' | 'slack'): string => {
    switch (direction) {
      case 'rising': return '↑';
      case 'falling': return '↓';
      default: return '~';
    }
  };

  // Format tide time for display
  const formatTideTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${ampm}`;
  };

  const Icon = spot.icon && AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
    ? AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
    : Crosshair;

  return (
    <div className="border border-border/50 bg-secondary/10 transition-colors group relative overflow-hidden">
      {/* Header Row */}
      <div className="p-4 flex items-start justify-between gap-4 border-b border-border/30">
        <div className="min-w-0 flex items-center gap-3">
          <div className="h-6 w-6 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary/80 group-hover:text-primary transition-colors" />
          </div>
          <p className="font-mono font-bold text-lg tracking-tight truncate uppercase">{spot.name}</p>
        </div>


      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/30">


        {/* MODEL FORECAST (Forecast) - NOW FIRST & EMPHASIZED */}
        <div className="p-5 bg-background/20">
          <div className="mb-4 border-l-2  border-muted pl-3">
            <Select
              options={[
                { value: "now", label: "MODEL FORECAST NOW", shortLabel: "FORECAST NOW" },
                { value: "tomorrow", label: "MODEL FORECAST TOMORROW", shortLabel: "FORECAST TOMORROW" },
                { value: "next_day", label: "MODEL FORECAST THE NEXT DAY", shortLabel: "FORECAST NEXT DAY" },
              ]}
              value={forecastTime}
              onChange={(val) => setForecastTime(val as "now" | "tomorrow" | "next_day")}
              variant="model"
            />
          </div>

          {isLoadingForecast ? (
            <div className="h-full flex items-center justify-center p-4 border border-dashed border-border/20 rounded">
              <p className="font-mono text-sm text-muted-foreground/50 animate-pulse">LOADING...</p>
            </div>
          ) : activeForecast ? (
            <div className="space-y-4">
              {/* Last updated indicator */}
              {lastUpdated && (
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                  <span>Updated {formatLastUpdated(lastUpdated)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-border/10 pb-2">
                <Select
                  options={[
                    { value: "primary", label: "Primary swell", shortLabel: "PRI" },
                    { value: "secondary", label: "Secondary swell", shortLabel: "SEC" },
                  ]}
                  value={forecastSource}
                  onChange={(val) => setForecastSource(val as "primary" | "secondary")}
                  variant="ghost"
                />
                <span className="font-mono text-base font-normal">
                  {activeForecast[forecastSource].height}ft <span className="font-mono text-normal">@ {activeForecast[forecastSource].period}s</span>{" "}
                  <span className="text-muted-foreground/50 font-normal text-sm">
                    ⋅ {activeForecast[forecastSource].direction} {activeForecast[forecastSource].degrees}°
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">WND</span>
                <span className="font-mono text-base font-normal">
                  {activeForecast.windSpeed}kt <span className="text-muted-foreground/50 font-normal text-sm">⋅ {activeForecast.windDirection} {activeForecast.windDegrees}°</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">AIR</span>
                <span className="font-mono text-base font-normal">{activeForecast.airTemp}°F</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">TDE</span>
                {tideLoading ? (
                  <span className="font-mono text-sm text-muted-foreground/50 animate-pulse">...</span>
                ) : tideData && tideData.nextEvent ? (
                  <span className="font-mono text-base">
                    {tideData.currentHeight.toFixed(1)}ft{' '}
                    <span className="text-muted-foreground/50 font-normal text-sm">
                      {getTideArrow(tideData.currentDirection)}{' '}
                      {tideData.nextEvent.type === 'H' ? 'High' : 'Low'}{' '}
                      {tideData.nextEvent.height.toFixed(1)}ft @ {formatTideTime(tideData.nextEvent.time)}
                    </span>
                  </span>
                ) : tideData ? (
                  <span className="font-mono text-base">
                    {tideData.currentHeight.toFixed(1)}ft
                  </span>
                ) : (
                  <span className="font-mono text-sm text-muted-foreground/50">N/A</span>
                )}
              </div>
              {/* Tide Charts for tomorrow/next day */}
              {tideDays && forecastTime !== 'now' && (
                <div className="pt-2">
                  <TideChart
                    hourly={forecastTime === 'tomorrow' ? tideDays.tomorrow.hourly : tideDays.nextDay.hourly}
                    hiLo={forecastTime === 'tomorrow' ? tideDays.tomorrow.hiLo : tideDays.nextDay.hiLo}
                    label={forecastTime === 'tomorrow' ? "TIDE TOMORROW" : "TIDE NEXT DAY"}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-4 border border-dashed border-border/20 rounded gap-2">
              <p className="font-mono text-sm text-muted-foreground/50">NO FORECAST DATA</p>
              {forecastError && (
                <p className="font-mono text-xs text-destructive/50">{forecastError}</p>
              )}
            </div>
          )}
        </div>

        {/* LIVE SIGNAL (Buoy) - NOW SECOND & DE-EMPHASIZED */}
        <div className="p-5 bg-background/20">
          <p className="font-mono text-xs tracking-widest text-muted-foreground/50 mb-4 border-l-2 border-muted pl-3 uppercase truncate">
            {spot.buoyName || 'NO SIGNAL'}
          </p>

          {spot.buoy ? (
            <div className="space-y-4">
              {/* Last reading timestamp */}
              {spot.buoy.timestamp && (
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                  <span>Reading {spot.buoy.timestamp}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">WAV</span>
                <span className="font-mono text-base">
                  {spot.buoy.waveHeight}ft <span className="text-muted-foreground font-normal text-sm">@ {spot.buoy.wavePeriod}s</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">DIR</span>
                <span className="font-mono text-base font-normal">
                  {spot.buoy.windSpeed || '-'}kt <span className="text-muted-foreground/50 font-normal text-sm">⋅ {spot.buoy.windDirection || spot.buoy.meanWaveDirection} {spot.buoy.windDegrees || spot.buoy.meanWaveDegrees}°</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">H2O</span>
                <span className="font-mono text-base font-normal">{spot.buoy.waterTemp}°F</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4 border border-dashed border-border/20 rounded">
              <p className="font-mono text-sm text-muted-foreground/50">NO SIGNAL</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
