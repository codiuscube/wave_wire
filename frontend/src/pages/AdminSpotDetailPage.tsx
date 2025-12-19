/**
 * AdminSpotDetailPage - Admin page for managing a single surf spot's locals knowledge.
 * Accessible at /admin/spots/:id
 */

import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import {
  AltArrowLeft,
  MapPoint,
  Book,
  CheckCircle,
  DangerCircle,
} from "@solar-icons/react";
import { DnaLogo, LocalsKnowledgeForm } from "../components/ui";
import { AdminHeader } from "../components/admin";
import { useAuth } from "../contexts/AuthContext";
import { useSurfSpots } from "../hooks";
import type { SpotLocalsKnowledge } from "../types";

export function AdminSpotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, loading: authLoading } = useAuth();

  // Fetch all spots (admin sees all)
  const {
    spots,
    isLoading: spotsLoading,
    updateSpot,
  } = useSurfSpots({ includeUnverified: true });

  // Find the specific spot
  const spot = spots.find((s) => s.id === id);

  // Local state for editing
  const [localsKnowledge, setLocalsKnowledge] = useState<SpotLocalsKnowledge>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sync state when spot data loads
  useEffect(() => {
    if (spot?.localsKnowledge) {
      setLocalsKnowledge(spot.localsKnowledge);
    }
  }, [spot?.localsKnowledge]);

  // Handle save
  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const result = await updateSpot(id, { localsKnowledge });

      if (result.error) {
        setSaveMessage({ type: "error", text: result.error });
      } else {
        setSaveMessage({
          type: "success",
          text: "Locals knowledge saved successfully!",
        });
        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: "Failed to save. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (authLoading || spotsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <DnaLogo className="w-16 h-16 animate-pulse text-primary" />
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Spot not found
  if (!spot) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <MapPoint size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Spot Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The surf spot you're looking for doesn't exist.
            </p>
            <Link
              to="/admin/spots"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <AltArrowLeft size={16} />
              Back to Spots
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/admin" className="hover:text-foreground transition-colors">
            Admin
          </Link>
          <span>/</span>
          <Link
            to="/admin/spots"
            className="hover:text-foreground transition-colors"
          >
            Spots
          </Link>
          <span>/</span>
          <span className="text-foreground">{spot.name}</span>
        </nav>

        {/* Back Link */}
        <Link
          to="/admin/spots"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <AltArrowLeft size={16} />
          Back to Spots
        </Link>

        {/* Spot Info Card */}
        <div className="tech-card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPoint size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{spot.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {spot.region}, {spot.countryGroup}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {spot.verified ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                  <CheckCircle size={14} weight="Bold" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">
                  <DangerCircle size={14} weight="Bold" />
                  Unverified
                </span>
              )}
            </div>
          </div>

          {/* Spot Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Latitude
              </p>
              <p className="text-sm font-mono">{spot.lat.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Longitude
              </p>
              <p className="text-sm font-mono">{spot.lon.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Buoy ID
              </p>
              <p className="text-sm font-mono">{spot.buoyId || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Source
              </p>
              <p className="text-sm capitalize">{spot.source}</p>
            </div>
          </div>
        </div>

        {/* Locals Knowledge Section */}
        <div className="tech-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Book size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Locals Knowledge</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Define optimal conditions for this spot. This data is used by the AI
            to generate better triggers when users say things like "alert me when
            it's good" or "epic conditions".
          </p>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mb-6 p-3 rounded-lg text-sm ${
                saveMessage.type === "success"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          <LocalsKnowledgeForm
            value={localsKnowledge}
            onChange={setLocalsKnowledge}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
