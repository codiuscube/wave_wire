import { useState } from "react";
import { Select } from "./ui/Select";

export interface BuoyData {
  waveHeight: number;
  wavePeriod: number;
  waterTemp: number;
  meanWaveDirection: string;
  meanWaveDegrees: number;
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
  tide: number;
  airTemp: number;
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
}

interface SpotCardProps {
  spot: Spot;
}

export function SpotCard({ spot }: SpotCardProps) {
  const [forecastSource, setForecastSource] = useState<"primary" | "secondary">("primary");

  return (
    <div className="border border-border/50 bg-secondary/10 transition-colors group relative overflow-hidden">
      {/* Header Row */}
      <div className="p-4 flex items-start justify-between gap-4 border-b border-border/30">
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-2 h-2 bg-primary/50 group-hover:bg-primary transition-colors" />
          <p className="font-mono font-bold text-lg tracking-tight truncate uppercase">{spot.name}</p>
        </div>


      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/30">


        {/* MODEL FORECAST (Forecast) - NOW FIRST & EMPHASIZED */}
        <div className="p-5 bg-background/20">
          <p className="font-mono text-xs tracking-widest text-muted-foreground/70 mb-4 border-l-2 border-primary/40 pl-3 uppercase">
            Model Forecast
          </p>

          {spot.forecast ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border/10 pb-2">
                <Select
                  options={[
                    { value: "primary", label: "PRI" },
                    { value: "secondary", label: "SEC" },
                  ]}
                  value={forecastSource}
                  onChange={(val) => setForecastSource(val as "primary" | "secondary")}
                  variant="ghost"
                />
                <span className="font-mono text-base font-normal">
                  {spot.forecast[forecastSource].height}ft <span className="font-normal">@ {spot.forecast[forecastSource].period}s</span>{" "}
                  <span className="text-muted-foreground/50 font-normal text-sm">
                    ⋅ {spot.forecast[forecastSource].direction} {spot.forecast[forecastSource].degrees}°
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">WND</span>
                <span className="font-mono text-base">
                  {spot.forecast.windSpeed}kt <span className="text-muted-foreground/50 font-normal text-sm">⋅ {spot.forecast.windDirection}</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">TDE</span>
                <span className="font-mono text-base">{spot.forecast.tide}ft</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4 border border-dashed border-border/20 rounded">
              <p className="font-mono text-sm text-muted-foreground/50">NO FORECAST DATA</p>
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
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">WAV</span>
                <span className="font-mono text-base">
                  {spot.buoy.waveHeight}ft <span className="text-muted-foreground font-normal text-sm">@ {spot.buoy.wavePeriod}s</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">DIR</span>
                <span className="text-muted-foreground font-mono text-sm">
                  {spot.buoy.meanWaveDirection} <span className="text-muted-foreground font-normal text-sm">{spot.buoy.meanWaveDegrees}°</span>
                </span>
              </div>
              <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                <span className="font-mono text-sm text-muted-foreground">H2O</span>
                <span className="font-mono text-normal">{spot.buoy.waterTemp}°F</span>
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
