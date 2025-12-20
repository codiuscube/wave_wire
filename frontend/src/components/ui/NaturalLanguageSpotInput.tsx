import { useState, useCallback } from "react";
import { Bolt, AltArrowDown } from '@solar-icons/react';
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
  const [isExpanded, setIsExpanded] = useState(true);
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
        // Clear success after delay
        setTimeout(() => setSuccess(false), 3000);
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
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'bg-gradient-to-br from-primary/5 via-card to-card border-primary/30' : 'bg-card border-border/50 hover:border-primary/30'}`}>
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 cursor-pointer transition-colors ${isExpanded ? '' : 'hover:bg-muted/30'}`}
        disabled={disabled}
      >
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
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {isExpanded ? 'Expanded' : 'Click to expand'}
          </span>
          <AltArrowDown
            size={16}
            className={`text-muted-foreground transition-transform duration-200 ${!isExpanded ? 'rotate-[-90deg]' : ''}`}
          />
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
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
                  className="w-full h-20 p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                  disabled={isLoading || disabled}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
