import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Spot } from "../SpotCard";
import { AddSpotContent } from "./AddSpotContent";

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSpots: Spot[];
  onAddSpot: (spot: Spot) => void;
}

export type SpotOption = Spot;

export function AddSpotModal({
  isOpen,
  onClose,
  savedSpots,
  onAddSpot,
}: AddSpotModalProps) {
  if (!isOpen) return null;

  const handleAddSpot = (spot: Spot) => {
    onAddSpot(spot);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-card/95 tech-card rounded-lg w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
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
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - flex-1 to allow scrolling */}
        <AddSpotContent
          savedSpots={savedSpots}
          onAddSpot={handleAddSpot}
          className="flex-1 overflow-hidden" // Pass className to handle layout
        />
      </div>
    </div>,
    document.body
  );
}
