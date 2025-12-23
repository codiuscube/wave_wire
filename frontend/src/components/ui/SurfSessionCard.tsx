import { TrashBinMinimalistic, Pen } from '@solar-icons/react';
import type { SurfSession, SessionQuality, SessionCrowd } from '../../lib/mappers';

interface SurfSessionCardProps {
  session: SurfSession;
  spotName: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Quality badge colors - match trigger condition colors
const QUALITY_COLORS: Record<SessionQuality, string> = {
  epic: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  good: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  fair: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  poor: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  flat: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const QUALITY_LABELS: Record<SessionQuality, string> = {
  epic: 'Epic',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  flat: 'Flat',
};

const CROWD_LABELS: Record<SessionCrowd, string> = {
  empty: 'Empty',
  light: 'Light',
  moderate: 'Moderate',
  crowded: 'Crowded',
  packed: 'Packed',
};

// Duration labels
const getDurationLabel = (minutes: number): string => {
  if (minutes >= 180) return '3+ hours';
  if (minutes >= 150) return '2.5 hours';
  if (minutes >= 120) return '2 hours';
  if (minutes >= 90) return '1.5 hours';
  if (minutes >= 60) return '1 hour';
  return '30 min';
};

// Format date for display
const formatSessionDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Format conditions for display
const formatConditions = (session: SurfSession): string | null => {
  const c = session.conditions;
  if (!c) return null;

  const parts: string[] = [];

  if (c.waveHeight != null && c.wavePeriod != null) {
    parts.push(`${c.waveHeight}ft @ ${c.wavePeriod}s`);
  }

  if (c.windSpeed != null) {
    parts.push(`${c.windSpeed}kt wind`);
  }

  if (c.tideHeight != null && c.tideState) {
    parts.push(`${c.tideHeight}ft ${c.tideState}`);
  }

  return parts.length > 0 ? parts.join(' / ') : null;
};

// Cardinal direction from degrees
const degreesToCardinal = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

export function SurfSessionCard({ session, spotName, onEdit, onDelete }: SurfSessionCardProps) {
  const conditions = formatConditions(session);
  const swellDir = session.conditions?.swellDirection;

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-border/80 transition-colors">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded border text-xs font-medium ${QUALITY_COLORS[session.quality]}`}
            >
              {QUALITY_LABELS[session.quality]}
            </span>
            <span className="text-sm text-muted-foreground">
              {spotName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatSessionDate(session.sessionDate)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
              title="Edit session"
            >
              <Pen size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
              title="Delete session"
            >
              <TrashBinMinimalistic size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Conditions Row */}
      {conditions && (
        <div className="font-mono text-sm text-foreground mb-2">
          {conditions}
          {swellDir != null && (
            <span className="text-muted-foreground ml-2">
              from {degreesToCardinal(swellDir)}
            </span>
          )}
        </div>
      )}

      {/* Meta Row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{getDurationLabel(session.durationMinutes)}</span>
        <span className="text-border">/</span>
        <span>{CROWD_LABELS[session.crowd]} crowd</span>
      </div>

      {/* Notes */}
      {session.notes && (
        <p className="mt-2 text-sm text-muted-foreground italic border-l-2 border-border pl-3">
          {session.notes}
        </p>
      )}
    </div>
  );
}

export default SurfSessionCard;
