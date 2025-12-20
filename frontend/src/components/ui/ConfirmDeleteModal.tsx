import { DangerTriangle, TrashBinMinimalistic } from '@solar-icons/react';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  spotName: string;
  triggerCount?: number;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  spotName,
  triggerCount = 0,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Spot"
      indicatorColor="bg-destructive"
    >
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <DangerTriangle weight="Bold" size={24} className="text-destructive" />
          </div>
        </div>

        {/* Spot Name */}
        <p className="text-center text-muted-foreground">
          Are you sure you want to delete <span className="font-mono font-bold text-foreground">"{spotName}"</span>?
        </p>

        {/* Warning Message */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium mb-2">
            This action cannot be undone.
          </p>
          {triggerCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {triggerCount} trigger{triggerCount !== 1 ? 's' : ''} associated with this spot will also be permanently deleted.
            </p>
          )}
          {triggerCount === 0 && (
            <p className="text-sm text-muted-foreground">
              All triggers associated with this spot will also be permanently deleted.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <TrashBinMinimalistic weight="Bold" size={16} className="mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
