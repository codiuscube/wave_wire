import { NavLink, useNavigate } from "react-router-dom";
import {
  Water,
  MapPoint,
  Bolt,
  ChatRoundDots,
  Scanner,
  Database,
  ChartSquare,
  Logout,
  UsersGroupRounded,
} from "@solar-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "../ui/Logo";

// Icon configuration for consistent styling
const ICON_SIZE = 24;

const navItems = [
  { to: "/dashboard", icon: Water, label: "Overview", end: true },
  { to: "/spots", icon: MapPoint, label: "My Spots" },
  { to: "/triggers", icon: Bolt, label: "Triggers" },
  { to: "/alerts", icon: ChatRoundDots, label: "Alerts" },
  { to: "/account", icon: Scanner, label: "Account" },
];

export function Sidebar() {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Separate nav items
  const mainNavItems = navItems.filter(item => item.label !== "Account");
  const accountItem = navItems.find(item => item.label === "Account");

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* Sidebar - Desktop Only */}
      <aside
        className="hidden lg:flex w-64 fixed top-4 left-4 bottom-4 z-50 flex-col bg-background/30 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <NavLink to="/" className="flex items-center gap-3 text-brand-acid group">
            <div className="transform -rotate-6 transition-transform group-hover:rotate-0 duration-300">
              <Logo className="w-10 h-10" style={{ filter: 'drop-shadow(0 0 2px rgba(226,253,92,0.5))' }} />
            </div>
            <span className="font-display font-bold text-lg tracking-wider text-white">
              WAVE_WIRE
            </span>
          </NavLink>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col justify-between py-6 px-4 overflow-y-auto">
          <nav className="space-y-1">

            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`
                }
              >
                <item.icon size={ICON_SIZE} weight="BoldDuotone" className="group-hover:text-foreground transition-colors" />
                {item.label}
              </NavLink>
            ))}

            {/* Admin Section - only visible to admins */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-sidebar-border/50">
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Admin</span>
                </div>
                <NavLink
                  to="/admin/spots"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                      ? "bg-yellow-500/20 text-yellow-500 shadow-sm"
                      : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                    }`
                  }
                >
                  <Database size={ICON_SIZE} weight="BoldDuotone" />
                  Spot Management
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                      ? "bg-yellow-500/20 text-yellow-500 shadow-sm"
                      : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                    }`
                  }
                >
                  <UsersGroupRounded size={ICON_SIZE} weight="BoldDuotone" />
                  User Management
                </NavLink>
                <NavLink
                  to="/admin/investment"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                      ? "bg-yellow-500/20 text-yellow-500 shadow-sm"
                      : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                    }`
                  }
                >
                  <ChartSquare size={ICON_SIZE} weight="BoldDuotone" />
                  Investment
                </NavLink>
                <NavLink
                  to="/dashboard?onboarding=true"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                      ? "bg-yellow-500/20 text-yellow-500 shadow-sm"
                      : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                    }`
                  }
                >
                  <Bolt size={ICON_SIZE} weight="BoldDuotone" />
                  Test Onboarding
                </NavLink>
              </div>
            )}
          </nav>

          {/* Bottom Section */}
          <div className="pt-6 mt-6 border-t border-sidebar-border/50 space-y-1">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</span>
            </div>
            {accountItem && (
              <NavLink
                to={accountItem.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`
                }
              >
                <accountItem.icon size={ICON_SIZE} weight="BoldDuotone" className="group-hover:text-foreground transition-colors" />
                {accountItem.label}
              </NavLink>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group text-muted-foreground hover:text-red-400 hover:bg-red-500/10 w-full"
            >
              <Logout size={ICON_SIZE} weight="BoldDuotone" className="group-hover:text-red-400 transition-colors" />
              Log Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
