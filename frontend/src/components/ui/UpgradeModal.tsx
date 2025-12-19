import { createPortal } from 'react-dom';
import { CloseCircle, Gift, CheckCircle } from '@solar-icons/react';
import { Button } from './Button';

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
  if (!isOpen) return null;

  const message = FEATURE_MESSAGES[feature];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-background border border-border rounded-xl p-8 max-w-md mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <CloseCircle weight="Bold" size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Gift weight="BoldDuotone" size={32} className="text-primary" />
          </div>

          <h2 className="text-2xl font-bold mb-3">{message.title}</h2>

          <p className="text-muted-foreground">
            {message.description}
          </p>
        </div>

        {/* Free Beta Plan */}
        <div className="tech-card p-6 border-primary/50 bg-primary/5 mb-6">
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
          <p className="text-center text-xs text-muted-foreground mb-4">
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
    </div>,
    document.body
  );
}
