import { createPortal } from "react-dom";
import { X, Zap } from "lucide-react";
import type { TriggerTier } from "../../types";
import { AddTriggerContent } from "./AddTriggerContent";

interface AddTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrigger: (trigger: TriggerTier) => void;
  spotId: string;
}

export function AddTriggerModal({
  isOpen,
  onClose,
  onAddTrigger,
  spotId,
}: AddTriggerModalProps) {
  if (!isOpen) return null;

  const handleAddTrigger = (trigger: TriggerTier) => {
    onAddTrigger(trigger);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-background border border-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Add Trigger</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <AddTriggerContent
          spotId={spotId}
          onAddTrigger={handleAddTrigger}
          className="flex-1 overflow-hidden"
        />
      </div>
    </div>,
    document.body
  );
}
