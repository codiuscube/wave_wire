import { createPortal } from "react-dom";
import { X, Zap } from "lucide-react";
import type { TriggerTier, SurfSpot } from "../../types";
import { TriggerForm } from "./TriggerForm";

interface TriggerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (trigger: TriggerTier) => void;
    spotId: string;
    spot?: SurfSpot;
    triggerToEdit?: TriggerTier; // Optional: if provided, we are editing
}

export function TriggerModal({
    isOpen,
    onClose,
    onSubmit,
    spotId,
    spot,
    triggerToEdit,
}: TriggerModalProps) {
    if (!isOpen) return null;

    const handleSubmit = (trigger: TriggerTier) => {
        onSubmit(trigger);
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
            <div className="relative z-10 bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                {triggerToEdit ? "Edit Trigger" : "Create Trigger"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Set conditions to get notified.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {/* Content */}
                <TriggerForm
                    spotId={spotId}
                    spot={spot}
                    initialData={triggerToEdit}
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-hidden"
                />
            </div>
        </div>,
        document.body
    );
}
