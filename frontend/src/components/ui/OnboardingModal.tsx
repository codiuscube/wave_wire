import { useState } from "react";
import { VerifiedCheck, AltArrowRight, Home, MapPoint, Bolt, Water } from '@solar-icons/react';
import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { AddressAutocomplete } from "./AddressAutocomplete";
import type { AddressSuggestion } from "../../services/api/addressService";
import { AddSpotContent } from "./AddSpotContent";
import { TriggerForm } from "./TriggerForm";
import { useUserSpots, useProfile } from "../../hooks";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { toDbTriggerInsert } from "../../lib/mappers";
import type { TriggerTier } from "../../types";
import type { SpotOption } from "./AddSpotModal";

// Steps definition
type OnboardingStep = "welcome" | "address" | "spot" | "trigger" | "complete";

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Progress bar component
function ProgressBar({ step }: { step: OnboardingStep }) {
    const progress = step === 'welcome' ? 0 :
        step === 'address' ? 25 :
        step === 'spot' ? 50 :
        step === 'trigger' ? 75 : 100;

    return (
        <div className="h-1 bg-secondary w-full">
            <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

// Custom header for onboarding
function OnboardingHeader({ step, onClose }: { step: OnboardingStep; onClose: () => void }) {
    return (
        <div className="shrink-0">
            <ProgressBar step={step} />
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {step === 'welcome' ? 'Welcome' :
                     step === 'address' ? 'Step 1 of 3' :
                     step === 'spot' ? 'Step 2 of 3' :
                     step === 'trigger' ? 'Step 3 of 3' : 'Complete'}
                </span>
                {step !== 'complete' && (
                    <button
                        onClick={onClose}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Skip for now
                    </button>
                )}
            </div>
        </div>
    );
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const { user } = useAuth();
    const { profile, update: updateProfile } = useProfile(user?.id);
    const { addSpot } = useUserSpots(user?.id, profile?.subscriptionTier);

    const [step, setStep] = useState<OnboardingStep>("welcome");
    const [address, setAddress] = useState("");
    const [homeLat, setHomeLat] = useState<number | null>(null);
    const [homeLon, setHomeLon] = useState<number | null>(null);
    const [createdSpotId, setCreatedSpotId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAddressSubmit = async () => {
        if (!address.trim() || !user?.id) return;
        setLoading(true);

        const { error: updateError } = await updateProfile({
            homeAddress: address,
            homeLat: homeLat,
            homeLon: homeLon,
        });

        setLoading(false);
        if (!updateError) setStep("spot");
    };

    const handleSpotAdd = async (spot: SpotOption) => {
        if (!user?.id) return;
        setLoading(true);

        const { data, error: addError } = await addSpot({
            name: spot.name,
            latitude: spot.lat || null,
            longitude: spot.lon || null,
            region: spot.region || null,
            buoyId: spot.buoyId || null,
            icon: spot.icon || null,
            masterSpotId: spot.id,
            hiddenOnDashboard: false,
        });

        setLoading(false);
        if (!addError && data) {
            setCreatedSpotId(data.id);
            setStep("trigger");
        }
    };

    const handleTriggerAdd = async (trigger: TriggerTier) => {
        if (!user?.id || !createdSpotId) return;
        setLoading(true);

        const dbTrigger = toDbTriggerInsert({
            userId: user.id,
            spotId: createdSpotId,
            name: trigger.name,
            emoji: trigger.emoji,
            condition: trigger.condition,
            minHeight: trigger.minHeight,
            maxHeight: trigger.maxHeight,
            minPeriod: trigger.minPeriod,
            maxPeriod: trigger.maxPeriod,
            minWindSpeed: trigger.minWindSpeed,
            maxWindSpeed: trigger.maxWindSpeed,
            minWindDirection: trigger.minWindDirection,
            maxWindDirection: trigger.maxWindDirection,
            minSwellDirection: trigger.minSwellDirection,
            maxSwellDirection: trigger.maxSwellDirection,
            tideType: trigger.tideType,
            minTideHeight: trigger.minTideHeight,
            maxTideHeight: trigger.maxTideHeight,
            messageTemplate: trigger.messageTemplate,
            notificationStyle: trigger.notificationStyle ?? null,
            priority: 1,
        });

        const { error: insertError } = await supabase
            .from("triggers")
            .insert(dbTrigger);

        setLoading(false);
        if (!insertError) setStep("complete");
    };

    const handleComplete = async () => {
        if (!user?.id) return;
        setLoading(true);

        const { error: updateError } = await updateProfile({
            onboardingCompleted: true,
        });

        setLoading(false);
        if (!updateError) onClose();
    };

    const renderStep = () => {
        switch (step) {
            case "welcome":
                return (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Water weight="BoldDuotone" size={40} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Welcome to Home Break</h2>
                        <p className="text-muted-foreground">
                            Let's get you set up to score the best waves. We'll configure your home base, add your favorite spot, and set up your first alert.
                        </p>
                        <Button
                            onClick={() => setStep("address")}
                            className="w-full h-12"
                            variant="rogue"
                        >
                            Get Started <AltArrowRight weight="Bold" size={20} className="ml-2" />
                        </Button>
                    </div>
                );

            case "address":
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Home weight="BoldDuotone" size={24} className="text-primary" />
                            </div>
                            <h3 className="text-xl font-bold uppercase">Where do you live?</h3>
                            <p className="text-muted-foreground text-sm">
                                We use this to calculate drive times to your spots.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Home Address</label>
                                <AddressAutocomplete
                                    value={address}
                                    onChange={setAddress}
                                    onAddressSelect={(suggestion: AddressSuggestion) => {
                                        setHomeLat(suggestion.lat);
                                        setHomeLon(suggestion.lon);
                                    }}
                                    placeholder="Start typing your address..."
                                />
                            </div>
                            <Button
                                onClick={handleAddressSubmit}
                                disabled={!address.trim() || loading}
                                className="w-full"
                            >
                                {loading ? "Saving..." : "Next Step"}
                            </Button>
                        </div>
                    </div>
                );

            case "spot":
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="shrink-0 text-center p-4 pb-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <MapPoint weight="BoldDuotone" size={24} className="text-primary" />
                            </div>
                            <h3 className="text-xl font-bold uppercase">Add your first spot</h3>
                            <p className="text-muted-foreground text-sm">
                                Choose a spot to track.
                            </p>
                        </div>
                        <div className="flex-1 overflow-hidden border-t border-border">
                            <AddSpotContent
                                savedSpots={[]}
                                onAddSpot={handleSpotAdd}
                                className="h-full"
                            />
                        </div>
                    </div>
                );

            case "trigger":
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="shrink-0 text-center p-4 pb-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Bolt weight="BoldDuotone" size={24} className="text-primary" />
                            </div>
                            <h3 className="text-xl font-bold uppercase">Set up an alert</h3>
                            <p className="text-muted-foreground text-sm">
                                Define the conditions that make this spot fire.
                            </p>
                        </div>
                        <div className="flex-1 overflow-hidden border-t border-border bg-card">
                            <TriggerForm
                                spotId={createdSpotId!}
                                onSubmit={handleTriggerAdd}
                                className="h-full"
                            />
                        </div>
                    </div>
                );

            case "complete":
                return (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 py-12">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <VerifiedCheck weight="BoldDuotone" size={48} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">All set!</h2>
                        <p className="text-muted-foreground">
                            Your home break is configured. You'll receive alerts when conditions are all-time.
                        </p>
                        <Button
                            onClick={handleComplete}
                            className="w-full h-12"
                            variant="rogue"
                            disabled={loading}
                        >
                            {loading ? "Finalizing..." : "Enter Dashboard"}
                        </Button>
                    </div>
                );
        }
    };

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            header={<OnboardingHeader step={step} onClose={onClose} />}
            zIndex={100}
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                {renderStep()}
            </div>
        </Sheet>
    );
}
