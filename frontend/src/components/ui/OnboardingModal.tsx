import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, Home, MapPin, Zap, Waves } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
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

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
    const { user } = useAuth();
    const { profile, update: updateProfile } = useProfile(user?.id);
    const { addSpot } = useUserSpots(user?.id, profile?.subscriptionTier);

    const [step, setStep] = useState<OnboardingStep>("welcome");
    const [address, setAddress] = useState("");
    const [createdSpotId, setCreatedSpotId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Skip if already completed (though parent should handle visibility)
    if (!isOpen) return null;

    const handleAddressSubmit = async () => {
        if (!address.trim() || !user?.id) return;
        setLoading(true);
        setError(null);

        try {
            // Update profile with address
            const { error: updateError } = await updateProfile({
                homeAddress: address,
            });

            if (updateError) throw new Error(updateError);
            setStep("spot");
        } catch (err: any) {
            setError(err.message || "Failed to save address");
        } finally {
            setLoading(false);
        }
    };

    const handleSpotAdd = async (spot: SpotOption) => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);

        try {
            const { data, error: addError } = await addSpot({
                name: spot.name,
                latitude: spot.lat || null,
                longitude: spot.lon || null,
                region: spot.region || null,
                buoyId: spot.buoyId || null,
                icon: spot.icon || null,
                masterSpotId: spot.id,
            });

            if (addError) throw new Error(addError);
            if (data) {
                setCreatedSpotId(data.id);
                setStep("trigger");
            }
        } catch (err: any) {
            setError(err.message || "Failed to create spot");
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerAdd = async (trigger: TriggerTier) => {
        if (!user?.id || !createdSpotId) return;
        setLoading(true);
        setError(null);

        try {
            // Create trigger directly using supabase client (as we don't have a hook for it yet)
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

            if (insertError) throw new Error(insertError.message);

            setStep("complete");
        } catch (err: any) {
            setError(err.message || "Failed to create trigger");
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await updateProfile({
                onboardingCompleted: true,
            });

            if (updateError) throw new Error(updateError);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to complete onboarding");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case "welcome":
                return (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Waves className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Welcome to Home Break</h2>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto">
                            Let's get you set up to score the best waves. We'll configure your home base, add your favorite spot, and set up your first alert.
                        </p>
                        <Button
                            onClick={() => setStep("address")}
                            className="w-full max-w-sm mx-auto h-12 text-lg"
                            variant="rogue"
                        >
                            Get Started <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                );

            case "address":
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Home className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold uppercase">Where do you live?</h3>
                            <p className="text-muted-foreground text-sm">
                                We use this to calculate drive times to your spots.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Home Address</label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g., 123 Surf St, Santa Cruz, CA"
                                    autoFocus
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
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-[600px]">
                        <div className="shrink-0 text-center mb-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <MapPin className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold uppercase">Add your first spot</h3>
                            <p className="text-muted-foreground text-sm">
                                Choose a spot to track.
                            </p>
                        </div>
                        <div className="flex-1 overflow-hidden border border-border rounded-lg">
                            <AddSpotContent
                                savedSpots={[]} // No spots yet
                                onAddSpot={handleSpotAdd}
                                className="h-full"
                            />
                        </div>
                    </div>
                );

            case "trigger":
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-[600px]">
                        <div className="shrink-0 text-center mb-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold uppercase">Set up an alert</h3>
                            <p className="text-muted-foreground text-sm">
                                Define the conditions that make this spot fire.
                            </p>
                        </div>
                        <div className="flex-1 overflow-hidden border border-border rounded-lg bg-card">
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
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-12">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Check className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter"> all set!</h2>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto">
                            Your home break is configured. You'll strictly receive alerts when conditions are all-time.
                        </p>
                        <Button
                            onClick={handleComplete}
                            className="w-full max-w-sm mx-auto h-12 text-lg"
                            variant="rogue"
                            disabled={loading}
                        >
                            {loading ? "Finalizing..." : "Enter Dashboard"}
                        </Button>
                    </div>
                );
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
            <div className="relative z-10 bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Progress Bar */}
                <div className="h-1 bg-secondary w-full">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{
                            width: step === 'welcome' ? '0%' :
                                step === 'address' ? '25%' :
                                    step === 'spot' ? '50%' :
                                        step === 'trigger' ? '75%' : '100%'
                        }}
                    />
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {renderStep()}
                </div>
            </div>
        </div>,
        document.body
    );
}
