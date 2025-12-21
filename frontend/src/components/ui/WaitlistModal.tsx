import { useState } from 'react';
import { Water, CheckCircle, CloseCircle } from '@solar-icons/react';
import { Button } from './Button';
import { Input } from './Input';
import { Sheet } from './Sheet';
import { supabase } from '../../lib/supabase';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim() });

    setLoading(false);

    if (insertError) {
      if (insertError.code === '23505') {
        setError("You're already on the waitlist!");
      } else {
        setError(insertError.message);
      }
      return;
    }

    setSuccess(true);
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <Sheet isOpen={isOpen} onClose={handleClose} title="You're In">
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle weight="BoldDuotone" size={32} className="text-green-500" />
          </div>
          <h3 className="font-mono text-xl font-bold uppercase tracking-wider mb-2">You're on the list!</h3>
          <p className="font-mono text-sm text-muted-foreground mb-6">
            We'll send you an invite when we're ready for you.
          </p>
          <Button onClick={handleClose} className="w-full">
            Got it
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
