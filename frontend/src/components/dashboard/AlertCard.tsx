
export interface Alert {
    id: string;
    spotName: string;
    type: string;
    message: string;
    time: string;
    condition: 'epic' | 'good' | 'fair' | 'poor' | 'unknown';
}

interface AlertCardProps {
    alert: Alert;
    className?: string; // Allow additional classes if needed
}

export function AlertCard({ alert, className = '' }: AlertCardProps) {
    const emoji = alert.condition === 'epic' ? '🔥' : '🌊';

    const formatTimestamp = (isoString: string) => {
        try {
            const date = new Date(isoString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZoneName: 'short'
            }).format(date).replace(',', '');
        } catch (e) {
            return isoString;
        }
    };

    return (
        <div className={`relative flex items-start gap-4 p-5 border border-border/30 bg-card/60 backdrop-blur-sm transition-colors pb-12 sm:pb-5 ${className}`}>


            <div className="flex-1 min-w-0 z-10">
                <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-bold text-lg tracking-tight uppercase text-primary">{alert.spotName}</span>
                </div>
                <p className="font-mono text-base text-foreground/90 leading-relaxed max-w-[90%]">
                    {emoji} {alert.message}
                </p>
            </div>

            {/* Xerox Stamp Timestamp */}
            <div className="absolute bottom-3 right-4 transform -rotate-1 opacity-70">
                <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-[0.2em] border border-muted-foreground/20 px-2 py-1 rounded-[2px]">
                    {formatTimestamp(alert.time)}
                </span>
            </div>
        </div>
    );
}
