import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  Search,
  CheckCircle,
  AlertCircle,
  Edit2,
  Plus,
  MapPin,
  Filter,
  X,
  Save,
  ChevronDown,
} from "lucide-react";
import { Button, Input, AddSpotModal } from "../components/ui";
import { AdminHeader } from "../components/admin";
import { useAuth } from "../contexts/AuthContext";
import {
  getSurfSpots,
  COUNTRY_GROUP_LABELS,
  type SurfSpot,
  type CountryGroup,
} from "../data/surfSpots";

type FilterStatus = "all" | "verified" | "unverified";

interface EditingSpot {
  id: string;
  name: string;
  lat: string;
  lon: string;
  region: string;
  countryGroup: CountryGroup;
  verified: boolean;
}

export function AdminSpotsPage() {
  const { isAdmin, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCountry, setFilterCountry] = useState<CountryGroup | "all">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<EditingSpot | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  // Get all spots from centralized data
  const allSpots = useMemo(() => getSurfSpots(), []);

  // For admin, we'd typically have a state for custom/user spots too
  // For now, we'll work with the official spots and allow "editing" (in-memory only)
  const [spotOverrides, setSpotOverrides] = useState<Record<string, Partial<SurfSpot>>>({});

  // Apply overrides to spots
  const spotsWithOverrides = useMemo(() => {
    return allSpots.map(spot => ({
      ...spot,
      ...spotOverrides[spot.id],
    }));
  }, [allSpots, spotOverrides]);

  // Filter spots
  const filteredSpots = useMemo(() => {
    let spots = spotsWithOverrides;

    // Filter by verification status
    if (filterStatus === "verified") {
      spots = spots.filter(s => s.verified);
    } else if (filterStatus === "unverified") {
      spots = spots.filter(s => !s.verified);
    }

    // Filter by country group
    if (filterCountry !== "all") {
      spots = spots.filter(s => s.countryGroup === filterCountry);
    }

    // Filter by search query
    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      spots = spots.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.region.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      );
    }

    return spots;
  }, [spotsWithOverrides, filterStatus, filterCountry, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = spotsWithOverrides.length;
    const verified = spotsWithOverrides.filter(s => s.verified).length;
    const unverified = total - verified;
    return { total, verified, unverified };
  }, [spotsWithOverrides]);

  const handleEditSpot = (spot: SurfSpot) => {
    setEditingSpot({
      id: spot.id,
      name: spot.name,
      lat: spot.lat.toString(),
      lon: spot.lon.toString(),
      region: spot.region,
      countryGroup: spot.countryGroup,
      verified: spot.verified,
    });
  };

  const handleSaveEdit = () => {
    if (!editingSpot) return;

    setSpotOverrides(prev => ({
      ...prev,
      [editingSpot.id]: {
        name: editingSpot.name,
        lat: parseFloat(editingSpot.lat),
        lon: parseFloat(editingSpot.lon),
        region: editingSpot.region,
        countryGroup: editingSpot.countryGroup,
        verified: editingSpot.verified,
      },
    }));
    setEditingSpot(null);

    // TODO: In production, save to Supabase
    // await supabase.from('surf_spots').upsert({ ... })
  };

  const handleToggleVerified = (spotId: string, currentVerified: boolean) => {
    setSpotOverrides(prev => ({
      ...prev,
      [spotId]: {
        ...prev[spotId],
        verified: !currentVerified,
      },
    }));

    // TODO: In production, update Supabase
  };

  const handleAddSpot = (spot: any) => {
    // Admin-added spots are auto-verified
    console.log("Admin added spot (auto-verified):", { ...spot, verified: true, source: "official" });
    // TODO: Save to Supabase with verified: true
    setIsAddModalOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-mono text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <AdminHeader />

        {/* Page Description */}
        <div className="mb-6">
          <p className="font-mono text-sm text-muted-foreground">
            Verify, edit, and manage surf spot data.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Total Spots
            </div>
            <div className="font-mono text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Verified
            </div>
            <div className="font-mono text-2xl font-bold text-green-500">{stats.verified}</div>
          </div>
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-yellow-500" />
              Unverified
            </div>
            <div className="font-mono text-2xl font-bold text-yellow-500">{stats.unverified}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="tech-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search spots by name, region, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-mono text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="bg-secondary/20 border border-border/50 rounded px-3 py-2 font-mono text-sm"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>

            {/* Country Filter */}
            <div className="relative">
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-secondary/20 border border-border/50 rounded font-mono text-sm"
              >
                <MapPin className="w-4 h-4" />
                {filterCountry === "all" ? "All Regions" : COUNTRY_GROUP_LABELS[filterCountry].label}
                <ChevronDown className={`w-4 h-4 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {countryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border/50 rounded shadow-lg z-20">
                  <button
                    onClick={() => { setFilterCountry("all"); setCountryDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 font-mono text-sm hover:bg-secondary/30 ${filterCountry === "all" ? "bg-primary/10 text-primary" : ""}`}
                  >
                    All Regions
                  </button>
                  {(Object.keys(COUNTRY_GROUP_LABELS) as CountryGroup[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setFilterCountry(key); setCountryDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 font-mono text-sm hover:bg-secondary/30 ${filterCountry === key ? "bg-primary/10 text-primary" : ""}`}
                    >
                      {COUNTRY_GROUP_LABELS[key].flag} {COUNTRY_GROUP_LABELS[key].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Spot Button */}
            <Button onClick={() => setIsAddModalOpen(true)} className="ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Spot
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="font-mono text-xs text-muted-foreground mb-4">
          Showing {filteredSpots.length} of {stats.total} spots
        </div>

        {/* Spots Table */}
        <div className="tech-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/20 border-b border-border/50">
                <tr>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Region
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Country
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Coordinates
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredSpots.slice(0, 100).map((spot) => (
                  <tr key={spot.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVerified(spot.id, spot.verified)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono uppercase ${
                          spot.verified
                            ? "bg-green-500/20 text-green-500"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {spot.verified ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Unverified
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{spot.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{spot.region}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">
                        {COUNTRY_GROUP_LABELS[spot.countryGroup]?.flag} {spot.countryGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {spot.lat.toFixed(4)}, {spot.lon.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEditSpot(spot)}
                        className="p-2 hover:bg-secondary/30 rounded transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSpots.length > 100 && (
            <div className="px-4 py-3 bg-secondary/10 border-t border-border/30 font-mono text-xs text-muted-foreground text-center">
              Showing first 100 results. Refine your search to see more.
            </div>
          )}
        </div>

        {/* Dev Mode Toggle (for testing) */}
        <div className="mt-8 p-4 border border-dashed border-border/50 rounded">
          <div className="font-mono text-xs text-muted-foreground mb-2">
            Developer Tools (remove in production)
          </div>
          <button
            onClick={() => {
              const current = localStorage.getItem('homebreak_admin_mode') === 'true';
              localStorage.setItem('homebreak_admin_mode', (!current).toString());
              window.location.reload();
            }}
            className="font-mono text-xs text-primary hover:underline"
          >
            Toggle Admin Mode (currently: {localStorage.getItem('homebreak_admin_mode') === 'true' ? 'ON' : 'OFF'})
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setEditingSpot(null)}
          />
          <div className="relative z-10 bg-card tech-card rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-mono text-lg font-bold uppercase tracking-wider">Edit Spot</h3>
              <button
                onClick={() => setEditingSpot(null)}
                className="p-2 hover:bg-secondary/30 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Name
                </label>
                <Input
                  value={editingSpot.name}
                  onChange={(e) => setEditingSpot({ ...editingSpot, name: e.target.value })}
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Latitude
                  </label>
                  <Input
                    value={editingSpot.lat}
                    onChange={(e) => setEditingSpot({ ...editingSpot, lat: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Longitude
                  </label>
                  <Input
                    value={editingSpot.lon}
                    onChange={(e) => setEditingSpot({ ...editingSpot, lon: e.target.value })}
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Region
                </label>
                <Input
                  value={editingSpot.region}
                  onChange={(e) => setEditingSpot({ ...editingSpot, region: e.target.value })}
                  className="font-mono"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                  Country Group
                </label>
                <select
                  value={editingSpot.countryGroup}
                  onChange={(e) => setEditingSpot({ ...editingSpot, countryGroup: e.target.value as CountryGroup })}
                  className="w-full bg-secondary/20 border border-border/50 rounded px-3 py-2 font-mono text-sm"
                >
                  {(Object.keys(COUNTRY_GROUP_LABELS) as CountryGroup[]).map((key) => (
                    <option key={key} value={key}>
                      {COUNTRY_GROUP_LABELS[key].flag} {COUNTRY_GROUP_LABELS[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="verified"
                  checked={editingSpot.verified}
                  onChange={(e) => setEditingSpot({ ...editingSpot, verified: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="verified" className="font-mono text-sm">
                  Verified Spot
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setEditingSpot(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Spot Modal */}
      <AddSpotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        savedSpots={[]}
        onAddSpot={handleAddSpot}
      />
    </div>
  );
}
