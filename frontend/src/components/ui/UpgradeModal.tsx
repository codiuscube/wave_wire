import { Gift, CheckCircle } from '@solar-icons/react';
import { Button } from './Button';
import { Sheet } from './Sheet';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'spots' | 'triggers' | 'general';
  currentTier?: 'free' | 'pro' | 'premium';
}

const FEATURE_MESSAGES: Record<string, { title: string; description: string }> = {
  spots: {
    title: 'Spot Limit Reached',
    description: 'Upgrade to Free (Beta) to track unlimited surf spots.',
  },
  triggers: {
    title: 'Trigger Limit Reached',
    description: 'Upgrade to Free (Beta) to create unlimited triggers.',
  },
  general: {
    title: 'Upgrade Your Plan',
    description: 'Get unlimited access during our beta period.',
  },
};

export function UpgradeModal({
  isOpen,
  onClose,
  feature = 'general',
  currentTier = 'free'
}: UpgradeModalProps) {
  const message = FEATURE_MESSAGES[feature];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={message.title}
    >
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Gift weight="BoldDuotone" size={32} className="text-primary" />
          </div>

          <p className="text-muted-foreground">
            {message.description}
          </p>
        </div>

        {/* Free Beta Plan */}
        <div className="tech-card p-6 border-primary/50 bg-primary/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift weight="Bold" size={20} className="text-primary" />
              <h3 className="font-bold uppercase tracking-wider">Free (Beta)</h3>
            </div>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
              FREE
            </span>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle weight="Bold" size={14} className="text-green-500" />
              <span>Unlimited spots</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle weight="Bold" size={14} className="text-green-500" />
              <span>Unlimited triggers</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle weight="Bold" size={14} className="text-green-500" />
              <span>Real-time alerts</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle weight="Bold" size={14} className="text-green-500" />
              <span>All features unlocked</span>
            </li>
          </ul>
          <p className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
            Full access while we're in beta. No credit card required.
          </p>
        </div>

        {/* Current Plan Notice */}
        {currentTier === 'free' && (
          <p className="text-center text-xs text-muted-foreground">
            Current plan: <span className="font-medium">Free (Limited)</span>
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Maybe Later
          </Button>
          <Button
            onClick={() => {
              // TODO: Integrate with upgrade flow
              window.open('mailto:beta@wavewire.app?subject=Free%20Beta%20Access%20Request', '_blank');
              onClose();
            }}
            className="flex-1"
          >
            <Gift weight="Bold" size={16} className="mr-2" />
            Get Beta Access
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
