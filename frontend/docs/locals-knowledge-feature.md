# Locals Only: Spot-Level Condition Parameters

## Summary

Add "locals knowledge" to surf spots - admin-configurable parameters that define when conditions are **epic** vs **good** for each spot, with human-readable summaries.

**Example output:** `"Best on W-NW swell 4-8ft @ 12s+, light offshore (E-NE winds), mid-tide rising"`

---

## Data Structure

### New Types (add to `frontend/src/types/index.ts`)

```typescript
export type TideState = 'low' | 'mid' | 'high' | 'any';
export type TideDirection = 'rising' | 'falling' | 'slack' | 'any';

export interface SpotConditionTier {
  minHeight: number;              // feet
  maxHeight: number;              // feet
  minPeriod: number;              // seconds
  swellDirections: string[];      // e.g., ['W', 'WNW', 'NW']
  offshoreWindDirections: string[]; // e.g., ['E', 'ENE', 'NE']
  maxWindSpeed: number;           // mph
  optimalTideStates?: TideState[];
  optimalTideDirection?: TideDirection;
}

export interface SpotLocalsKnowledge {
  epic?: SpotConditionTier;       // When it's firing
  good?: SpotConditionTier;       // Generally favorable
  epicSummary?: string;           // Auto-generated or manual
  goodSummary?: string;
  notes?: string;                 // Additional local tips
  verified: boolean;              // Admin-verified vs script-seeded
}
```

### Extend SurfSpot (in `frontend/src/data/surfSpots.ts`)

Add `localsKnowledge?: SpotLocalsKnowledge` to the interface.

---

## Implementation Steps

### Phase 0: TriggersPage UX Update (User)

**Prerequisite:** User will update the TriggersPage UX first. The new components/patterns created there will be reused for the LocalsKnowledge admin UI.

---

### Phase 1: Core Types & Utility

1. **Add types** to `frontend/src/types/index.ts`
   - TideState, TideDirection, SpotConditionTier, SpotLocalsKnowledge

2. **Create summary generator** `frontend/src/utils/conditionSummary.ts`
   - `generateConditionSummary(tier: SpotConditionTier): string`
   - Formats: "Best on W-NW swell 4-8ft @ 12s+, light offshore (E-NE winds), mid-tide rising"

3. **Create constants** `frontend/src/constants/conditions.ts`
   - DIRECTION_OPTIONS (16 compass directions)
   - TIDE_STATE_OPTIONS, TIDE_DIRECTION_OPTIONS

### Phase 2: Admin UI (Reuse TriggersPage Components)

4. **Create `ConditionTierEditor.tsx`** (`frontend/src/components/admin/`)
   - Reuse updated components from TriggersPage
   - Wave height sliders (min/max)
   - Period slider
   - Direction multi-select toggles
   - Wind direction toggles
   - Max wind speed slider
   - Tide checkboxes
   - Live summary preview

5. **Create `LocalsKnowledgeModal.tsx`** (`frontend/src/components/admin/`)
   - Two sections: Epic Conditions / Good Conditions
   - Each uses ConditionTierEditor
   - Notes textarea
   - Preview of generated summaries
   - Save/Cancel

6. **Update `AdminSpotsPage.tsx`**
   - Add "Locals" column to table (shows summary or "Not set")
   - Add edit button that opens LocalsKnowledgeModal
   - Store localsKnowledge in spotOverrides state

### Phase 3: User Display

7. **Create `LocalsKnowledgeDisplay.tsx`** (`frontend/src/components/`)
   - Compact mode: Single line for SpotCard
   - Full mode: Both epic/good summaries

8. **Update `SpotCard.tsx`**
   - Show locals knowledge summary below spot name
   - Style: subtle, doesn't overwhelm main data

### Phase 4: (Optional) Seeding Script

9. **Create `scripts/seedLocalsKnowledge.ts`**
   - Batch update surfSpots.ts with initial data
   - Set verified: false for script-seeded data

---

## Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/types/index.ts` | Add SpotConditionTier, SpotLocalsKnowledge types |
| `frontend/src/data/surfSpots.ts` | Add localsKnowledge field to SurfSpot |
| `frontend/src/pages/AdminSpotsPage.tsx` | Add locals knowledge column + modal trigger |
| `frontend/src/components/SpotCard.tsx` | Display locals summary |

## New Files

| File | Purpose |
|------|---------|
| `frontend/src/utils/conditionSummary.ts` | Generate human-readable summaries |
| `frontend/src/constants/conditions.ts` | Shared direction/tide options |
| `frontend/src/components/admin/ConditionTierEditor.tsx` | Tier editing form |
| `frontend/src/components/admin/LocalsKnowledgeModal.tsx` | Edit modal |
| `frontend/src/components/LocalsKnowledgeDisplay.tsx` | Display component |

---

## Future: Condition Matching

Once locals knowledge exists, can implement:
- `evaluateConditions(spot, buoyData, forecast)` returns 'epic' | 'good' | 'fair' | 'poor'
- Automatic status updates on SpotCard
- Alert triggering based on spot-level parameters
