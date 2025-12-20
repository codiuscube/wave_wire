import { useState, useCallback } from "react";
import { Bolt } from '@solar-icons/react';
import { Drawer } from "vaul";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";
import { parseSpotDescription, type ParsedSpot } from "../../services/api/spotAiService";

interface NaturalLanguageSpotInputProps {
  onParsed: (spot: ParsedSpot) => void;
  disabled?: boolean;
}

export function NaturalLanguageSpotInput({
  onParsed,
  disabled = false,
}: NaturalLanguageSpotInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleParse = useCallback(async () => {
    if (!description.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await parseSpotDescription(description);

      if (result.success && result.spot) {
        setSuccess(true);
        onParsed(result.spot);
        // Close drawer after short delay to show success
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1000);
      } else {
        setError(result.error || 'Could not parse the description. Try including a location name.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [description, onParsed, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleParse();
    }
  }, [handleParse]);

  return (
    <Drawer.NestedRoot open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger Card */}
      <Drawer.Trigger className="w-full border rounded-xl overflow-hidden transition-all duration-200 bg-gradient-to-br from-primary/5 via-card to-card border-primary/30 hover:border-primary/50 text-left">
        <div className="w-full flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <Bolt size={18} className="text-primary" />
            </span>
            <div className="text-left">
              <span className="text-sm font-semibold">AI Assistant</span>
              <p className="text-xs text-muted-foreground">
                Describe your spot location in plain English
              </p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-md font-medium bg-primary/10 text-primary">
            Tap to use
          </span>
        </div>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[61] flex flex-col bg-card rounded-t-2xl">
          {/* Drag handle */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 border-b border-border/50">
            <Drawer.Title className="flex items-center gap-3 mb-1">
              <Bolt size={18} className="text-primary" />
              <span className="font-mono text-base tracking-widest text-muted-foreground uppercase">
                AI Assistant
              </span>
            </Drawer.Title>
            <Drawer.Description className="font-mono text-sm text-muted-foreground/60">
              Describe your spot location in plain English
            </Drawer.Description>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Textarea */}
            <div className="space-y-2">
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={`e.g. "Secret reef near Santa Cruz facing southwest"`}
                className="w-full h-32 p-3 rounded-lg border border-border bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                disabled={isLoading || disabled}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Try: beach name, city, country, or "facing west/east"
              </p>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-green-600 dark:text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/20"
                >
                  Location found! Review the details below.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Button */}
            <Button
              type="button"
              onClick={handleParse}
              disabled={!description.trim() || isLoading || disabled}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Finding location...
                </>
              ) : (
                <>
                  <Bolt size={16} className="mr-2" />
                  Magic Fill
                  <span className="ml-2 text-xs opacity-60">(Cmd + Enter)</span>
                </>
              )}
            </Button>
          </div>

          {/* Safe area padding */}
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
}
