import { useState, useEffect } from 'react';
import { CloseCircle } from '@solar-icons/react';
import { Sheet } from '../ui/Sheet';
import { AlertCard, type Alert } from './AlertCard';

interface AlertsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialAlerts: Alert[];
}

export function AlertsModal({ isOpen, onClose, initialAlerts }: AlertsModalProps) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Initialize with passed alerts on open
    useEffect(() => {
        if (isOpen) {
            // Mock initial larger dataset
            const moreAlerts = generateMockAlerts(10);
            setAlerts([...initialAlerts, ...moreAlerts]);
            setPage(1);
            setHasMore(true);
        }
    }, [isOpen, initialAlerts]);

    const loadMore = () => {
        if (loading) return;
        setLoading(true);

        // Simulate API delay
        setTimeout(() => {
            const newAlerts = generateMockAlerts(10);
            setAlerts(prev => [...prev, ...newAlerts]);
            setPage(prev => prev + 1);
            setLoading(false);

            // Stop after 5 pages for demo
            if (page >= 5) setHasMore(false);
        }, 800);
    };

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
                    Complete history of authorized signals.
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
                {alerts.map((alert, idx) => (
                    <AlertCard key={`${alert.id}-${idx}`} alert={alert} />
                ))}

                {hasMore && (
                    <div className="pt-4 flex justify-center">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="btn-brutal text-sm py-3 px-8 disabled:opacity-50"
                        >
                            {loading ? (
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
            </div>
        </Sheet>
    );
}

// Helper to generate mock data
function generateMockAlerts(count: number): Alert[] {
    return Array.from({ length: count }).map((_, i) => ({
        id: `mock-${Date.now()}-${i}`,
        spotName: Math.random() > 0.5 ? 'Surfside Beach' : 'Galveston (61st St)',
        type: 'Archive',
        message: 'Historic data point retrieved. Conditions verified.',
        time: new Date(Date.now() - (Math.floor(Math.random() * 30) + 2) * 24 * 60 * 60 * 1000).toISOString(),
        condition: Math.random() > 0.7 ? 'epic' : 'good',
    }));
}
