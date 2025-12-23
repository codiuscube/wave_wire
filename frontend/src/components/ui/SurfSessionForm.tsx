import { useState, useEffect, useCallback } from 'react';
import { Select } from './Select';
import type { UserSpot } from '../../lib/mappers';
import type { SessionConditions, SessionQuality, SessionCrowd } from '../../lib/mappers';

// Simple spinner component
const Spinner = ({ className = '' }: { className?: string }) => (
  <div className={`border-2 border-current/30 border-t-current rounded-full animate-spin ${className}`} />
);

interface SurfSessionFormProps {
  spots: UserSpot[];
  initialData?: {
    spotId: string;
    sessionDate: string;
    durationMinutes: number;
    quality: SessionQuality;
    crowd: SessionCrowd;
    notes: string;
    conditions: SessionConditions | null;
  };
  onSubmit: (data: {
    spotId: string;
    sessionDate: string;
    durationMinutes: number;
    quality: SessionQuality;
    crowd: SessionCrowd;
    notes: string | null;
    conditions: SessionConditions | null;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const QUALITY_OPTIONS = [
  { value: 'epic', label: 'Epic' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'flat', label: 'Flat' },
];

const CROWD_OPTIONS = [
  { value: 'empty', label: 'Empty' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'crowded', label: 'Crowded' },
  { value: 'packed', label: 'Packed' },
];

const DURATION_OPTIONS = [
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: '150', label: '2.5 hours' },
  { value: '180', label: '3+ hours' },
];

// Format date for datetime-local input (YYYY-MM-DDTHH:MM)
const formatDateForInput = (dateStr?: string): string => {
  const date = dateStr ? new Date(dateStr) : new Date();
  // Adjust to local timezone
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

// Format conditions for display
const formatConditions = (conditions: SessionConditions | null): string => {
  if (!conditions) return 'No conditions data';

  const parts: string[] = [];
  if (conditions.waveHeight != null && conditions.wavePeriod != null) {
    parts.push(`${conditions.waveHeight}ft @ ${conditions.wavePeriod}s`);
  }
  if (conditions.windSpeed != null) {
    parts.push(`${conditions.windSpeed}kt wind`);
  }
  if (conditions.tideHeight != null && conditions.tideState) {
    parts.push(`${conditions.tideHeight}ft ${conditions.tideState}`);
  }

  return parts.length > 0 ? parts.join(' / ') : 'Conditions unavailable';
};

export function SurfSessionForm({
  spots,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: SurfSessionFormProps) {
  // Form state
  const [spotId, setSpotId] = useState(initialData?.spotId || spots[0]?.id || '');
  const [sessionDate, setSessionDate] = useState(formatDateForInput(initialData?.sessionDate));
  const [duration, setDuration] = useState(String(initialData?.durationMinutes || 60));
  const [quality, setQuality] = useState<SessionQuality>(initialData?.quality || 'good');
  const [crowd, setCrowd] = useState<SessionCrowd>(initialData?.crowd || 'moderate');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Conditions state
  const [conditions, setConditions] = useState<SessionConditions | null>(
    initialData?.conditions || null
  );
  const [isFetchingConditions, setIsFetchingConditions] = useState(false);
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  // Get selected spot
  const selectedSpot = spots.find((s) => s.id === spotId);

  // Fetch conditions when spot or date changes
  const fetchConditions = useCallback(async () => {
    if (!selectedSpot?.latitude || !selectedSpot?.longitude) {
      setConditions(null);
      setConditionsError('Spot has no coordinates');
      return;
    }

    setIsFetchingConditions(true);
    setConditionsError(null);

    try {
      // Convert local datetime to ISO
      const localDate = new Date(sessionDate);
      const isoTimestamp = localDate.toISOString();

      const response = await fetch(
        `/api/fetch-conditions?` +
          `lat=${selectedSpot.latitude}&` +
          `lon=${selectedSpot.longitude}&` +
          `timestamp=${encodeURIComponent(isoTimestamp)}&` +
          `timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch conditions');
      }

      const data: SessionConditions = await response.json();
      setConditions(data);
    } catch (err) {
      console.error('Error fetching conditions:', err);
      setConditionsError(err instanceof Error ? err.message : 'Failed to fetch conditions');
      setConditions(null);
    } finally {
      setIsFetchingConditions(false);
    }
  }, [selectedSpot, sessionDate]);

  // Auto-fetch on spot/date change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (spotId && sessionDate) {
        fetchConditions();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [spotId, sessionDate, fetchConditions]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!spotId) return;

    // Convert local datetime to ISO
    const localDate = new Date(sessionDate);

    await onSubmit({
      spotId,
      sessionDate: localDate.toISOString(),
      durationMinutes: parseInt(duration, 10),
      quality,
      crowd,
      notes: notes.trim() || null,
      conditions,
    });
  };

  // Spot options for select
  const spotOptions = spots.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Spot Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Spot</label>
        <Select
          options={spotOptions}
          value={spotId}
          onChange={setSpotId}
          placeholder="Select a spot"
        />
      </div>

      {/* Date/Time */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Date & Time
        </label>
        <input
          type="datetime-local"
          value={sessionDate}
          onChange={(e) => setSessionDate(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          required
        />
      </div>

      {/* Conditions Preview */}
      <div className="bg-muted/50 rounded-md p-3 border border-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Conditions
          </span>
          {isFetchingConditions && <Spinner className="w-3 h-3" />}
        </div>
        <div className="font-mono text-sm">
          {isFetchingConditions ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : conditionsError ? (
            <span className="text-destructive">{conditionsError}</span>
          ) : (
            <span className="text-foreground">{formatConditions(conditions)}</span>
          )}
        </div>
        {conditions?.source && (
          <span className="text-xs text-muted-foreground">
            Source: {conditions.source === 'historical' ? 'Historical data' : 'Live forecast'}
          </span>
        )}
      </div>

      {/* Quality & Crowd Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Quality
          </label>
          <Select
            options={QUALITY_OPTIONS}
            value={quality}
            onChange={(v) => setQuality(v as SessionQuality)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Crowd
          </label>
          <Select
            options={CROWD_OPTIONS}
            value={crowd}
            onChange={(v) => setCrowd(v as SessionCrowd)}
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Duration
        </label>
        <Select
          options={DURATION_OPTIONS}
          value={duration}
          onChange={setDuration}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was it? Any standout waves?"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 h-10 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !spotId}
          className="flex-1 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Spinner className="w-4 h-4" />}
          {initialData ? 'Save Changes' : 'Log Session'}
        </button>
      </div>
    </form>
  );
}

export default SurfSessionForm;
