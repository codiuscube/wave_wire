import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

const REFERRAL_STORAGE_KEY = 'waitlist_referral_code';

interface ReferralContextType {
  referralCode: string | null;
  clearReferralCode: () => void;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export function ReferralProvider({ children }: { children: ReactNode }) {
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for referral code
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get('ref');

    if (refFromUrl) {
      // Store in localStorage and state
      localStorage.setItem(REFERRAL_STORAGE_KEY, refFromUrl.toUpperCase());
      setReferralCode(refFromUrl.toUpperCase());

      // Clean up URL without refreshing (optional, removes ?ref= from URL bar)
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    } else {
      // Check localStorage for existing referral code
      const storedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
      if (storedCode) {
        setReferralCode(storedCode);
      }
    }
  }, []);

  const clearReferralCode = useCallback(() => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    setReferralCode(null);
  }, []);

  return (
    <ReferralContext.Provider value={{ referralCode, clearReferralCode }}>
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
}
