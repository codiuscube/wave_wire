import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AddCircle, MapPoint, Target, AltArrowDown, History } from '@solar-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useUserSpots, useSurfSessions, useMinimumLoading } from '../hooks';
import { AVAILABLE_ICONS } from '../components/ui/IconPickerModal';
import { Button } from '../components/ui';
import { SurfSessionCard } from '../components/ui/SurfSessionCard';
import { SurfSessionModal } from '../components/ui/SurfSessionModal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DnaLogo } from '../components/ui/DnaLogo';
import type { SurfSession, SessionConditions, SessionQuality, SessionCrowd } from '../lib/mappers';
import { showSuccess, showError } from '../lib/toast';

export function SurfLogPage() {
  const { user, isAdmin } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);

  // Admins get premium tier
  const tier = isAdmin ? 'premium' : (profile?.subscriptionTier || 'free');

  // Get user's spots
  const { spots: userSpots, isLoading: spotsLoading } = useUserSpots(user?.id, tier);

  // Get user's surf sessions
  const {
    sessions,
    isLoading: sessionsLoading,
    addSession,
    updateSession,
    deleteSession,
  } = useSurfSessions(user?.id);

  // State
  const [selectedSpotId, setSelectedSpotId] = useState<string>('all');
  const [isSpotDropdownOpen, setIsSpotDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SurfSession | undefined>(undefined);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = profileLoading || spotsLoading || sessionsLoading;
  const hasSpots = userSpots.length > 0;

  // Loading state
  const isPageLoading = useMinimumLoading(isLoading);

  // Filter sessions by spot if one is selected
  const filteredSessions = selectedSpotId === 'all'
    ? sessions
    : sessions.filter((s) => s.spotId === selectedSpotId);

  // Get spot name by ID
  const getSpotName = (spotId: string): string => {
    const spot = userSpots.find((s) => s.id === spotId);
    return spot?.name || 'Unknown Spot';
  };

  // Selected spot
  const selectedSpot = selectedSpotId !== 'all'
    ? userSpots.find((s) => s.id === selectedSpotId)
    : null;

  const handleOpenModal = (session?: SurfSession) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSession(undefined);
  };

  const handleSubmit = async (data: {
    spotId: string;
    sessionDate: string;
    durationMinutes: number;
    quality: SessionQuality;
    crowd: SessionCrowd;
    notes: string | null;
    conditions: SessionConditions | null;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingSession) {
        const { error } = await updateSession(editingSession.id, data);
        if (error) {
          showError('Failed to update session');
        } else {
          showSuccess('Session updated');
        }
      } else {
        const { error } = await addSession(data);
        if (error) {
          showError('Failed to log session');
        } else {
          showSuccess('Session logged');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteSessionId) return;
    const { error } = await deleteSession(deleteSessionId);
    if (error) {
      showError('Failed to delete session');
    } else {
      showSuccess('Session deleted');
    }
    setDeleteSessionId(null);
  };

  if (isPageLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <DnaLogo className="w-16 h-16" />
      </div>
    );
  }

  return (
    <div className="relative p-4 min-h-[calc(100vh-4rem)] flex flex-col items-center">
      {/* Background Tech Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-brand-rogue text-brand-abyss font-bold font-mono text-xs px-2 py-1 mb-4 transform -rotate-1 tracking-widest tape">
            // SESSION_LOG
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-display glitch-text mb-2" data-text="SURF LOG">
            SURF LOG
          </h1>
          <p className="font-mono text-muted-foreground text-sm sm:text-base border-muted px-4">
            Track your sessions with real conditions.
          </p>
        </div>

        {/* Spot Filter */}
        <div className="w-full relative z-20 mb-8">
          {hasSpots ? (
            <div className="relative w-full max-w-sm mx-auto">
              <label className="text-xs font-bold font-mono uppercase mb-2 block tracking-wider text-center text-muted-foreground">
                Filter by Spot
              </label>

              <div className="relative group">
                {/* Dropdown Button */}
                <button
                  onClick={() => setIsSpotDropdownOpen(!isSpotDropdownOpen)}
                  className={`
                    w-full flex items-center justify-between px-6 py-4
                    bg-card/80 backdrop-blur-md border border-border/50
                    text-foreground transition-all duration-200
                    hover:border-primary/50 hover:shadow-[0_0_15px_-5px_hsl(var(--primary)/0.3)]
                    ${isSpotDropdownOpen ? 'border-primary ring-1 ring-primary/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {(() => {
                      const IconComponent = selectedSpot?.icon && AVAILABLE_ICONS[selectedSpot.icon as keyof typeof AVAILABLE_ICONS]
                        ? AVAILABLE_ICONS[selectedSpot.icon as keyof typeof AVAILABLE_ICONS]
                        : selectedSpot ? Target : MapPoint;
                      return <IconComponent weight="Bold" size={16} className={`shrink-0 ${selectedSpot ? 'text-primary' : 'text-muted-foreground'}`} />;
                    })()}
                    <span className="font-mono text-sm uppercase truncate font-bold tracking-wide">
                      {selectedSpot ? selectedSpot.name : 'All Spots'}
                    </span>
                  </div>
                  <AltArrowDown weight="Bold" size={16} className={`shrink-0 transition-transform duration-200 ${isSpotDropdownOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isSpotDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 z-50 max-h-60 overflow-y-auto shadow-2xl rounded-none"
                    >
                      {/* All Spots Option */}
                      <button
                        onClick={() => {
                          setSelectedSpotId('all');
                          setIsSpotDropdownOpen(false);
                        }}
                        className={`
                          w-full text-left px-4 py-3 font-mono text-sm uppercase transition-colors
                          flex items-center justify-between
                          ${selectedSpotId === 'all'
                            ? 'bg-primary/5 text-primary border-l-2 border-primary'
                            : 'text-muted-foreground border-l-2 border-transparent hover:bg-secondary/20 hover:text-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <MapPoint weight="Bold" size={14} className="shrink-0" />
                          <span>All Spots</span>
                        </div>
                        {selectedSpotId === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      </button>
                      {userSpots.map((spot) => {
                        const SpotIcon = spot.icon && AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
                          ? AVAILABLE_ICONS[spot.icon as keyof typeof AVAILABLE_ICONS]
                          : Target;
                        return (
                          <button
                            key={spot.id}
                            onClick={() => {
                              setSelectedSpotId(spot.id);
                              setIsSpotDropdownOpen(false);
                            }}
                            className={`
                              w-full text-left px-4 py-3 font-mono text-sm uppercase transition-colors
                              flex items-center justify-between
                              ${selectedSpotId === spot.id
                                ? 'bg-primary/5 text-primary border-l-2 border-primary'
                                : 'text-muted-foreground border-l-2 border-transparent hover:bg-secondary/20 hover:text-foreground'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <SpotIcon weight="Bold" size={14} className="shrink-0" />
                              <span>{spot.name}</span>
                            </div>
                            {selectedSpotId === spot.id && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selection Indicator Line */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-4"
              />
            </div>
          ) : (
            /* Empty State - No Spots */
            <div className="w-full border border-dashed border-border/50 bg-secondary/5 rounded-lg p-12 flex flex-col items-center justify-center text-center">
              <div className="mb-6">
                <DnaLogo className="w-16 h-16" />
              </div>
              <h3 className="font-mono text-xl font-bold uppercase mb-3 text-foreground">No Spots Configured</h3>
              <p className="text-muted-foreground text-sm font-mono max-w-sm mb-8 leading-relaxed">
                Add spots to start logging surf sessions.
              </p>
              <Link to="/spots">
                <Button variant="rogue-secondary" className="px-4 py-2">
                  <AddCircle weight="Bold" size={16} className="mr-2" />
                  ADD SPOTS
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Sessions List */}
        {hasSpots && (
          <div className="w-full space-y-4 pb-24">
            {/* Stats Row */}
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-sm text-muted-foreground">
                {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} logged
              </p>
            </div>

            {/* Session Cards */}
            {filteredSessions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 border border-dashed border-border/50 bg-secondary/5 flex flex-col items-center justify-center text-center rounded-lg"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <History weight="BoldDuotone" size={24} />
                </div>
                <h3 className="font-mono text-lg font-bold uppercase mb-2 text-foreground">No Sessions Yet</h3>
                <p className="font-mono text-sm text-muted-foreground max-w-sm mb-6">
                  Log your first surf session to start tracking conditions.
                </p>
                <Button
                  variant="rogue-secondary"
                  onClick={() => handleOpenModal()}
                  className="font-mono text-xs"
                >
                  <AddCircle weight="Bold" size={12} className="mr-2" />
                  LOG SESSION
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SurfSessionCard
                      session={session}
                      spotName={getSpotName(session.spotId)}
                      onEdit={() => handleOpenModal(session)}
                      onDelete={() => setDeleteSessionId(session.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {hasSpots && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          onClick={() => handleOpenModal()}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center z-30"
        >
          <AddCircle weight="Bold" size={24} />
        </motion.button>
      )}

      {/* Session Modal */}
      <SurfSessionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        spots={userSpots}
        sessionToEdit={editingSession}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={handleDeleteConfirm}
        spotName="this surf session"
      />
    </div>
  );
}

export default SurfLogPage;
