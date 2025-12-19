
export function DnaLogo({ className = "w-16 h-16" }: { className?: string }) {
    const pathD = "M10 50 C 20 50, 25 30, 35 30 C 45 30, 50 70, 60 70 C 70 70, 75 40, 85 40 C 95 40, 95 50, 95 50";

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-contain"
            >
                {/* Background Trace (Faint) */}
                <path
                    d={pathD}
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground opacity-20"
                />

                {/* Animated Pulse (Bright) */}
                <path
                    d={pathD}
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary animate-pulse-wave"
                    style={{
                        strokeDasharray: "20, 80",
                        strokeDashoffset: "0",
                    }}
                />


            </svg>
        </div>
    );
}
