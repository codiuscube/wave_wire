import { useMemo, useState } from 'react';
import type { HourlyTide, TidePrediction } from '../services/api';

interface TideChartProps {
  hourly: HourlyTide[];
  hiLo: TidePrediction[];
  label: string;
  showLabels?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  height: number;
  time: Date;
}

/**
 * Interactive SVG-based tide "hump" chart
 * Shows 24 hours of tide data as a smooth curve with hover tooltips
 */
export function TideChart({ hourly, hiLo, label, showLabels = true }: TideChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);

  const chartData = useMemo(() => {
    if (hourly.length === 0) return null;

    // Find min/max for scaling
    const heights = hourly.map(h => h.height);
    const minHeight = Math.min(...heights);
    const maxHeight = Math.max(...heights);
    const range = maxHeight - minHeight || 1;

    // Chart dimensions
    const width = 100;
    const height = 40;
    const padding = 2;

    // Create SVG path points
    const points = hourly.map((h, i) => {
      const x = padding + (i / (hourly.length - 1)) * (width - padding * 2);
      const y = height - padding - ((h.height - minHeight) / range) * (height - padding * 2);
      return { x, y, height: h.height, time: h.time };
    });

    // Create smooth curve using quadratic bezier
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      pathD += ` Q ${prev.x} ${prev.y} ${cpX} ${(prev.y + curr.y) / 2}`;
    }
    // Final point
    const last = points[points.length - 1];
    pathD += ` L ${last.x} ${last.y}`;

    // Find high/low markers positions
    const markers = hiLo.map(hl => {
      // Find closest hourly point
      const hourlyIndex = hourly.findIndex(h =>
        Math.abs(h.time.getTime() - hl.time.getTime()) < 60 * 60 * 1000
      );
      if (hourlyIndex === -1) return null;

      const point = points[hourlyIndex];
      if (!point) return null;

      return {
        x: point.x,
        y: point.y,
        type: hl.type,
        height: hl.height,
        time: hl.time,
      };
    }).filter(Boolean);

    return { points, pathD, markers, minHeight, maxHeight, width, height };
  }, [hourly, hiLo]);

  if (!chartData) {
    return (
      <div className="h-12 flex items-center justify-center">
        <span className="text-xs text-muted-foreground/50 font-mono">NO DATA</span>
      </div>
    );
  }

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'p' : 'a';
    const displayHour = hours % 12 || 12;
    return `${displayHour}${ampm}`;
  };

  const formatTooltipTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * chartData.width;

    // Find closest point
    let closestPoint = chartData.points[0];
    let closestDist = Math.abs(x - closestPoint.x);

    for (const point of chartData.points) {
      const dist = Math.abs(x - point.x);
      if (dist < closestDist) {
        closestDist = dist;
        closestPoint = point;
      }
    }

    setTooltip(closestPoint);
    setTooltipPosition({
      left: e.clientX - rect.left,
      top: e.clientY - rect.top - 40,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    setTooltipPosition(null);
  };

  return (
    <div className="space-y-1">
      {showLabels && (
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-muted-foreground/50 uppercase">{label}</span>
          <span className="text-xs font-mono text-muted-foreground/30">
            {chartData.minHeight.toFixed(1)}-{chartData.maxHeight.toFixed(1)}ft
          </span>
        </div>
      )}
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="w-full h-12 cursor-crosshair"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Fill under curve */}
          <path
            d={`${chartData.pathD} L ${chartData.width - 2} ${chartData.height - 2} L 2 ${chartData.height - 2} Z`}
            fill="currentColor"
            className="text-primary/10"
          />
          {/* Main curve */}
          <path
            d={chartData.pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-primary/40"
          />
          {/* Hover indicator line */}
          {tooltip && (
            <line
              x1={tooltip.x}
              y1={2}
              x2={tooltip.x}
              y2={chartData.height - 2}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              className="text-primary/60"
            />
          )}
          {/* Hover point */}
          {tooltip && (
            <circle
              cx={tooltip.x}
              cy={tooltip.y}
              r="3"
              className="fill-primary"
            />
          )}
        </svg>
        {/* Tooltip */}
        {tooltip && tooltipPosition && (
          <div
            className="absolute pointer-events-none bg-background/95 border border-border/50 px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap"
            style={{
              left: Math.min(tooltipPosition.left, 120),
              top: tooltipPosition.top,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="font-mono text-xs">
              <span className="text-primary font-medium">{tooltip.height.toFixed(1)}ft</span>
              <span className="text-muted-foreground/60"> @ {formatTooltipTime(tooltip.time)}</span>
            </span>
          </div>
        )}
        {/* Time labels for high/low */}
        {showLabels && chartData.markers.length > 0 && (
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground/40 mt-0.5 px-0.5">
            {chartData.markers.slice(0, 4).map((marker, i) => marker && (
              <span key={i} className={marker.type === 'H' ? 'text-primary/60' : ''}>
                {marker.type === 'H' ? '▲' : '▼'}{formatTime(marker.time)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TideChart;
