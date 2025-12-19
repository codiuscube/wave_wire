import { useState, useEffect, useMemo } from "react";
import { Select } from "./ui/Select";
import { AVAILABLE_ICONS } from "./ui/IconPickerModal";
import { Target, MapPoint } from '@solar-icons/react';
import { fetchForecastDataForTime, getTidePredictionsForDay, type ForecastTime } from "../services/api";
import { useTideData } from "../hooks/useTideData";
import { TideChart } from "./TideChart";

// Scrambled placeholder text generator for skeleton loading
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const useScrambledText = (length: number, interval = 50) => {
  const [text, setText] = useState(() =>
    Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
  );

  useEffect(() => {
    const id = setInterval(() => {
      setText(Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join(""));
    }, interval);
    return () => clearInterval(id);
  }, [length, interval]);

  return text;
};

// Skeleton row component
const SkeletonRow = ({ label, format }: { label: string; format: "value" | "value-unit" | "value-at-unit" | "value-dir" }) => {
  const v1 = useScrambledText(3, 80);
  const v2 = useScrambledText(2, 90);
  const v3 = useScrambledText(3, 70);

  return (
    <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
      <span className="font-mono text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-base font-normal text-muted-foreground/30">
        {format === "value" && <>{v1}</>}
        {format === "value-unit" && <>{v1}°F</>}
        {format === "value-at-unit" && <>{v1}ft @ {v2}s</>}
        {format === "value-dir" && <>{v1}kt ⋅ {v3} {v2}°</>}
      </span>
    </div>
  );
};

export interface BuoyData {
  waveHeight: number;
  wavePeriod: number;
  waterTemp: number;
  meanWaveDirection: string;
  meanWaveDegrees: number;
  timestamp: string;
  windSpeed?: number;
  windGust?: number;
  windDirection?: string;
  windDegrees?: number;
  airTemp?: number;
  pressure?: number;
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
  buoyLoading?: boolean;
  forecastLoading?: boolean;
}

