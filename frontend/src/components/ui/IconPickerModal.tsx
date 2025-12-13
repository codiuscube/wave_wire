import { createPortal } from "react-dom";
import {
    X,
    MapPin,
    Crosshair,
    Star,
    Palmtree,
    Waves,
    Sun,
    Cloud,
    Anchor,
    Zap,
    Skull,
    Ghost,
    Rocket,
    Fish,
    Radio,
    Triangle,
    Hexagon,
    Circle,
    Square,
    Droplet,
    Wind,
} from "lucide-react";

interface IconPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectIcon: (iconName: string) => void;
    currentIcon?: string;
}

export const AVAILABLE_ICONS = {
    Crosshair,
    MapPin,
    Star,
    Palmtree,
    Waves,
    Sun,
    Cloud,
    Anchor,
    Zap,
    Skull,
    Ghost,
    Rocket,
    Fish,
    Radio,
    Triangle,
    Hexagon,
    Circle,
    Square,
    Droplet,
    Wind,
};

export function IconPickerModal({
    isOpen,
    onClose,
    onSelectIcon,
    currentIcon,
}: IconPickerModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 bg-card/95 tech-card rounded-lg w-full max-w-lg flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-2.5 h-2.5 bg-primary animate-pulse" />
                            <h2 className="font-mono text-base tracking-widest text-muted-foreground uppercase">
                                Assign Icon
                            </h2>
                        </div>
                        <p className="font-mono text-sm text-muted-foreground/60">
                            Select visual identifier for this target.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-4 sm:grid-cols-5 gap-4">
                    {Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => {
                        const isSelected = currentIcon === name || (!currentIcon && name === "Crosshair");
                        return (
                            <button
                                key={name}
                                onClick={() => {
                                    onSelectIcon(name);
                                    onClose();
                                }}
                                className={`aspect-square flex flex-col items-center justify-center gap-2 rounded-sm border transition-all group ${isSelected
                                    ? "bg-primary/20 border-primary text-primary"
                                    : "bg-secondary/10 border-border/50 text-muted-foreground hover:bg-secondary/30 hover:text-foreground hover:border-primary/50"
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
                                <span className="font-mono text-[10px] uppercase tracking-wider opacity-60">
                                    {name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
}
