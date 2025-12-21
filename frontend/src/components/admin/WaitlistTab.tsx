import { useState, useEffect, useCallback, useMemo } from 'react';
import { Letter, CheckCircle, TrashBinMinimalistic, Magnifer, Crown, UsersGroupRounded, ArrowUp, ArrowDown } from '@solar-icons/react';
import { supabase } from '../../lib/supabase';
import { Button, Input, DnaLogo, Sheet } from '../ui';
import { showSuccess, showError } from '../../lib/toast';

interface WaitlistEntry {
  id: string;
  email: string;
  status: 'pending' | 'invited';
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  created_at: string;
  referrer?: { email: string } | null;
}

type SortField = 'referrals' | 'date';
type SortDirection = 'asc' | 'desc';

export function WaitlistTab() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [inviteTier, setInviteTier] = useState('pro');
  const [sortField, setSortField] = useState<SortField>('referrals');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchWaitlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('waitlist')
        .select(`
          *,
          referrer:referred_by(email)
        `)
        .order('referral_count', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setEntries(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  const filteredAndSortedEntries = useMemo(() => {
    let result = entries;

    // Filter by search query
    if (searchQuery && searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.email.toLowerCase().includes(query));
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortField === 'referrals') {
        const diff = sortDirection === 'desc'
          ? (b.referral_count || 0) - (a.referral_count || 0)
          : (a.referral_count || 0) - (b.referral_count || 0);
        if (diff !== 0) return diff;
        // Secondary sort by date
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return sortDirection === 'desc'
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

    return result;
  }, [entries, searchQuery, sortField, sortDirection]);

  const stats = useMemo(() => {
    const total = entries.length;
    const pending = entries.filter(e => e.status === 'pending').length;
    const invited = entries.filter(e => e.status === 'invited').length;
    const withReferrals = entries.filter(e => (e.referral_count || 0) > 0).length;
    const totalReferrals = entries.reduce((sum, e) => sum + (e.referral_count || 0), 0);
    return { total, pending, invited, withReferrals, totalReferrals };
  }, [entries]);

  const handleInviteClick = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setInviteTier('pro');
    setShowInviteModal(true);
  };

  const handleSendInvite = async () => {
    if (!selectedEntry) return;

    setInvitingId(selectedEntry.id);

    // 1. Send OTP invite
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: selectedEntry.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/dashboard/account`,
        data: {
          subscription_tier: inviteTier,
        },
      },
    });

    if (otpError) {
      showError(otpError.message);
      setInvitingId(null);
      return;
    }

    // 2. Update waitlist status
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ status: 'invited' })
      .eq('id', selectedEntry.id);

    if (updateError) {
      showError(updateError.message);
      setInvitingId(null);
      return;
    }

    showSuccess(`Invite sent to ${selectedEntry.email}`);
    setInvitingId(null);
    setShowInviteModal(false);
    setSelectedEntry(null);
    fetchWaitlist();
  };

  const handleDelete = async (entry: WaitlistEntry) => {
    if (!confirm(`Remove ${entry.email} from the waitlist?`)) return;

    const { error: deleteError } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', entry.id);

    if (deleteError) {
      showError(deleteError.message);
      return;
    }

    showSuccess('Entry removed');
    fetchWaitlist();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'desc'
      ? <ArrowDown weight="Bold" size={12} className="inline ml-1" />
      : <ArrowUp weight="Bold" size={12} className="inline ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <DnaLogo className="w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="tech-card border-destructive p-6 text-center">
        <p className="text-destructive font-mono text-sm">Error loading waitlist: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="tech-card p-4">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</div>
          <div className="font-mono text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="tech-card p-4">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">Pending</div>
          <div className="font-mono text-2xl font-bold text-amber-500">{stats.pending}</div>
        </div>
        <div className="tech-card p-4">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">Invited</div>
          <div className="font-mono text-2xl font-bold text-green-500">{stats.invited}</div>
        </div>
        <div className="tech-card p-4">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <UsersGroupRounded weight="Bold" size={12} />
            Referrers
          </div>
          <div className="font-mono text-2xl font-bold text-primary">{stats.withReferrals}</div>
        </div>
        <div className="tech-card p-4">
          <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Referrals</div>
          <div className="font-mono text-2xl font-bold text-primary">{stats.totalReferrals}</div>
        </div>
      </div>

      {/* Search */}
      <div className="tech-card p-4 mb-6">
        <div className="relative">
          <Magnifer weight="Bold" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-mono text-sm"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="font-mono text-xs text-muted-foreground mb-4">
        Showing {filteredAndSortedEntries.length} of {stats.total} entries
        <span className="ml-2 text-primary">
          (sorted by {sortField === 'referrals' ? 'referral count' : 'date'})
        </span>
      </div>

      {/* Table */}
      <div className="tech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/20 border-b border-border/50">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th
                  className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('referrals')}
                >
                  Referrals
                  <SortIcon field="referrals" />
                </th>
                <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Referred By
                </th>
                <th
                  className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort('date')}
                >
                  Joined
                  <SortIcon field="date" />
                </th>
                <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredAndSortedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm">{entry.email}</div>
                    <div className="font-mono text-xs text-muted-foreground">{entry.referral_code}</div>
                  </td>
                  <td className="px-4 py-3">
                    {(entry.referral_count || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-primary">
                        <UsersGroupRounded weight="Bold" size={14} />
                        {entry.referral_count}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entry.referrer?.email ? (
                      <span className="font-mono text-xs text-muted-foreground">{entry.referrer.email}</span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground/50">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {entry.status === 'invited' ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-green-500">
                        <CheckCircle weight="Bold" size={12} />
                        Invited
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-amber-500">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {entry.status === 'pending' && (
                        <button
                          onClick={() => handleInviteClick(entry)}
                          disabled={invitingId === entry.id}
                          className="p-2 hover:bg-primary/10 rounded transition-colors text-primary disabled:opacity-50"
                          title="Send invite"
                        >
                          {invitingId === entry.id ? (
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : (
                            <Letter weight="Bold" size={16} />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(entry)}
                        className="p-2 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
                        title="Remove from waitlist"
                      >
                        <TrashBinMinimalistic weight="Bold" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredAndSortedEntries.length === 0 && (
          <div className="px-4 py-12 text-center font-mono text-sm text-muted-foreground">
            No waitlist entries found
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Sheet
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedEntry(null);
        }}
        title="Send Invite"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              Email Address
            </label>
            <div className="px-3 py-2 bg-secondary/20 border border-border/50 rounded font-mono text-sm">
              {selectedEntry?.email}
            </div>
          </div>

          {selectedEntry && (selectedEntry.referral_count || 0) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded">
              <UsersGroupRounded weight="Bold" size={16} className="text-primary" />
              <span className="font-mono text-sm">
                This user has <strong>{selectedEntry.referral_count}</strong> referral{selectedEntry.referral_count !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div>
            <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              Subscription Tier
            </label>
            <div className="relative">
              <Crown weight="Bold" size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${inviteTier === 'premium' ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <select
                value={inviteTier}
                onChange={(e) => setInviteTier(e.target.value)}
                className="w-full bg-secondary/20 border border-border/50 rounded px-3 py-2 pl-9 font-mono text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="free">Free (Limited)</option>
                <option value="pro">Pro (Beta)</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            The user will receive a magic link to sign in. Their account will be created with the selected tier.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false);
                setSelectedEntry(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSendInvite} className="flex-1" disabled={invitingId !== null}>
              {invitingId ? (
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
        </div>
      </Sheet>
    </div>
  );
}
