
import { motion } from "framer-motion";

export interface SegmentedControlOption<T extends string> {
    value: T;
    label: string | React.ReactNode;
    tooltip?: string;
}

interface SegmentedControlProps<T extends string> {
    options: SegmentedControlOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    className = "",
}: SegmentedControlProps<T>) {
    return (
        <div className={`flex bg-muted p-1 rounded-lg ${className}`}>
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <div key={option.value} className="flex-1 relative group">
                        <button
                            onClick={() => onChange(option.value)}
                            className={`w-full relative z-10 text-sm font-medium py-1.5 px-3 rounded-md transition-colors ${isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {option.label}
                            {isActive && (
                                <motion.div
                                    layoutId="segmentedControlHighlight"
                                    className="absolute inset-0 bg-primary rounded-md -z-10 shadow-md"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>

                        {option.tooltip && (
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg hidden group-hover:block z-50 border pointer-events-none text-center">
                                {option.tooltip}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
