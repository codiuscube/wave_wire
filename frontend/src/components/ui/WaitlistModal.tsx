import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Water, CheckCircle, CloseCircle, Copy, Share } from '@solar-icons/react';
import { Button } from './Button';
import { Input } from './Input';
import { Sheet } from './Sheet';
import { supabase } from '../../lib/supabase';
import { useReferral } from '../../contexts/ReferralContext';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SignupData {
  referralCode: string;
  referralLink: string;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam protection - bots fill this
  const [loading, setLoading] = useState(false);
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingAccount, setHasExistingAccount] = useState(false);
  const [copied, setCopied] = useState(false);

  const { referralCode: incomingReferralCode, clearReferralCode } = useReferral();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Honeypot check - if filled, it's a bot. Show fake success.
    if (honeypot) {
      setSignupData({ referralCode: 'FAKE01', referralLink: '' });
      return;
    }

    setLoading(true);
    setError(null);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already has an account
    const { data: hasAccount } = await supabase.rpc('email_has_account', {
      check_email: normalizedEmail,
    });

    if (hasAccount) {
      setLoading(false);
      setHasExistingAccount(true);
      return;
    }

    // Look up referrer ID if we have a referral code
    let referredById: string | null = null;
    if (incomingReferralCode) {
      const { data: referrerId } = await supabase.rpc('get_referrer_id', {
        code: incomingReferralCode,
      });
      referredById = referrerId;
    }

    // Insert into waitlist with referral info
    const { data: insertedRow, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: normalizedEmail,
        referred_by: referredById,
      })
      .select('referral_code')
      .single();

    setLoading(false);

    if (insertError) {
      if (insertError.code === '23505') {
        setError("You're already on the waitlist!");
      } else {
        setError(insertError.message);
      }
      return;
    }

    // Clear the incoming referral code from localStorage
    clearReferralCode();

    // Set success state with the new user's referral code
    const newReferralCode = insertedRow?.referral_code || '';
    const baseUrl = window.location.origin;
    setSignupData({
      referralCode: newReferralCode,
      referralLink: `${baseUrl}?ref=${newReferralCode}`,
    });
  };

  const handleCopy = async () => {
    if (!signupData?.referralLink) return;

    try {
      await navigator.clipboard.writeText(signupData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = signupData.referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!signupData?.referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join WAVE_WIRE',
          text: 'Get early access to WAVE_WIRE - surf alerts for when conditions are perfect!',
          url: signupData.referralLink,
        });
      } catch {
        // User cancelled or share failed, fall back to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleClose = () => {
    setEmail('');
    setHoneypot('');
    setError(null);
    setSignupData(null);
    setHasExistingAccount(false);
    setCopied(false);
    onClose();
  };

  if (hasExistingAccount) {
    return (
      <Sheet isOpen={isOpen} onClose={handleClose} title="Welcome Back">
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle weight="BoldDuotone" size={32} className="text-primary" />
          </div>
          <h3 className="font-mono text-xl font-bold uppercase tracking-wider mb-2">You already have an account!</h3>
          <p className="font-mono text-sm text-muted-foreground mb-6">
            Looks like you've already signed up. Log in to access your dashboard.
          </p>
          <Link
            to="/login"
            onClick={handleClose}
            className="w-full py-3 bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider text-center block hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </Sheet>
    );
  }

  if (signupData) {
    return (
      <Sheet isOpen={isOpen} onClose={handleClose} title="You're In">
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle weight="BoldDuotone" size={32} className="text-green-500" />
          </div>
          <h3 className="font-mono text-xl font-bold uppercase tracking-wider mb-2">You're on the list!</h3>
          <p className="font-mono text-sm text-muted-foreground mb-4">
            We'll send you an invite when we're ready for you.
          </p>

          {/* Referral section */}
          <div className="w-full bg-muted/50 border border-border rounded-lg p-4 mb-4">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Want to move up the list?
            </p>
            <p className="font-mono text-sm mb-3">
              Share your link. Each signup bumps you up!
            </p>

            {/* Referral code display */}
            <div className="bg-background border border-border rounded p-3 mb-3">
              <p className="font-mono text-xs text-muted-foreground mb-1">Your referral code</p>
              <p className="font-mono text-lg font-bold tracking-widest">{signupData.referralCode}</p>
            </div>

            {/* Referral link with copy */}
            <div className="flex gap-2">
              <div className="flex-1 bg-background border border-border rounded p-2 overflow-hidden">
                <p className="font-mono text-xs truncate">{signupData.referralLink}</p>
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-primary text-primary-foreground rounded font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                <Copy weight="Bold" size={14} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share button for mobile */}
          <Button onClick={handleShare} className="w-full mb-3" variant="outline">
            <Share weight="Bold" size={16} className="mr-2" />
            Share Link
          </Button>

          <Button onClick={handleClose} className="w-full" variant="ghost">
            Done
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet isOpen={isOpen} onClose={handleClose} title="Join the Waitlist">
      <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Water weight="BoldDuotone" size={32} className="text-primary" />
          </div>

          <p className="text-muted-foreground mb-6">
            WAVE_WIRE is currently in private beta. Join the waitlist to get early access.
          </p>

          {incomingReferralCode && (
            <div className="inline-block bg-green-500/10 border border-green-500/20 text-green-500 px-3 py-1 rounded font-mono text-xs mb-4">
              Referred by: {incomingReferralCode}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="waitlist-email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
            Email Address
          </label>
          <Input
            id="waitlist-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-mono text-sm"
            autoFocus
            required
          />
        </div>

        {/* Honeypot field - hidden from humans, bots fill it */}
        <div className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive">
            <CloseCircle weight="Bold" size={16} />
            <span className="font-mono text-sm">{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Joining...
            </>
          ) : (
            'Join Waitlist'
          )}
        </Button>
      </form>
    </Sheet>
  );
}
