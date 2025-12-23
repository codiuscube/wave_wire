import { useState, useEffect, useCallback } from 'react';
import { Refresh, AltArrowDown } from '@solar-icons/react';
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

const TIDE_STATE_OPTIONS = [
  { value: '', label: 'Unknown' },
  { value: 'rising', label: 'Rising' },
  { value: 'falling', label: 'Falling' },
];

// Format date for datetime-local input (YYYY-MM-DDTHH:MM)
const formatDateForInput = (dateStr?: string): string => {
  const date = dateStr ? new Date(dateStr) : new Date();
  // Adjust to local timezone
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

// Get source display label
const getSourceLabel = (source: 'live' | 'historical' | 'custom' | null): string => {
  switch (source) {
    case 'live': return 'Live forecast';
    case 'historical': return 'Historical data';
    case 'custom': return 'Custom';
    default: return 'Not fetched';
  }
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

  // Individual condition states for editing
  const [waveHeight, setWaveHeight] = useState<string>('');
  const [wavePeriod, setWavePeriod] = useState<string>('');
  const [swellHeight, setSwellHeight] = useState<string>('');
  const [swellPeriod, setSwellPeriod] = useState<string>('');
  const [swellDirection, setSwellDirection] = useState<string>('');
  const [windWaveHeight, setWindWaveHeight] = useState<string>('');
  const [windSpeed, setWindSpeed] = useState<string>('');
  const [windGusts, setWindGusts] = useState<string>('');
  const [windDirection, setWindDirection] = useState<string>('');
  const [tideHeight, setTideHeight] = useState<string>('');
  const [tideState, setTideState] = useState<'rising' | 'falling' | ''>('');
  const [waterTemp, setWaterTemp] = useState<string>('');
  const [conditionsSource, setConditionsSource] = useState<'live' | 'historical' | 'custom' | null>(null);

  // Fetch state
  const [isFetchingConditions, setIsFetchingConditions] = useState(false);
  const [conditionsError, setConditionsError] = useState<string | null>(null);
  const [isConditionsExpanded, setIsConditionsExpanded] = useState(false);

  // Initialize condition fields from initialData (for editing existing sessions)
  useEffect(() => {
    if (initialData?.conditions) {
      const c = initialData.conditions;
      setWaveHeight(c.waveHeight?.toString() ?? '');
      setWavePeriod(c.wavePeriod?.toString() ?? '');
      setSwellHeight(c.swellHeight?.toString() ?? '');
      setSwellPeriod(c.swellPeriod?.toString() ?? '');
      setSwellDirection(c.swellDirection?.toString() ?? '');
      setWindWaveHeight(c.windWaveHeight?.toString() ?? '');
      setWindSpeed(c.windSpeed?.toString() ?? '');
      setWindGusts(c.windGusts?.toString() ?? '');
      setWindDirection(c.windDirection?.toString() ?? '');
      setTideHeight(c.tideHeight?.toString() ?? '');
      setTideState(c.tideState ?? '');
      setWaterTemp(c.waterTemp?.toString() ?? '');
      setConditionsSource(c.source);
      setIsConditionsExpanded(true);
    }
  }, [initialData]);

  // Get selected spot
  const selectedSpot = spots.find((s) => s.id === spotId);

  // Fetch conditions manually
  const fetchConditions = useCallback(async () => {
    if (!selectedSpot?.latitude || !selectedSpot?.longitude) {
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

      // Populate all fields from fetched data
      setWaveHeight(data.waveHeight?.toString() ?? '');
      setWavePeriod(data.wavePeriod?.toString() ?? '');
      setSwellHeight(data.swellHeight?.toString() ?? '');
      setSwellPeriod(data.swellPeriod?.toString() ?? '');
      setSwellDirection(data.swellDirection?.toString() ?? '');
      setWindWaveHeight(data.windWaveHeight?.toString() ?? '');
      setWindSpeed(data.windSpeed?.toString() ?? '');
      setWindGusts(data.windGusts?.toString() ?? '');
      setWindDirection(data.windDirection?.toString() ?? '');
      setTideHeight(data.tideHeight?.toString() ?? '');
      setTideState(data.tideState ?? '');
      setWaterTemp(data.waterTemp?.toString() ?? '');
      setConditionsSource(data.source);
      setIsConditionsExpanded(true);
    } catch (err) {
      console.error('Error fetching conditions:', err);
      setConditionsError(err instanceof Error ? err.message : 'Failed to fetch conditions');
    } finally {
      setIsFetchingConditions(false);
    }
  }, [selectedSpot, sessionDate]);

  // Mark as custom when any condition is edited
  const handleConditionChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
    if (conditionsSource !== null && conditionsSource !== 'custom') {
      setConditionsSource('custom');
    }
  };

  // Build conditions object for submission
  const buildConditions = (): SessionConditions | null => {
    // Only include conditions if we have data
    if (conditionsSource === null) return null;

    return {
      waveHeight: waveHeight ? parseFloat(waveHeight) : null,
      wavePeriod: wavePeriod ? parseFloat(wavePeriod) : null,
      swellHeight: swellHeight ? parseFloat(swellHeight) : null,
      swellPeriod: swellPeriod ? parseFloat(swellPeriod) : null,
      swellDirection: swellDirection ? parseFloat(swellDirection) : null,
      windWaveHeight: windWaveHeight ? parseFloat(windWaveHeight) : null,
      windSpeed: windSpeed ? parseFloat(windSpeed) : null,
      windGusts: windGusts ? parseFloat(windGusts) : null,
      windDirection: windDirection ? parseFloat(windDirection) : null,
      tideHeight: tideHeight ? parseFloat(tideHeight) : null,
      tideState: tideState || null,
      waterTemp: waterTemp ? parseFloat(waterTemp) : null,
      fetchedAt: new Date().toISOString(),
      source: conditionsSource,
    };
  };

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
      conditions: buildConditions(),
    });
  };

  // Spot options for select
  const spotOptions = spots.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  // Condition input component
  const ConditionInput = ({
    label,
    value,
    onChange,
    unit,
    placeholder = '',
    min,
    max,
    step = '0.1',
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    unit: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => handleConditionChange(onChange, e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  );

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

      {/* Fetch Conditions Button */}
      <button
        type="button"
        onClick={fetchConditions}
        disabled={isFetchingConditions || !spotId || !sessionDate}
        className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-primary/50 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isFetchingConditions ? (
          <>
            <Spinner className="w-4 h-4" />
            Fetching...
          </>
        ) : (
          <>
            <Refresh weight="Bold" size={16} />
            Fetch Conditions for This Date
          </>
        )}
      </button>

      {/* Conditions Section */}
      <div className="bg-muted/50 rounded-md border border-border overflow-hidden">
        {/* Header */}
        <button
          type="button"
          onClick={() => setIsConditionsExpanded(!isConditionsExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Conditions
            </span>
            {conditionsSource && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                conditionsSource === 'custom'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-primary/10 text-primary'
              }`}>
                {getSourceLabel(conditionsSource)}
              </span>
            )}
          </div>
          <AltArrowDown
            weight="Bold"
            size={14}
            className={`text-muted-foreground transition-transform ${isConditionsExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Error */}
        {conditionsError && (
          <div className="px-3 pb-3">
            <span className="text-destructive text-sm">{conditionsError}</span>
          </div>
        )}

        {/* Expanded Content */}
        {isConditionsExpanded && (
          <div className="p-3 pt-0 space-y-4">
            {/* Waves Section */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Waves
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ConditionInput
                  label="Total Height"
                  value={waveHeight}
                  onChange={setWaveHeight}
                  unit="ft"
                  min={0}
                  max={50}
                />
                <ConditionInput
                  label="Mean Period"
                  value={wavePeriod}
                  onChange={setWavePeriod}
                  unit="s"
                  min={0}
                  max={30}
                  step="1"
                />
              </div>
            </div>

            {/* Swell Section */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Primary Swell
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <ConditionInput
                  label="Height"
                  value={swellHeight}
                  onChange={setSwellHeight}
                  unit="ft"
                  min={0}
                  max={50}
                />
                <ConditionInput
                  label="Peak Period"
                  value={swellPeriod}
                  onChange={setSwellPeriod}
                  unit="s"
                  min={0}
                  max={30}
                  step="1"
                />
              </div>
              <ConditionInput
                label="Direction"
                value={swellDirection}
                onChange={setSwellDirection}
                unit="°"
                min={0}
                max={360}
                step="1"
              />
            </div>

            {/* Wind Section */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Wind
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <ConditionInput
                  label="Speed"
                  value={windSpeed}
                  onChange={setWindSpeed}
                  unit="kt"
                  min={0}
                  max={100}
                  step="1"
                />
                <ConditionInput
                  label="Gusts"
                  value={windGusts}
                  onChange={setWindGusts}
                  unit="kt"
                  min={0}
                  max={100}
                  step="1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ConditionInput
                  label="Direction"
                  value={windDirection}
                  onChange={setWindDirection}
                  unit="°"
                  min={0}
                  max={360}
                  step="1"
                />
                <ConditionInput
                  label="Chop Height"
                  value={windWaveHeight}
                  onChange={setWindWaveHeight}
                  unit="ft"
                  min={0}
                  max={20}
                />
              </div>
            </div>

            {/* Tide Section */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Tide
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ConditionInput
                  label="Height"
                  value={tideHeight}
                  onChange={setTideHeight}
                  unit="ft"
                  min={-5}
                  max={15}
                />
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    State
                  </label>
                  <Select
                    options={TIDE_STATE_OPTIONS}
                    value={tideState}
                    onChange={(v) => handleConditionChange(setTideState as (value: string) => void, v)}
                  />
                </div>
              </div>
            </div>

            {/* Water Section */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Water
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ConditionInput
                  label="Temperature"
                  value={waterTemp}
                  onChange={setWaterTemp}
                  unit="°F"
                  min={30}
                  max={100}
                  step="1"
                />
                <div /> {/* Spacer for grid alignment */}
              </div>
            </div>
          </div>
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
