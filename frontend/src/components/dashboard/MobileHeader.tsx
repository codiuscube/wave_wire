import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Logo } from "../ui/Logo";

export function MobileHeader() {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Always show at the very top
            if (currentScrollY < 10) {
                setIsVisible(true);
                setLastScrollY(currentScrollY);
                return;
            }

            // Determine direction
            if (currentScrollY > lastScrollY) {
                // Scrolling DOWN -> Hide
                setIsVisible(false);
            } else {
                // Scrolling UP -> Show
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <header
            className={cn(
                "lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background/30 backdrop-blur-3xl border-b border-white/10 flex items-center justify-center transition-transform duration-300 ease-in-out",
                isVisible ? "translate-y-0" : "-translate-y-full"
            )}
        >
            <div className="flex items-center gap-3">
                <div className="transform -rotate-6">
                    <Logo className="w-8 h-8" style={{ filter: 'drop-shadow(0 0 2px rgba(226,253,92,0.5))' }} />
                </div>
                <span className="font-display font-bold text-lg tracking-wider text-white">
                    WAVE_WIRE
                </span>
            </div>
        </header>
    );
}
