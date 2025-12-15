import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col tech-card bg-card/95 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-2.5 h-2.5 bg-destructive animate-pulse" />
                            <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">Wire Intercept Log</h2>
                        </div>
                        <p className="font-mono text-sm text-muted-foreground/60">
                            Complete history of authorized signals.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable List */}
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
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        DECODING...
                                    </span>
                                ) : (
                                    "LOAD OLDER SIGNALS"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
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
