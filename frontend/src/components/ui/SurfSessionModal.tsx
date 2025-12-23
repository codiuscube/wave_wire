import { CloseCircle, History } from '@solar-icons/react';
import { Sheet } from './Sheet';
import { SurfSessionForm } from './SurfSessionForm';
import type { UserSpot, SurfSession, SessionConditions, SessionQuality, SessionCrowd } from '../../lib/mappers';

interface SurfSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    spotId: string;
    sessionDate: string;
    durationMinutes: number;
    quality: SessionQuality;
    crowd: SessionCrowd;
    notes: string | null;
    conditions: SessionConditions | null;
  }) => Promise<void>;
  spots: UserSpot[];
  sessionToEdit?: SurfSession;
  isLoading?: boolean;
}

export function SurfSessionModal({
  isOpen,
  onClose,
  onSubmit,
  spots,
  sessionToEdit,
  isLoading = false,
}: SurfSessionModalProps) {
  const handleSubmit = async (data: {
    spotId: string;
    sessionDate: string;
    durationMinutes: number;
    quality: SessionQuality;
    crowd: SessionCrowd;
    notes: string | null;
    conditions: SessionConditions | null;
  }) => {
    await onSubmit(data);
    onClose();
  };

  const customHeader = (
    <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <History weight="BoldDuotone" size={24} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">
            {sessionToEdit ? 'Edit Session' : 'Log Session'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {sessionToEdit
              ? 'Update your surf session details.'
              : 'Record a surf session with conditions.'}
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

  // Convert SurfSession to form initial data if editing
  const initialData = sessionToEdit
    ? {
        spotId: sessionToEdit.spotId,
        sessionDate: sessionToEdit.sessionDate,
        durationMinutes: sessionToEdit.durationMinutes,
        quality: sessionToEdit.quality,
        crowd: sessionToEdit.crowd,
        notes: sessionToEdit.notes || '',
        conditions: sessionToEdit.conditions,
      }
    : undefined;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-lg"
      header={customHeader}
      dismissible={true}
    >
      <div className="p-6 overflow-y-auto flex-1">
        <SurfSessionForm
          spots={spots}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </Sheet>
  );
}

export default SurfSessionModal;
