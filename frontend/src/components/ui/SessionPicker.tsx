import { useState, useMemo } from 'react';
import { CloseCircle, History } from '@solar-icons/react';
import { Sheet } from './Sheet';
import type { SurfSession, SessionQuality } from '../../lib/mappers';

interface SessionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (session: SurfSession) => void;
  sessions: SurfSession[];
  spotName: string;
}

// Quality badge colors
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

// Format date for display
const formatSessionDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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

  return parts.length > 0 ? parts.join(' / ') : null;
};

export function SessionPicker({
  isOpen,
  onClose,
  onSelect,
  sessions,
  spotName,
}: SessionPickerProps) {
  const [filter, setFilter] = useState<'all' | 'good'>('good');

  // Filter sessions by quality
  const filteredSessions = useMemo(() => {
    const goodQualities: SessionQuality[] = ['good', 'epic'];
    return filter === 'good'
      ? sessions.filter((s) => goodQualities.includes(s.quality))
      : sessions;
  }, [sessions, filter]);

  const handleSelect = (session: SurfSession) => {
    onSelect(session);
    onClose();
  };

  const customHeader = (
    <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <History weight="BoldDuotone" size={24} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Fill from Session</h2>
          <p className="text-sm text-muted-foreground">
            {spotName}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
      >
        <CloseCircle weight="Bold" size={20} />
      </button>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-lg"
      header={customHeader}
      dismissible={true}
    >
      <div className="p-4 overflow-y-auto flex-1">
        {/* Filter Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('good')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'good'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            Good & Epic
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            All Sessions
          </button>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {filter === 'good'
                ? 'No good or epic sessions logged yet.'
                : 'No sessions logged yet.'}
            </p>
            <p className="text-xs mt-1">Log sessions in the Surf Log to use them here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session) => {
              const conditions = formatConditions(session);
              return (
                <button
                  key={session.id}
                  onClick={() => handleSelect(session)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded border text-xs font-medium ${QUALITY_COLORS[session.quality]}`}
                    >
                      {QUALITY_LABELS[session.quality]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatSessionDate(session.sessionDate)}
                    </span>
                  </div>
                  {conditions && (
                    <p className="font-mono text-sm text-foreground">
                      {conditions}
                    </p>
                  )}
                  {!conditions && (
                    <p className="text-sm text-muted-foreground italic">
                      No conditions data
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}

export default SessionPicker;
