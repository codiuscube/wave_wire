import { useState, useCallback } from "react";
import { Bolt, CloseCircle } from '@solar-icons/react';
import { Drawer } from 'vaul';
import { Button } from "./Button";
import { parseTriggerCommand } from "../../services/api/aiService";
import type { TriggerTier } from "../../types";

interface NaturalLanguageTriggerInputProps {
  spotName: string;
  spotRegion?: string;
  spotId?: string;
  onParsed: (trigger: Partial<TriggerTier>) => void;
  disabled?: boolean;
}

export function NaturalLanguageTriggerInput({
  spotName,
  spotRegion,
  spotId,
  onParsed,
  disabled = false,
}: NaturalLanguageTriggerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleParse = useCallback(async () => {
    if (!description.trim() || isLoading) return;

    setIsLoading(true);
    setSuccess(false);

    const result = await parseTriggerCommand(description, spotName, spotRegion, spotId);

    if (result.success && result.trigger) {
      setSuccess(true);
      onParsed(result.trigger);
      // Close drawer after short delay to show success
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setDescription('');
      }, 800);
    }

    setIsLoading(false);
  }, [description, spotName, spotRegion, spotId, onParsed, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleParse();
    }
  }, [handleParse]);

  return (
    <Drawer.NestedRoot
      direction="right"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      {/* Trigger Button */}
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 text-left border rounded-xl bg-gradient-to-br from-primary/5 via-card to-card border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
          disabled={disabled}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Bolt size={20} className="text-primary" />
            </span>
            <div className="text-left">
              <span className="text-sm font-semibold">AI Assistant</span>
              <p className="text-xs text-muted-foreground">
                Describe your ideal conditions in plain English
              </p>
            </div>
          </div>
          <Bolt size={16} className="text-primary/50" />
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content
          className="right-0 sm:right-2 top-0 sm:top-2 bottom-0 sm:bottom-2 fixed outline-none flex w-full sm:w-[400px] lg:w-[450px] z-[61]"
          style={{
            '--initial-transform': 'calc(100% + 8px)',
          } as React.CSSProperties}
        >
          <div className="bg-card h-full w-full grow flex flex-col sm:rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
              <Drawer.Title className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-primary animate-pulse" />
                <span className="font-mono text-base tracking-widest text-muted-foreground uppercase">
                  AI Assistant
                </span>
              </Drawer.Title>
              <Drawer.Description className="sr-only">
                Describe your ideal surf conditions and the AI will configure your trigger
              </Drawer.Description>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-secondary/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                <CloseCircle weight="BoldDuotone" size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Instructions */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Describe your conditions</h3>
                <p className="text-sm text-muted-foreground">
                  Tell me what kind of waves you're looking for and I'll set up the trigger for you.
                </p>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`e.g. "Alert me when it's 4-6ft with offshore wind and low tide"`}
                  className="w-full h-32 p-4 rounded-lg border border-border bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/60"
                  disabled={isLoading || disabled}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Try: overhead waves, NW swell, low tide, offshore wind, epic conditions
                </p>
              </div>

              {/* Examples */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Examples</p>
                <div className="space-y-2">
                  {[
                    "3-5ft with long period swell and light winds",
                    "Overhead waves from the northwest, offshore wind",
                    "Epic conditions with glassy water and low tide",
                  ].map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDescription(example)}
                      className="w-full text-left text-sm p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Success message */}
              {success && (
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 p-4 rounded-lg border border-green-500/20 text-center">
                  ✓ Settings applied! Review and adjust below.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-border/50 bg-card">
              <Button
                type="button"
                onClick={handleParse}
                disabled={!description.trim() || isLoading || disabled}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Bolt size={18} className="mr-2" />
                    Magic Fill
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Press Cmd + Enter to submit
              </p>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
}
