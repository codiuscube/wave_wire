import { useState, useMemo, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  Magnifer,
  User,
  Crown,
  Shield,
  Filter,
  Pen,
  CloseCircle,
  Diskette,
  MapPoint,
  Bolt,
  Letter,
  DollarMinimalistic,
  AddCircle,
} from '@solar-icons/react';
import { Button, Input, DnaLogo } from "../components/ui";
import { AdminHeader, UserDetailModal, InviteUserModal } from "../components/admin";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { AdminUserStats } from "../lib/mappers";
import { mapAdminUserStats } from "../lib/mappers";

type FilterTier = "all" | "free" | "pro" | "premium";

interface EditingUser {
  id: string;
  email: string;
  subscriptionTier: string;
  isAdmin: boolean;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'text-muted-foreground' },
  pro: { label: 'Free (Beta)', color: 'text-primary' },
  unlimited: { label: 'Premium', color: 'text-amber-500' },
  premium: { label: 'Premium', color: 'text-amber-500' },
};

const PREMIUM_PRICE = 5.00; // $5/month - TODO: Replace with actual pricing from payment integration

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function UserManagementPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUserStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<FilterTier>("all");
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserStats | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all users from admin_user_stats view
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('admin_user_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setUsers(data.map(mapAdminUserStats));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Filter users
  const filteredUsers = useMemo(() => {
    let result = users;

    // Filter by tier
    if (filterTier !== "all") {
      result = result.filter(u => u.subscriptionTier === filterTier);
    }

    // Filter by search query
    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        u =>
          u.email?.toLowerCase().includes(query) ||
          u.id.toLowerCase().includes(query)
      );
    }

    return result;
  }, [users, filterTier, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.isAdmin).length;
    const premium = users.filter(u => u.subscriptionTier === 'premium').length;
    // Count both 'free' and 'pro' (Free Beta) as free users
    const free = users.filter(u => u.subscriptionTier === 'free' || u.subscriptionTier === 'pro').length;
    // MRR = Premium users × $5/mo
    const mrr = premium * PREMIUM_PRICE;
    // Total alerts sent across all users
    const totalAlerts = users.reduce((sum, u) => sum + u.alertsSent, 0);
    return { total, admins, premium, free, mrr, totalAlerts };
  }, [users]);

  const handleEditUser = (user: AdminUserStats) => {
    setEditingUser({
      id: user.id,
      email: user.email || '',
      subscriptionTier: user.subscriptionTier,
      isAdmin: user.isAdmin,
    });
    setSelectedUser(null); // Close detail modal when editing
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: editingUser.subscriptionTier === 'premium' ? 'unlimited' : editingUser.subscriptionTier,
          is_admin: editingUser.isAdmin,
        })
        .eq('id', editingUser.id);

      if (updateError) {
        console.error('Error saving user:', updateError);
      } else {
        // Refresh users list
        await fetchUsers();
        setEditingUser(null);
      }
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DnaLogo className="w-16 h-16" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="tech-card border-destructive p-6">
          <p className="text-destructive">Error loading users: {error}</p>
        </div>
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <AdminHeader />

        {/* Page Description */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-mono text-xl font-bold uppercase tracking-wider mb-2">User Management</h2>
            <p className="font-mono text-sm text-muted-foreground">
              View and manage user accounts, subscription tiers, and admin access.
            </p>
          </div>
          <Button onClick={() => setShowInviteModal(true)}>
            <AddCircle weight="Bold" size={16} className="mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <User weight="Bold" size={12} />
              Total Users
            </div>
            <div className="font-mono text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <User weight="Bold" size={12} className="text-muted-foreground" />
              Free
            </div>
            <div className="font-mono text-2xl font-bold text-muted-foreground">{stats.free}</div>
          </div>
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <Crown weight="Bold" size={12} className="text-amber-500" />
              Premium
            </div>
            <div className="font-mono text-2xl font-bold text-amber-500">{stats.premium}</div>
          </div>
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <DollarMinimalistic weight="Bold" size={12} className="text-green-500" />
              MRR
            </div>
            <div className="font-mono text-2xl font-bold text-green-500">${stats.mrr.toFixed(2)}</div>
            {/* TODO: Payment integration - replace with actual Stripe MRR */}
            <div className="font-mono text-xs text-muted-foreground/60 mt-1">
              {stats.premium} x ${PREMIUM_PRICE.toFixed(2)}/mo
            </div>
          </div>
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <Letter weight="Bold" size={12} className="text-primary" />
              Total Alerts
            </div>
            <div className="font-mono text-2xl font-bold text-primary">{stats.totalAlerts}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="tech-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Magnifer weight="Bold" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-mono text-sm"
              />
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <Filter weight="Bold" size={16} className="text-muted-foreground" />
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value as FilterTier)}
                className="bg-secondary/20 border border-border/50 rounded px-3 py-2 font-mono text-sm"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free Only</option>
                <option value="premium">Premium Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="font-mono text-xs text-muted-foreground mb-4">
          Showing {filteredUsers.length} of {stats.total} users
        </div>

        {/* Users Table */}
        <div className="tech-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/20 border-b border-border/50">
                <tr>
                  <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    Tier
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPoint weight="Bold" size={12} />
                      Spots
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Bolt weight="Bold" size={12} />
                      Triggers
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Letter weight="Bold" size={12} />
                      Alerts
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    Last Activity
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    Joined
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredUsers.slice(0, 100).map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-secondary/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-mono text-sm font-medium flex items-center gap-2">
                          {user.email || 'No email'}
                          {user.isAdmin && (
                            <Shield weight="Bold" size={12} className="text-red-500" />
                          )}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">{user.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-sm font-medium ${TIER_LABELS[user.subscriptionTier]?.color || 'text-muted-foreground'}`}>
                        {TIER_LABELS[user.subscriptionTier]?.label || user.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {user.spotsCount}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {user.triggersCount}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {user.alertsSent}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {user.lastActivity
                        ? formatRelativeTime(new Date(user.lastActivity))
                        : '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user);
                        }}
                        className="p-2 hover:bg-secondary/30 rounded transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pen weight="Bold" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length > 100 && (
            <div className="px-4 py-3 bg-secondary/10 border-t border-border/30 font-mono text-xs text-muted-foreground text-center">
              Showing first 100 results. Refine your search to see more.
            </div>
          )}
          {filteredUsers.length === 0 && (
            <div className="px-4 py-12 text-center font-mono text-sm text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={handleEditUser}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          />
          <div className="relative z-10 bg-card tech-card rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-mono text-lg font-bold uppercase tracking-wider">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-secondary/30 rounded transition-colors"
              >
                <CloseCircle weight="Bold" size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Email
                </label>
                <div className="px-3 py-2 bg-secondary/20 border border-border/50 rounded font-mono text-sm text-muted-foreground">
                  {editingUser.email || 'No email'}
                </div>
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  User ID
                </label>
                <div className="px-3 py-2 bg-secondary/20 border border-border/50 rounded font-mono text-xs text-muted-foreground break-all">
                  {editingUser.id}
                </div>
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Subscription Tier
                </label>
                <select
                  value={editingUser.subscriptionTier}
                  onChange={(e) => setEditingUser({ ...editingUser, subscriptionTier: e.target.value })}
                  className="w-full bg-secondary/20 border border-border/50 rounded px-3 py-2 font-mono text-sm"
                >
                  <option value="free">Free (Limited)</option>
                  <option value="pro">Free (Beta)</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={editingUser.isAdmin}
                  onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })}
                  className="w-4 h-4"
                />
                <div>
                  <label htmlFor="isAdmin" className="font-mono text-sm font-medium flex items-center gap-2">
                    <Shield weight="Bold" size={14} className="text-red-500" />
                    Admin Access
                  </label>
                  <p className="font-mono text-xs text-muted-foreground mt-0.5">
                    Grants full admin privileges to this user
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1" disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Diskette weight="Bold" size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            // Optional: refresh user list if the user is created immediately (often it requires them to click the link first)
            // But if we want to be safe we can just fetch.
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
