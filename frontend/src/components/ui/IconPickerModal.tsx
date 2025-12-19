import { createPortal } from "react-dom";
import {
    CloseCircle,
    // Existing & New imports
    Target, MapPoint, Star, Leaf, Water, Sun, Cloud, Compass, Bolt, Fire, Ghost, Rocket, Radio, DangerTriangle, Planet, Atom, Widget, Wind,
    // New (Validated)
    Snowflake,
    Fog, Tornado, Stars,
    Moon, Earth, BlackHole, Infinity,
    Route, Global, Radar, Gps,
    Shield, Lock, Key, Bomb, Scanner,
    Bell, BellBing,
    Hourglass, Alarm,
    Laptop, Smartphone, Server, Database, BatteryFull as Battery,
    // New Batch (To reach 60)
    Lightbulb, Bluetooth, SdCard, SimCard, HeadphonesRound, Gamepad, Monitor, Swimming, Dollar, Wallet,
    Home, Heart, Like, Flag, Cup, Crown,
} from '@solar-icons/react';

interface IconPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectIcon: (iconName: string) => void;
    currentIcon?: string;
}

export const AVAILABLE_ICONS = {
    // Nature
    Leaf,
    Water,
    Fire,
    Wind,
    Snowflake,
    // Weather
    Sun,
    Cloud,
    Bolt,
    Fog,
    Tornado,
    Stars,
    // Astronomy
    Star,
    Planet,
    Moon,
    Earth,
    BlackHole,
    Infinity,
    // Map
    MapPoint,
    Compass,
    Route,
    Global,
    Radar,
    Gps,
    // Security
    Shield,
    Lock,
    Key,
    Bomb,
    Scanner,
    Danger: DangerTriangle, // Renamed from DangerTriangle
    // Notifications
    Bell,
    BellBing,
    // Time
    Hourglass,
    Alarm,
    // Tech
    Laptop,
    Phone: Smartphone, // Alias Smartphone
    Server,
    Database,
    Battery,
    // Gadgets
    Idea: Lightbulb,
    Bluetooth,
    Storage: SdCard,
    Chip: SimCard,
    Audio: HeadphonesRound,
    Game: Gamepad,
    Screen: Monitor,
    // Lifestyle
    Swim: Swimming,
    Cost: Dollar,
    Funds: Wallet,
    // Misc
    Home,
    Heart,
    Like,
    Flag,
    Cup,
    Crown,
    Target, // Keep start icon
    Ghost,
    Rocket,
    Radio,
    Atom,
    Widget,
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
            <div className="relative z-10 bg-card/95 tech-card rounded-lg w-full max-w-lg flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50 shrink-0">
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
                        <CloseCircle weight="BoldDuotone" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto custom-scrollbar">
                    {Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => {
                        const isSelected = currentIcon === name || (!currentIcon && name === "Target");
                        return (
                            <button
                                key={name}
                                onClick={() => {
                                    onSelectIcon(name);
                                    onClose();
                                }}
                                className={`aspect-square flex flex-col items-center justify-center gap-1.5 rounded-md border transition-all duration-300 group active:scale-95 ${isSelected
                                    ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] backdrop-blur-sm ring-1 ring-cyan-500/20"
                                    : "bg-slate-900/20 border-slate-800/50 text-slate-400 hover:bg-cyan-950/20 hover:text-cyan-100 hover:border-cyan-500/30 hover:shadow-[0_0_15px_-5px_rgba(6,182,212,0.15)] backdrop-blur-[2px]"
                                    }`}
                            >
                                <Icon weight="BoldDuotone" className={`w-24 h-24 sm:w-16 sm:h-16 transition-all duration-300 ${isSelected ? "text-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]" : "text-slate-500 group-hover:text-cyan-300 group-hover:scale-110"}`} />

                            </button>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
}
