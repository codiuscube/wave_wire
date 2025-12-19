/**
 * Utilities for converting between degree ranges and cardinal direction strings.
 * Used by LocalsKnowledge forms to convert between UI (degree ranges) and storage (string arrays).
 */

// Cardinal directions with their center degrees
const DIRECTION_MAP: Record<string, number> = {
  'N': 0,
  'NNE': 22.5,
  'NE': 45,
  'ENE': 67.5,
  'E': 90,
  'ESE': 112.5,
  'SE': 135,
  'SSE': 157.5,
  'S': 180,
  'SSW': 202.5,
  'SW': 225,
  'WSW': 247.5,
  'W': 270,
  'WNW': 292.5,
  'NW': 315,
  'NNW': 337.5,
};

// Ordered array of directions for iteration
const DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/**
 * Convert a degree value to the nearest cardinal direction
 */
export function degreesToCardinal(deg: number): string {
  // Normalize to 0-360
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return DIRECTIONS[index];
}

/**
 * Convert a degree range to an array of cardinal direction strings.
 * Handles wrap-around (e.g., 315° to 45° = NW, NNW, N, NNE, NE)
 */
export function degreeRangeToDirections(min: number, max: number): string[] {
  // If it's the full range, return all directions
  if (min === 0 && max === 360) {
    return [...DIRECTIONS];
  }

  // Normalize inputs
  min = ((min % 360) + 360) % 360;
  max = ((max % 360) + 360) % 360;

  const result: string[] = [];
  const startIndex = Math.round(min / 22.5) % 16;
  const endIndex = Math.round(max / 22.5) % 16;

  // Handle the range
  if (min <= max) {
    // Normal range (e.g., 45° to 135°)
    for (let i = startIndex; i <= endIndex; i++) {
      result.push(DIRECTIONS[i]);
    }
  } else {
    // Wrap-around range (e.g., 315° to 45°)
    // From start to end of array
    for (let i = startIndex; i < 16; i++) {
      result.push(DIRECTIONS[i]);
    }
    // From beginning of array to end index
    for (let i = 0; i <= endIndex; i++) {
      result.push(DIRECTIONS[i]);
    }
  }

  // Remove duplicates while preserving order
  return [...new Set(result)];
}

/**
 * Convert an array of cardinal direction strings to degree bounds.
 * Returns the min and max degrees that encompass all the directions.
 */
export function directionsToDegreeBounds(dirs: string[] | undefined): { min: number; max: number } {
  if (!dirs || dirs.length === 0) {
    return { min: 0, max: 360 };
  }

  // If all directions are present, it's the full range
  if (dirs.length >= 16) {
    return { min: 0, max: 360 };
  }

  // Get degree values for all directions
  const degrees = dirs
    .map(d => DIRECTION_MAP[d.toUpperCase()])
    .filter((d): d is number => d !== undefined)
    .sort((a, b) => a - b);

  if (degrees.length === 0) {
    return { min: 0, max: 360 };
  }

  if (degrees.length === 1) {
    // Single direction - return a 45° window centered on it
    const center = degrees[0];
    return { min: center - 22.5, max: center + 22.5 };
  }

  // Find the largest gap between consecutive directions
  // The range is everything except that gap
  let maxGap = 0;
  let gapEndIndex = 0;

  for (let i = 0; i < degrees.length; i++) {
    const current = degrees[i];
    const next = degrees[(i + 1) % degrees.length];
    const gap = i === degrees.length - 1
      ? (360 - current) + next  // Wrap-around gap
      : next - current;

    if (gap > maxGap) {
      maxGap = gap;
      gapEndIndex = (i + 1) % degrees.length;
    }
  }

  // The range starts after the gap and ends before it
  const min = degrees[gapEndIndex] - 22.5;
  const lastIndex = (gapEndIndex - 1 + degrees.length) % degrees.length;
  const max = degrees[lastIndex] + 22.5;

  return {
    min: ((min % 360) + 360) % 360,
    max: ((max % 360) + 360) % 360
  };
}

/**
 * Format a degree range as a human-readable string.
 * E.g., "NW - NE" or "All Directions"
 */
export function formatDirectionRange(min: number, max: number): string {
  if (min === 0 && max === 360) {
    return 'All Directions';
  }
  const start = degreesToCardinal(min);
  const end = degreesToCardinal(max);
  if (start === end) {
    return start;
  }
  return `${start} - ${end}`;
}
