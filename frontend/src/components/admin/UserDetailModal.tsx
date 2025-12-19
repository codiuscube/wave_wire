import {
  CloseCircle,
  User,
  Phone,
  Crown,
  Shield,
  MapPoint,
  Bolt,
  Letter,
  Calendar,
  CheckCircle,
  CloseSquare,
  Pen,
} from '@solar-icons/react';
import { Button, Sheet } from '../ui';
import type { AdminUserStats } from '../../lib/mappers';

interface UserDetailModalProps {
  user: AdminUserStats;
  onClose: () => void;
  onEdit: (user: AdminUserStats) => void;
  isOpen?: boolean;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free (Limited)', color: 'text-muted-foreground' },
  pro: { label: 'Free (Beta)', color: 'text-primary' },
  premium: { label: 'Premium', color: 'text-amber-500' },
};

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

export function UserDetailModal({ user, onClose, onEdit, isOpen = true }: UserDetailModalProps) {
  const customHeader = (
    <div className="flex-shrink-0 bg-card border-b border-border/50 p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${user.isAdmin ? 'bg-red-500/20' : 'bg-secondary/50'}`}>
          {user.isAdmin ? (
            <Shield weight="Bold" size={24} className="text-red-500" />
          ) : (
            <User weight="Bold" size={24} className="text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="font-mono text-lg font-bold">{user.email || 'No email'}</h3>
          <p className="font-mono text-xs text-muted-foreground">{user.id}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-secondary/30 rounded transition-colors"
      >
        <CloseCircle weight="Bold" size={20} />
      </button>
    </div>
  );

  const customFooter = (
    <div className="flex-shrink-0 bg-card border-t border-border/50 p-6 flex justify-end gap-3">
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
      <Button onClick={() => onEdit(user)}>
        <Pen weight="Bold" size={16} className="mr-2" />
        Edit User
      </Button>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl"
      header={customHeader}
      footer={customFooter}
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Contact Information */}
        <section>
          <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Phone weight="Bold" size={14} />
            Contact Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="tech-card p-4">
              <div className="font-mono text-xs text-muted-foreground uppercase mb-1">Phone</div>
              <div className="font-mono text-sm flex items-center gap-2">
                {user.phone || '-'}
                {user.phone && (
                  user.phoneVerified ? (
                    <CheckCircle weight="Bold" size={14} className="text-green-500" />
                  ) : (
                    <CloseSquare weight="Bold" size={14} className="text-amber-500" />
                  )
                )}
              </div>
              {user.phone && (
                <div className={`font-mono text-[10px] mt-1 ${user.phoneVerified ? 'text-green-500' : 'text-amber-500'}`}>
                  {user.phoneVerified ? 'Verified' : 'Not verified'}
                </div>
              )}
            </div>
            <div className="tech-card p-4">
              <div className="font-mono text-xs text-muted-foreground uppercase mb-1">Home Address</div>
              <div className="font-mono text-sm">{user.homeAddress || '-'}</div>
            </div>
          </div>
        </section>

        {/* Activity Metrics */}
        <section>
          <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Bolt weight="Bold" size={14} />
            Activity Metrics
          </h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="tech-card p-4 text-center">
              <MapPoint weight="Bold" size={20} className="mx-auto mb-2 text-primary" />
              <div className="font-mono text-2xl font-bold">{user.spotsCount}</div>
              <div className="font-mono text-xs text-muted-foreground">Spots</div>
            </div>
            <div className="tech-card p-4 text-center">
              <Bolt weight="Bold" size={20} className="mx-auto mb-2 text-primary" />
              <div className="font-mono text-2xl font-bold">{user.triggersCount}</div>
              <div className="font-mono text-xs text-muted-foreground">Triggers</div>
            </div>
            <div className="tech-card p-4 text-center">
              <Letter weight="Bold" size={20} className="mx-auto mb-2 text-primary" />
              <div className="font-mono text-2xl font-bold">{user.alertsSent}</div>
              <div className="font-mono text-xs text-muted-foreground">Alerts Sent</div>
            </div>
            <div className="tech-card p-4 text-center">
              <Calendar weight="Bold" size={20} className="mx-auto mb-2 text-primary" />
              <div className="font-mono text-sm font-bold">
                {user.lastActivity
                  ? formatRelativeTime(new Date(user.lastActivity))
                  : '-'}
              </div>
              <div className="font-mono text-xs text-muted-foreground">Last Active</div>
            </div>
          </div>
        </section>

        {/* Subscription Info */}
        <section>
          <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Crown weight="Bold" size={14} />
            Subscription
          </h4>
          <div className="tech-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-xs text-muted-foreground uppercase mb-1">Current Tier</div>
                <div className={`font-mono text-lg font-bold ${TIER_LABELS[user.subscriptionTier]?.color}`}>
                  {TIER_LABELS[user.subscriptionTier]?.label || user.subscriptionTier}
                </div>
              </div>
              {user.isAdmin && (
                <span className="flex items-center gap-1 px-3 py-1 rounded text-xs font-mono uppercase bg-red-500/20 text-red-500">
                  <Shield weight="Bold" size={12} />
                  Admin
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
              <div>
                <div className="font-mono text-xs text-muted-foreground uppercase mb-1">Account Created</div>
                <div className="font-mono text-sm">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </div>
              </div>
              <div>
                <div className="font-mono text-xs text-muted-foreground uppercase mb-1">Last Updated</div>
                <div className="font-mono text-sm">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>
            {/* TODO: Add subscription history when payment integration is complete */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="font-mono text-xs text-muted-foreground/60 italic">
                TODO: Subscription history will be available after payment integration
              </div>
            </div>
          </div>
        </section>
      </div>
    </Sheet>
  );
}
