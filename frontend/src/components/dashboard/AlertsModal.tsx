import { useState, useEffect } from 'react';
import { CloseCircle } from '@solar-icons/react';
import { Sheet } from '../ui/Sheet';
import { AlertCard, type Alert } from './AlertCard';
import { useSentAlerts } from '../../hooks/useSentAlerts';
import { supabase } from '../../lib/supabase';

interface AlertsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | undefined;
    spotNames?: Map<string, string>; // Map of spot ID to spot name
}

export function AlertsModal({ isOpen, onClose, userId, spotNames }: AlertsModalProps) {
    const [limit, setLimit] = useState(20);
    const { alerts: sentAlerts, isLoading, totalCount, refresh } = useSentAlerts(userId, { limit });
    const [alerts, setAlerts] = useState<Alert[]>([]);

    // Convert SentAlert to Alert format
    useEffect(() => {
        const mappedAlerts: Alert[] = sentAlerts.map(alert => ({
            id: alert.id,
            spotName: spotNames?.get(alert.spotId ?? '') ?? 'Unknown Spot',
            type: alert.alertType ?? 'Alert',
            message: alert.messageContent ?? 'No message',
            time: alert.sentAt ?? alert.createdAt ?? new Date().toISOString(),
            condition: mapCondition(alert.conditionMatched),
            deliveryStatus: alert.deliveryStatus as Alert['deliveryStatus'],
        }));
        setAlerts(mappedAlerts);
    }, [sentAlerts, spotNames]);

    // Real-time subscription for new alerts
    useEffect(() => {
        if (!isOpen || !userId) return;

        const channel = supabase
            .channel('sent_alerts_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sent_alerts',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Refresh the alerts when a new one is inserted
                    refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen, userId, refresh]);

    const hasMore = alerts.length < totalCount;

    const loadMore = () => {
        if (isLoading || !hasMore) return;
        setLimit(prev => prev + 20);
    };

    // Reset limit when modal closes
    useEffect(() => {
        if (!isOpen) {
            setLimit(20);
        }
    }, [isOpen]);

    // Using custom header (the working pattern)
    const customHeader = (
        <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-2.5 h-2.5 bg-destructive animate-pulse" />
                    <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">
                        Wire Intercept Log
                    </h2>
                </div>
                <p className="font-mono text-sm text-muted-foreground/60">
                    {totalCount > 0
                        ? `${totalCount} signals recorded.`
                        : 'No signals recorded yet.'}
                </p>
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
            >
                <CloseCircle weight="BoldDuotone" size={24} />
            </button>
        </div>
    );

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-2xl"
            header={customHeader}
        >
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoading && alerts.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="font-mono text-muted-foreground">
                            No alerts yet. When conditions match your triggers, they'll appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        {alerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                        ))}

                        {hasMore && (
                            <div className="pt-4 flex justify-center">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="btn-brutal text-sm py-3 px-8 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            DECODING...
                                        </span>
                                    ) : (
                                        "LOAD OLDER SIGNALS"
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Sheet>
    );
}

function mapCondition(condition: string | null): Alert['condition'] {
    switch (condition?.toLowerCase()) {
        case 'epic':
            return 'epic';
        case 'good':
            return 'good';
        case 'fair':
            return 'fair';
        case 'poor':
            return 'poor';
        default:
            return 'unknown';
    }
}
