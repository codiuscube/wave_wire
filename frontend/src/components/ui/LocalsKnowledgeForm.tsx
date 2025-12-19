/**
 * LocalsKnowledgeForm - Form for admins to define optimal conditions for a surf spot.
 */

import { WaveConditionsForm } from "./WaveConditionsForm";
import { Button } from "./Button";
import { DocumentAdd } from "@solar-icons/react";
import type { SpotLocalsKnowledge, SpotConditionTier } from "../../types";

interface LocalsKnowledgeFormProps {
  value: SpotLocalsKnowledge;
  onChange: (knowledge: SpotLocalsKnowledge) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function LocalsKnowledgeForm({
  value,
  onChange,
  onSave,
  isSaving,
}: LocalsKnowledgeFormProps) {
  const handleConditionsChange = (conditions: SpotConditionTier) => {
    onChange({ ...value, conditions });
  };

  return (
    <div className="space-y-6">
      {/* Wave/Wind/Tide Conditions */}
      <WaveConditionsForm
        value={value.conditions ?? {}}
        onChange={handleConditionsChange}
      />

      {/* Summary for AI */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Summary{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="e.g., Best on low to mid incoming tide with clean NW swell. Works best in the 4-6ft range..."
          value={value.summary ?? ""}
          onChange={(e) => onChange({ ...value, summary: e.target.value })}
          className="w-full h-20 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        <p className="text-xs text-muted-foreground">
          Natural language description to help the AI understand local nuances.
        </p>
      </div>

      {/* General Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Notes{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          placeholder="e.g., Crowds can be heavy on weekends. Best to check early morning..."
          value={value.notes ?? ""}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          className="w-full h-20 px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          <DocumentAdd weight="Bold" size={16} className="mr-2" />
          {isSaving ? "Saving..." : "Save Locals Knowledge"}
        </Button>
      </div>
    </div>
  );
}
