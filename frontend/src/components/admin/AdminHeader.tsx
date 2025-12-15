import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, TrendingUp } from "lucide-react";

const adminNavItems = [
  { to: "/admin/spots", icon: Shield, label: "Spot Management" },
  { to: "/admin/investment", icon: TrendingUp, label: "Investment" },
];

export function AdminHeader() {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 font-mono text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-yellow-500/20">
          <Shield className="w-5 h-5 text-yellow-500" />
        </div>
        <h1 className="font-mono text-2xl font-bold uppercase tracking-wider">
          Admin Panel
        </h1>
      </div>

      <nav className="flex gap-2 border-b border-border/50 pb-4">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                isActive
                  ? "bg-yellow-500/20 text-yellow-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
