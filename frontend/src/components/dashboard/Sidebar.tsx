import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  Crosshair,
  Radar,
  Radio,
  Fingerprint,
  Terminal,
  Menu,
  X,
  LogOut,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Logo } from "../ui/Logo";

const navItems = [
  { to: "/dashboard", icon: Activity, label: "Overview", end: true },
  { to: "/dashboard/spot", icon: Crosshair, label: "My Spots" },
  { to: "/dashboard/triggers", icon: Radar, label: "Triggers" },
  { to: "/dashboard/alerts", icon: Radio, label: "Alerts" },
  {
    to: "/dashboard/personality",
    icon: Terminal,
    label: "Personality",
  },
  { to: "/dashboard/account", icon: Fingerprint, label: "Account" },
];

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-sidebar-border bg-sidebar-background flex items-center justify-between px-6 bg-background/80 backdrop-blur-md">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="p-1.5 rounded-lg bg-secondary group-hover:bg-muted transition-colors">
            <Logo className="w-5 h-5 text-foreground" />
          </div>
          <span className="font-bold tracking-tight uppercase text-lg">
            Homebreak
          </span>
        </NavLink>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2.5 rounded-lg hover:bg-secondary/50 text-foreground/80 hover:text-foreground touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-72 border-r border-sidebar-border bg-sidebar-background flex flex-col h-screen fixed left-0 top-0 z-50
          transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
          lg:translate-x-0 bg-background
          ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-lg bg-secondary group-hover:bg-muted transition-colors">
              <Logo className="w-5 h-5 text-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white/90">
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
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`
                }
              >
                <item.icon className="w-4 h-4 group-hover:text-foreground transition-colors" />
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
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                      ? "bg-yellow-500/20 text-yellow-500 shadow-sm"
                      : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                    }`
                  }
                >
                  <Shield className="w-4 h-4" />
                  Spot Management
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
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`
                }
              >
                <accountItem.icon className="w-4 h-4 group-hover:text-foreground transition-colors" />
                {accountItem.label}
              </NavLink>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group text-muted-foreground hover:text-red-400 hover:bg-red-500/10 w-full"
            >
              <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
              Log Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
