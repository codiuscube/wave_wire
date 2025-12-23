
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
    Home as HomeIcon,
    MapPoint,
    Bolt,
    User,
    Shield,
    Logout,
    History,
} from "@solar-icons/react";
import { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";
import { Sheet } from "../ui/Sheet";

// Icon configuration
const ICON_SIZE = 24;

const navItems = [
    { to: "/dashboard", icon: HomeIcon, label: "Home", end: true },
    { to: "/spots", icon: MapPoint, label: "Spots" },
    { to: "/triggers", icon: Bolt, label: "Alerts" },
    { to: "/surf-log", icon: History, label: "Log" },
];

export function MobileNav() {
    const { signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isAdminSheetOpen, setIsAdminSheetOpen] = useState(false);

    // Long press logic ref
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    const handleTouchStart = () => {
        isLongPress.current = false;
        timerRef.current = setTimeout(() => {
            isLongPress.current = true;
            // Trigger haptic feedback if available (mobile only)
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
            setIsAdminSheetOpen(true);
        }, 500); // 500ms threshold
    };

    const handleTouchEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    const handleAccountClick = (e: React.MouseEvent) => {
        if (isLongPress.current) {
            e.preventDefault();
            // Reset after handling
            isLongPress.current = false;
        } else {
            // Normal navigation lets the NavLink handle it
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const isActiveAccount = location.pathname === "/account";

    return (
        <>
            <nav
                className="fixed left-2 right-2 z-50 bg-background/30 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 lg:hidden"
                style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                                isActive ? "text-brand-acid" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={cn(
                                        "p-1.5 rounded-full transition-all duration-300",
                                        isActive && "bg-brand-acid/10 shadow-[0_0_10px_rgba(226,253,92,0.2)]"
                                    )}>
                                        <item.icon
                                            size={ICON_SIZE}
                                            weight="BoldDuotone"
                                            className={cn("transition-transform duration-300", isActive && "scale-110")}
                                        />
                                    </div>
                                    <span className="text-xs font-medium tracking-wide">
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}

                    {/* Account Item with Long Press */}
                    <NavLink
                        to="/account"
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                            isActiveAccount ? "text-brand-acid" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={handleAccountClick}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleTouchStart}
                        onMouseUp={handleTouchEnd}
                        onMouseLeave={handleTouchEnd}
                    >
                        <div className={cn(
                            "p-1.5 rounded-full transition-all duration-300",
                            isActiveAccount && "bg-brand-acid/10 shadow-[0_0_10px_rgba(226,253,92,0.2)]"
                        )}>
                            <User
                                size={ICON_SIZE}
                                weight="BoldDuotone"
                                className={cn("transition-transform duration-300", isActiveAccount && "scale-110")}
                            />
                        </div>
                        <span className="text-xs font-medium tracking-wide">
                            Account
                        </span>
                    </NavLink>
                </div>
            </nav>

            <Sheet
                isOpen={isAdminSheetOpen}
                onClose={() => setIsAdminSheetOpen(false)}
                title="Admin & Options"
            >
                <div className="p-4 space-y-4 pb-8">
                    {isAdmin && (
                        <>
                            <div
                                onClick={() => { navigate('/admin'); setIsAdminSheetOpen(false); }}
                                className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 active:scale-[0.98] transition-all cursor-pointer"
                            >
                                <Shield size={24} weight="BoldDuotone" />
                                <span className="font-medium">Admin Portal</span>
                            </div>
                            <div className="h-px bg-border/50 my-4" />
                        </>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all"
                    >
                        <Logout size={24} weight="BoldDuotone" />
                        <span className="font-medium">Log Out</span>
                    </button>
                </div>
            </Sheet>
        </>
    );
}
