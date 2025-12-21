/**
 * PWA Install Banner
 *
 * Shows installation instructions for iOS users who need to
 * add the app to their home screen to receive push notifications.
 */

import { useState, useEffect } from 'react';
import { Download, CloseCircle } from '@solar-icons/react';
import { Card, CardContent } from './Card';
import { isIos, isRunningAsPwa } from '../../lib/onesignal';

export function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show for iOS users not in PWA mode
    if (!isIos() || isRunningAsPwa()) {
      return;
    }

    // Check if banner was dismissed recently (7 days)
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        return;
      }
    }

    setShowBanner(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <Card className="bg-card/95 backdrop-blur-sm border-primary/30 shadow-xl">
        <CardContent className="pt-4 pb-4">
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <CloseCircle size={18} weight="Bold" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Download weight="BoldDuotone" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Install Wave_Wire</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add to Home Screen for push notifications on iOS.
              </p>
              <ol className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="font-mono text-primary">1.</span>
                  <span>Tap the Share button in Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-primary">2.</span>
                  <span>Scroll and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono text-primary">3.</span>
                  <span>Open the app and enable push</span>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
