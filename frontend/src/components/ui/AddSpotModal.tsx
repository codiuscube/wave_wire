import { CloseCircle } from '@solar-icons/react';
import type { Spot } from "../SpotCard";
import { AddSpotContent } from "./AddSpotContent";
import { Sheet } from "./Sheet";

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSpots: Spot[];
  onAddSpot: (spot: Spot) => void;
  /** User's home location for showing nearby spots */
  userLocation?: { lat: number; lon: number } | null;
}

export type SpotOption = Spot;

export function AddSpotModal({
  isOpen,
  onClose,
  savedSpots,
  onAddSpot,
  userLocation,
}: AddSpotModalProps) {
  console.log('[AddSpotModal] Rendering', { isOpen });

  const handleAddSpot = async (spot: Spot) => {
    // Ensure the async save operation completes before closing
    await Promise.resolve(onAddSpot(spot));
    onClose();
  };

  // Using custom header like TriggerModal does (which works)
  const customHeader = (
    <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2.5 h-2.5 bg-primary animate-pulse" />
          <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">
            Add Surf Spot
          </h2>
        </div>
        <p className="font-mono text-sm text-muted-foreground/60">
          Configure a wave wire location.
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
      >
        <CloseCircle weight="BoldDuotone" size={24} />
      </button>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl"
      header={customHeader}
      dismissible={false}
    >
      <AddSpotContent
        savedSpots={savedSpots}
        onAddSpot={handleAddSpot}
        onCancel={onClose}
        className="flex-1 overflow-hidden"
        userLocation={userLocation}
      />
    </Sheet>
  );
}
