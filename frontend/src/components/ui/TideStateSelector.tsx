/**
 * TideStateSelector - A multi-select component for tide states (low, mid, high).
 * Used in LocalsKnowledgeForm to define optimal tide conditions.
 */

import { motion } from "framer-motion";

export type TideState = 'low' | 'mid' | 'high';

interface TideStateSelectorProps {
  value: TideState[];
  onChange: (states: TideState[]) => void;
  className?: string;
}

const TIDE_OPTIONS: { value: TideState; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'mid', label: 'Mid' },
  { value: 'high', label: 'High' },
];

export function TideStateSelector({
  value,
  onChange,
  className = "",
}: TideStateSelectorProps) {
  const toggleState = (state: TideState) => {
    if (value.includes(state)) {
      // Remove state if already selected (but keep at least one if you want)
      const newValue = value.filter(s => s !== state);
      onChange(newValue);
    } else {
      // Add state
      onChange([...value, state]);
    }
  };

  return (
    <div className={`flex bg-muted p-1 rounded-lg gap-1 ${className}`}>
      {TIDE_OPTIONS.map((option) => {
        const isActive = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleState(option.value)}
            className={`flex-1 relative text-sm font-medium py-1.5 px-3 rounded-md transition-colors ${
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
            {isActive && (
              <motion.div
                layoutId={`tideState-${option.value}`}
                className="absolute inset-0 bg-primary rounded-md -z-10 shadow-md"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