export function SpotCard({ spot, buoyLoading = false, forecastLoading = false }: SpotCardProps) {
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

  // Format tide time for display (moved up for use in summary fetch)
  const formatTideTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${ampm}`;
  };

  // Fetch Claude wave summary when data is ready - DISABLED
  // useEffect(() => {
  //   // Only fetch when we have data, not loading, not already fetched, and not failed
  //   if ((!spot.buoy && !spot.forecast) || summaryLoading || summaryFailed) return;

  //   // Skip if we already have a summary that's less than 1 hour old
  //   const ONE_HOUR_MS = 60 * 60 * 1000;
  //   if (waveSummary && summaryFetchedAt && (Date.now() - summaryFetchedAt) < ONE_HOUR_MS) {
  //     return;
  //   }

  //   const fetchSummary = async () => {
  //     setSummaryLoading(true);
  //     try {
  //       const response = await fetch('/api/wave-summary', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           spotName: spot.name,
  //           region: spot.region,
  //           buoy: spot.buoy,
  //           forecast: spot.forecast,
  //           tide: tideData ? {
  //             currentHeight: tideData.currentHeight,
  //             currentDirection: tideData.currentDirection,
  //             nextEventType: tideData.nextEvent?.type === 'H' ? 'high' : 'low',
  //             nextEventHeight: tideData.nextEvent?.height,
  //             nextEventTime: tideData.nextEvent ? formatTideTime(tideData.nextEvent.time) : undefined,
  //           } : undefined,
  //         }),
  //       });

  //       if (response.ok) {
  //         const data = await response.json();
  //         const now = Date.now();
  //         setWaveSummary(data.summary);
  //         setLocalKnowledge(data.localKnowledge);
  //         setSummaryFetchedAt(now);
  //         // Persist to localStorage
  //         try {
  //           localStorage.setItem(summaryKey, JSON.stringify({
  //             summary: data.summary,
  //             localKnowledge: data.localKnowledge,
  //             fetchedAt: now
  //           }));
  //         } catch {}
  //       } else {
  //         // Mark as failed to prevent retries (e.g., 404 in local dev)
  //         console.warn(`[${spot.name}] Wave summary API returned ${response.status}`);
  //         setSummaryFailed(true);
  //       }
  //     } catch (err) {
  //       console.error('Failed to fetch wave summary:', err);
  //       setSummaryFailed(true);
  //     } finally {
  //       setSummaryLoading(false);
  //     }
  //   };

  //   fetchSummary();
  // }, [spot.buoy, spot.forecast, spot.name, spot.region, tideData, summaryLoading, waveSummary, summaryFailed, summaryFetchedAt, summaryKey]);

  // Get tide direction arrow
  const getTideArrow = (direction: 'rising' | 'falling' | 'slack'): string => {
    switch (direction) {
      case 'rising': return '↑';
      case 'falling': return '↓';
      default: return '~';
    }
  };

  const Icon = spot.icon && AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
    ? AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
    : Target;

  return (
    <div className="border border-border/50 bg-secondary/10 transition-colors group relative overflow-hidden">
      {/* Header Row */}
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 flex items-center justify-center">
            <Icon weight="BoldDuotone" size={20} className="text-primary/80 group-hover:text-primary transition-colors" />
          </div>
          <p className="font-mono font-bold text-lg tracking-tight truncate uppercase">{spot.name}</p>
        </div>

        {spot.lat !== undefined && spot.lon !== undefined && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-primary transition-colors group/link shrink-0"
            title="View on Google Maps"
            onClick={(e) => e.stopPropagation()}
          >
            <MapPoint weight="Bold" size={16} />
            <span className="font-mono text-xs whitespace-nowrap tracking-tighter hover:underline decoration-primary/50 underline-offset-4">
              {spot.lat.toFixed(3)} / {spot.lon.toFixed(3)}
            </span>
          </a>
        )} 
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

          {(isLoadingForecast || (forecastLoading && !activeForecast)) ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/20">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 animate-pulse" />
                <span>Loading...</span>
              </div>
              <SkeletonRow label="PRI" format="value-at-unit" />
              <SkeletonRow label="WND" format="value-dir" />
              <SkeletonRow label="AIR" format="value-unit" />
              <SkeletonRow label="TDE" format="value-at-unit" />
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
              {/* Tide Charts */}
              {tideDays && (
                <div className="pt-2">
                  <TideChart
                    hourly={
                      forecastTime === 'now' ? tideDays.today.hourly :
                        forecastTime === 'tomorrow' ? tideDays.tomorrow.hourly :
                          tideDays.nextDay.hourly
                    }
                    hiLo={
                      forecastTime === 'now' ? tideDays.today.hiLo :
                        forecastTime === 'tomorrow' ? tideDays.tomorrow.hiLo :
                          tideDays.nextDay.hiLo
                    }
                    label={
                      forecastTime === 'now' ? "TIDE TODAY" :
                        forecastTime === 'tomorrow' ? "TIDE TOMORROW" :
                          "TIDE NEXT DAY"
                    }
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

          {buoyLoading && !spot.buoy ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/20">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 animate-pulse" />
                <span>Connecting...</span>
              </div>
              <SkeletonRow label="SWL" format="value-at-unit" />
              <SkeletonRow label="WND" format="value-dir" />
              <SkeletonRow label="AIR" format="value-unit" />
              <SkeletonRow label="H2O" format="value-unit" />
              <SkeletonRow label="PRS" format="value" />
            </div>
          ) : spot.buoy ? (
            <div className="space-y-4">
              {/* Last reading timestamp */}
              {spot.buoy.timestamp && (
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                  <span>Reading {spot.buoy.timestamp}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">SWL</span>
                <span className="font-mono text-base">
                  {spot.buoy.waveHeight}ft @ {spot.buoy.wavePeriod}s{" "}
                  <span className="text-muted-foreground/50 font-normal text-sm">⋅ {spot.buoy.meanWaveDirection} {spot.buoy.meanWaveDegrees}°</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">WND</span>
                {(spot.buoy.windGust || spot.buoy.windSpeed) ? (
                  <span className="font-mono text-base font-normal">
                    {spot.buoy.windGust ? `${spot.buoy.windGust}kt gust` : `${spot.buoy.windSpeed}kt`}{" "}
                    <span className="text-muted-foreground/50 font-normal text-sm">⋅ {spot.buoy.windDirection} {spot.buoy.windDegrees}°</span>
                  </span>
                ) : (
                  <span className="font-mono text-sm text-muted-foreground/50">N/A</span>
                )}
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">AIR</span>
                {spot.buoy.airTemp ? (
                  <span className="font-mono text-base font-normal">{spot.buoy.airTemp}°F</span>
                ) : (
                  <span className="font-mono text-sm text-muted-foreground/50">N/A</span>
                )}
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">H2O</span>
                <span className="font-mono text-base font-normal">{spot.buoy.waterTemp}°F</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">PRS</span>
                {spot.buoy.pressure ? (
                  <span className="font-mono text-base font-normal">{spot.buoy.pressure} hPa</span>
                ) : (
                  <span className="font-mono text-sm text-muted-foreground/50">N/A</span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4 border border-dashed border-border/20 rounded">
              <p className="font-mono text-sm text-muted-foreground/50">NO SIGNAL</p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
