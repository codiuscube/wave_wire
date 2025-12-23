import { useState } from "react";
import { VerifiedCheck, AltArrowRight, Home, MapPoint, Bolt, Water, Bell } from '@solar-icons/react';
import { Button } from "./Button";
import { Sheet } from "./Sheet";
import { AddressAutocomplete } from "./AddressAutocomplete";
import type { AddressSuggestion } from "../../services/api/addressService";
import { AddSpotContent } from "./AddSpotContent";
import { TriggerForm } from "./TriggerForm";
import { useUserSpots, useProfile } from "../../hooks";
import { useAuth } from "../../contexts/AuthContext";
import { usePushNotification } from "../../contexts/PushNotificationContext";
import { supabase } from "../../lib/supabase";
import { toDbTriggerInsert } from "../../lib/mappers";
import type { TriggerTier } from "../../types";
import type { SpotOption } from "./AddSpotModal";

// Steps definition
type OnboardingStep = "welcome" | "address" | "spot" | "trigger" | "notifications" | "complete";

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Progress bar component
function ProgressBar({ step }: { step: OnboardingStep }) {
    const progress = step === 'welcome' ? 0 :
        step === 'address' ? 20 :
        step === 'spot' ? 40 :
        step === 'trigger' ? 60 :
        step === 'notifications' ? 80 : 100;

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
                     step === 'address' ? 'Step 1 of 4' :
                     step === 'spot' ? 'Step 2 of 4' :
                     step === 'trigger' ? 'Step 3 of 4' :
                     step === 'notifications' ? 'Step 4 of 4' : 'Complete'}
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
    const {
        isSupported: pushSupported,
        isSubscribed: pushSubscribed,
        permissionState: pushPermission,
        isLoading: pushLoading,
        isIosWithoutPwa,
        subscribe: subscribeToPush,
    } = usePushNotification();

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
        if (!insertError) setStep("notifications");
    };

    const handleNotificationsComplete = async (enablePush: boolean) => {
        if (enablePush && !isIosWithoutPwa && pushSupported && pushPermission !== 'denied') {
            setLoading(true);
            await subscribeToPush();
            setLoading(false);
        }
        setStep("complete");
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

            case "notifications":
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 p-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell weight="BoldDuotone" size={24} className="text-primary" />
                            </div>
                            <h3 className="text-xl font-bold uppercase">Stay in the Loop</h3>
                            <p className="text-muted-foreground text-sm">
                                Get instant alerts when conditions are firing at your spots.
                            </p>
                        </div>

                        {isIosWithoutPwa ? (
                            <div className="bg-secondary/50 border border-border rounded-lg p-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    iOS requires the app to be installed to receive push notifications.
                                </p>
                                <ol className="text-sm text-muted-foreground space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="font-mono text-primary font-bold">1.</span>
                                        <span>Tap the <strong className="text-foreground">Share</strong> button in Safari</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="font-mono text-primary font-bold">2.</span>
                                        <span>Scroll and tap <strong className="text-foreground">"Add to Home Screen"</strong></span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="font-mono text-primary font-bold">3.</span>
                                        <span>Open the app and enable push notifications</span>
                                    </li>
                                </ol>
                                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
                                    You can also receive alerts via <strong className="text-foreground">Email</strong> in Account settings.
                                    <span className="text-muted-foreground/60"> SMS coming soon.</span>
                                </p>
                                <Button
                                    onClick={() => handleNotificationsComplete(false)}
                                    className="w-full mt-4"
                                    variant="outline"
                                >
                                    I'll do this later
                                </Button>
                            </div>
                        ) : !pushSupported ? (
                            <div className="bg-secondary/50 border border-border rounded-lg p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Push notifications aren't supported in this browser.
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    You can receive alerts via <strong className="text-foreground">Email</strong> instead.
                                    <span className="text-muted-foreground/60"> SMS coming soon.</span>
                                </p>
                                <Button
                                    onClick={() => handleNotificationsComplete(false)}
                                    className="w-full"
                                >
                                    Continue
                                </Button>
                            </div>
                        ) : pushPermission === 'denied' ? (
                            <div className="bg-secondary/50 border border-border rounded-lg p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Push notifications are blocked in your browser settings.
                                </p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    You can receive alerts via <strong className="text-foreground">Email</strong> instead, or unblock push in your browser.
                                    <span className="text-muted-foreground/60"> SMS coming soon.</span>
                                </p>
                                <Button
                                    onClick={() => handleNotificationsComplete(false)}
                                    className="w-full"
                                >
                                    Continue
                                </Button>
                            </div>
                        ) : pushSubscribed ? (
                            <div className="text-center">
                                <p className="text-sm text-green-500 mb-4">
                                    Push notifications are already enabled!
                                </p>
                                <Button
                                    onClick={() => handleNotificationsComplete(false)}
                                    className="w-full"
                                >
                                    Continue
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Button
                                    onClick={() => handleNotificationsComplete(true)}
                                    disabled={loading || pushLoading}
                                    className="w-full"
                                    variant="rogue"
                                >
                                    {loading || pushLoading ? "Enabling..." : "Enable Push Notifications"}
                                </Button>
                                <Button
                                    onClick={() => handleNotificationsComplete(false)}
                                    variant="ghost"
                                    className="w-full text-muted-foreground"
                                >
                                    Skip for now
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                    You can always enable notifications later in Account settings.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case "complete":
                return (
                    <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 py-12">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <VerifiedCheck weight="BoldDuotone" size={48} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">You're All Set!</h2>
                        <p className="text-muted-foreground">
                            Your home break is configured and ready to go.
                            {pushSubscribed && " We'll notify you when conditions fire."}
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
            fullScreen
        >
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
                <div className="w-full max-w-lg">
                    {renderStep()}
                </div>
            </div>
        </Sheet>
    );
}
