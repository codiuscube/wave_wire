import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button, Input, Sheet } from '../ui';
import { Letter, CheckCircle, Crown } from '@solar-icons/react';
import { showError } from '../../lib/toast';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
    const [email, setEmail] = useState('');
    const [tier, setTier] = useState('free');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);

        // Use signInWithOtp to send a magic link.
        // This works for new users (creates account) and existing users (logs them in).
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                // Redirect them to dashboard/account to set up their profile
                // Use VITE_SITE_URL in production to avoid localhost redirects
                emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/dashboard/account`,
                data: {
                    subscription_tier: tier,
                },
            },
        });

        setLoading(false);

        if (error) {
            showError(error.message);
            return;
        }

        setSuccess(true);
        if (onSuccess) onSuccess();

        // Auto close after 2 seconds
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    const handleClose = () => {
        setEmail('');
        setTier('free');
        setSuccess(false);
        onClose();
    };

    if (success) {
        return (
            <Sheet isOpen={isOpen} onClose={handleClose} title="Invite Sent">
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle weight="BoldDuotone" size={32} className="text-green-500" />
                    </div>
                    <h3 className="font-mono text-xl font-bold uppercase tracking-wider mb-2">Invite Sent!</h3>
                    <p className="font-mono text-sm text-muted-foreground">
                        A {tier} invitation has been sent to <span className="text-foreground">{email}</span>
                    </p>
                </div>
            </Sheet>
        );
    }

    return (
        <Sheet isOpen={isOpen} onClose={handleClose} title="Invite New User">
            <form onSubmit={handleInvite} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                    <label htmlFor="invite-email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                        Email Address
                    </label>
                    <Input
                        id="invite-email"
                        type="email"
                        placeholder="friend@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="font-mono text-sm"
                        autoFocus
                        required
                    />
                </div>

                <div>
                    <label htmlFor="invite-tier" className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                        Subscription Tier
                    </label>
                    <div className="relative">
                        <Crown weight="Bold" size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${tier === 'premium' ? 'text-amber-500' : 'text-muted-foreground'
                            }`} />
                        <select
                            id="invite-tier"
                            value={tier}
                            onChange={(e) => setTier(e.target.value)}
                            className="w-full bg-secondary/20 border border-border/50 rounded px-3 py-2 pl-9 font-mono text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="free">Free (Limited)</option>
                            <option value="pro">Pro (Beta)</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                </div>

                <p className="font-mono text-xs text-muted-foreground">
                    The user will receive a magic link to sign in. If they don't have an account, one will be created automatically with the selected tier.
                </p>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading || !email}>
                        {loading ? (
                            <>
                                <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Letter weight="Bold" size={16} className="mr-2" />
                                Send Invite
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Sheet>
    );
}
