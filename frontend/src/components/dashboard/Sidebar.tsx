import { NavLink } from 'react-router-dom';
import {
  Waves,
  LayoutDashboard,
  MapPin,
  Sliders,
  Bell,
  User,
  MessageSquare,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/dashboard/spot', icon: MapPin, label: 'My Spot' },
  { to: '/dashboard/triggers', icon: Sliders, label: 'Triggers' },
  { to: '/dashboard/alerts', icon: Bell, label: 'Alerts' },
  { to: '/dashboard/personality', icon: MessageSquare, label: 'AI Personality' },
  { to: '/dashboard/account', icon: User, label: 'Account' },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-zinc-950/50 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <NavLink to="/" className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-white" />
          <span className="font-bold tracking-tight text-sm uppercase">Home Break</span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
