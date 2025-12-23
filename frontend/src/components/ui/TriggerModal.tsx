import { CloseCircle, Bolt } from '@solar-icons/react';
import type { TriggerTier, SurfSpot } from "../../types";
import { TriggerForm } from "./TriggerForm";
import { Sheet } from "./Sheet";

interface TriggerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (trigger: TriggerTier) => void;
    spotId: string;
    spot?: SurfSpot;
    triggerToEdit?: TriggerTier;
    lockedCondition?: 'epic' | 'good' | 'fair';
    autofillData?: Partial<TriggerTier>;
}

export function TriggerModal({
    isOpen,
    onClose,
    onSubmit,
    spotId,
    spot,
    triggerToEdit,
    lockedCondition,
    autofillData,
}: TriggerModalProps) {
    const handleSubmit = (trigger: TriggerTier) => {
        onSubmit(trigger);
        onClose();
    };

    const customHeader = (
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bolt weight="BoldDuotone" size={24} className="text-primary" />
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
                <CloseCircle weight="Bold" size={20} />
            </button>
        </div>
    );

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl"
            header={customHeader}
            dismissible={false}
        >
            <TriggerForm
                spotId={spotId}
                spot={spot}
                initialData={triggerToEdit}
                lockedCondition={lockedCondition}
                autofillData={autofillData}
                onSubmit={handleSubmit}
                className="flex-1 overflow-hidden"
            />
        </Sheet>
    );
}
