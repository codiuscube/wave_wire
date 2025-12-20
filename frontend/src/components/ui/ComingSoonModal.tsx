import { Water } from '@solar-icons/react';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Coming Soon"
    >
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Water weight="BoldDuotone" size={32} className="text-primary" />
          </div>

          <p className="text-muted-foreground mb-6">
            We're putting the finishing touches on WAVE_WIRE. Sign up to be notified when we launch!
          </p>

          <Button onClick={onClose} className="w-full">
            Got it
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
