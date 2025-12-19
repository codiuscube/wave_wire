import { useState, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  Magnifer,
  CheckCircle,
  DangerCircle,
  Pen,
  AddCircle,
  MapPoint,
  Filter,
  CloseCircle,
  Diskette,
  AltArrowDown,
  Book,
} from '@solar-icons/react';
import { Button, Input, AddSpotModal, DnaLogo } from "../components/ui";
import { AdminHeader } from "../components/admin";
import { useAuth } from "../contexts/AuthContext";
import { useSurfSpots } from "../hooks";
import {
  COUNTRY_GROUP_LABELS,
  type CountryGroup,
} from "../data/surfSpots";
import type { SurfSpot } from "../lib/mappers";

type FilterStatus = "all" | "verified" | "unverified";

interface EditingSpot {
  id: string;
  name: string;
  lat: string;
  lon: string;
  region: string;
  countryGroup: SurfSpot['countryGroup'];
  verified: boolean;
}

export function AdminSpotsPage() {
  const { isAdmin, loading: authLoading } = useAuth();

  // Fetch all spots from Supabase (include unverified for admin)
  const {
    spots: allSpots,
    isLoading: spotsLoading,
    error: spotsError,
    toggleVerified,
    updateSpot,
    addSpot: addSurfSpot,
  } = useSurfSpots({ includeUnverified: true });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCountry, setFilterCountry] = useState<CountryGroup | "all">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<EditingSpot | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filter spots
  const filteredSpots = useMemo(() => {
    let spots = allSpots;

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
  }, [allSpots, filterStatus, filterCountry, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = allSpots.length;
    const verified = allSpots.filter(s => s.verified).length;
    const unverified = total - verified;
    return { total, verified, unverified };
  }, [allSpots]);

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

  const handleSaveEdit = async () => {
    if (!editingSpot) return;

    setIsSaving(true);
    const { error } = await updateSpot(editingSpot.id, {
      name: editingSpot.name,
      lat: parseFloat(editingSpot.lat),
      lon: parseFloat(editingSpot.lon),
      region: editingSpot.region,
      countryGroup: editingSpot.countryGroup,
      verified: editingSpot.verified,
    });
    setIsSaving(false);

    if (error) {
      console.error('Error saving spot:', error);
    } else {
      setEditingSpot(null);
    }
  };

  const handleToggleVerified = async (spotId: string, currentVerified: boolean) => {
    const { error } = await toggleVerified(spotId, !currentVerified);
    if (error) {
      console.error('Error toggling verified:', error);
    }
  };

  const handleAddSpot = async (spot: any) => {
    // Admin-added spots are auto-verified
    const newSpot = {
      id: spot.id || `spot-${Date.now()}`,
      name: spot.name,
      lat: spot.lat || 0,
      lon: spot.lon || 0,
      region: spot.region || 'Unknown',
      countryGroup: (spot.countryGroup || 'USA') as SurfSpot['countryGroup'],
      country: spot.country || null,
      buoyId: spot.buoyId || null,
      buoyName: spot.buoyName || null,
      verified: true,
      source: 'official' as const,
    };

    const { error } = await addSurfSpot(newSpot);
    if (error) {
      console.error('Error adding spot:', error);
    } else {
      setIsAddModalOpen(false);
    }
  };

  // Loading state
  if (authLoading || spotsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DnaLogo className="w-16 h-16" />
      </div>
    );
  }

  // Error state
  if (spotsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="tech-card border-destructive p-6">
          <p className="text-destructive">Error loading spots: {spotsError}</p>
        </div>
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
              <CheckCircle weight="Bold" size={12} className="text-green-500" />
              Verified
            </div>
            <div className="font-mono text-2xl font-bold text-green-500">{stats.verified}</div>
          </div>
          <div className="tech-card p-4">
            <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <DangerCircle weight="Bold" size={12} className="text-yellow-500" />
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
              <Magnifer weight="Bold" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search spots by name, region, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 font-mono text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter weight="Bold" size={16} className="text-muted-foreground" />
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
                <MapPoint weight="Bold" size={16} />
                {filterCountry === "all" ? "All Regions" : COUNTRY_GROUP_LABELS[filterCountry].label}
                <AltArrowDown weight="Bold" size={16} className={`transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
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
              <AddCircle weight="Bold" size={16} className="mr-2" />
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
                            <CheckCircle weight="Bold" size={12} />
                            Verified
                          </>
                        ) : (
                          <>
                            <DangerCircle weight="Bold" size={12} />
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditSpot(spot)}
                          className="p-2 hover:bg-secondary/30 rounded transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit Spot"
                        >
                          <Pen weight="Bold" size={16} />
                        </button>
                        <Link
                          to={`/admin/spots/${spot.id}`}
                          className="p-2 hover:bg-secondary/30 rounded transition-colors text-muted-foreground hover:text-primary"
                          title="Edit Locals Knowledge"
                        >
                          <Book weight="Bold" size={16} />
                        </Link>
                      </div>
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
                <CloseCircle weight="Bold" size={20} />
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
                <Button variant="outline" onClick={() => setEditingSpot(null)} className="flex-1" disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Diskette weight="Bold" size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
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
