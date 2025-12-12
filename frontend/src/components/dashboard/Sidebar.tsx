import { NavLink } from "react-router-dom";
import {
  Waves,
  LayoutDashboard,
  MapPin,
  Sliders,
  Bell,
  User,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/spot", icon: MapPin, label: "My Spots" },
  { to: "/dashboard/triggers", icon: Sliders, label: "Triggers" },
  { to: "/dashboard/alerts", icon: Bell, label: "Alerts" },
  {
    to: "/dashboard/personality",
    icon: MessageSquare,
    label: "Personality",
  },
  { to: "/dashboard/account", icon: User, label: "Account" },
];

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-sidebar-border bg-sidebar-background flex items-center justify-between px-4">
        <NavLink to="/" className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-sidebar-primary" />
          <span className="font-bold font-display tracking-tighter uppercase text-xl text-sidebar-foreground">
            HOMEBREAK
          </span>
        </NavLink>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-3 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 border-r border-sidebar-border bg-sidebar-background flex flex-col h-screen fixed left-0 top-0 z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo - hidden on mobile since header shows it */}
        <div className="p-6 border-b border-sidebar-border hidden lg:block">
          <NavLink to="/" className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-sidebar-primary" />
            <span className="font-bold font-display tracking-tighter uppercase text-xl text-sidebar-foreground">
              HOMEBREAK
            </span>
          </NavLink>
        </div>

        {/* Spacer for mobile header */}
        <div className="h-14 lg:hidden" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

      </aside>
    </>
  );
}
