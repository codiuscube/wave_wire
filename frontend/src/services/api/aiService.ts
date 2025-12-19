import type { TriggerTier } from '../../types';

export interface ParseResult {
  success: boolean;
  trigger?: Partial<TriggerTier>;
  error?: string;
}

/**
 * Primary parser: Call Claude Haiku API to parse natural language trigger description
 */
export async function parseTriggerCommand(
  text: string,
  spotName: string,
  spotRegion?: string
): Promise<ParseResult> {
  try {
    const response = await fetch('/api/parse-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: text.trim(),
        spotName,
        spotRegion,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Too many requests. Please wait a moment.' };
      }
      if (response.status >= 500) {
        // Fall back to keyword parser on server error
        const fallbackResult = parseTriggerKeywords(text);
        if (Object.keys(fallbackResult).length > 0) {
          return { success: true, trigger: fallbackResult };
        }
        return { success: false, error: 'AI service unavailable. Try using specific values.' };
      }
      return { success: false, error: 'Something went wrong. Please try again.' };
    }

    const data = await response.json();

    if (!data.success) {
      // Try fallback parser
      const fallbackResult = parseTriggerKeywords(text);
      if (Object.keys(fallbackResult).length > 0) {
        return { success: true, trigger: fallbackResult };
      }
      return { success: false, error: data.error || 'Could not understand the description.' };
    }

    return data;
  } catch (err) {
    // Network error - try fallback
    const fallbackResult = parseTriggerKeywords(text);
    if (Object.keys(fallbackResult).length > 0) {
      return { success: true, trigger: fallbackResult };
    }

    if (err instanceof TypeError && err.message.includes('fetch')) {
      return { success: false, error: 'Network error. Check your connection.' };
    }
    return { success: false, error: 'Unexpected error. Try again or use manual form.' };
  }
}

/**
 * Fallback parser: Keyword/regex-based parsing for development and offline use
 */
export function parseTriggerKeywords(text: string): Partial<TriggerTier> {
  const result: Partial<TriggerTier> = {};
  const lowerText = text.toLowerCase();

  // Parse condition
  if (/\b(epic|firing|pumping|going off|really good)\b/.test(lowerText)) {
    result.condition = 'epic';
    result.emoji = '🔥';
  } else if (/\b(good|solid|fun|nice|decent)\b/.test(lowerText)) {
    result.condition = 'good';
    result.emoji = '🌊';
  } else if (/\b(fair|ok|okay|mellow|small)\b/.test(lowerText)) {
    result.condition = 'fair';
    result.emoji = '👍';
  }

  // Parse height range: "3-5ft", "3 to 5 ft", "3ft-5ft"
  const heightRangeMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|foot)/);
  if (heightRangeMatch) {
    result.minHeight = parseFloat(heightRangeMatch[1]);
    result.maxHeight = parseFloat(heightRangeMatch[2]);
  }

  // Parse single height: "4ft", "4 feet"
  const singleHeightMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|foot)(?!\s*(?:-|to))/);
  if (singleHeightMatch && !heightRangeMatch) {
    const height = parseFloat(singleHeightMatch[1]);
    result.minHeight = height;
    result.maxHeight = height;
  }

  // Parse height with plus: "4ft+", "4+ ft"
  const heightPlusMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:ft|feet|foot)\s*\+?/);
  if (heightPlusMatch && lowerText.includes('+')) {
    result.minHeight = parseFloat(heightPlusMatch[1]);
    // No maxHeight - means "X and above"
  }

  // Parse descriptive heights
  if (/\b(overhead|head high|over head)\b/.test(lowerText)) {
    result.minHeight = result.minHeight ?? 5;
    result.maxHeight = result.maxHeight ?? 8;
  } else if (/\b(double overhead|doh)\b/.test(lowerText)) {
    result.minHeight = result.minHeight ?? 8;
    result.maxHeight = result.maxHeight ?? 12;
  } else if (/\b(waist high|waist)\b/.test(lowerText)) {
    result.minHeight = result.minHeight ?? 2;
    result.maxHeight = result.maxHeight ?? 3;
  } else if (/\b(chest high|chest)\b/.test(lowerText)) {
    result.minHeight = result.minHeight ?? 3;
    result.maxHeight = result.maxHeight ?? 4;
  } else if (/\b(shoulder high|shoulder)\b/.test(lowerText)) {
    result.minHeight = result.minHeight ?? 4;
    result.maxHeight = result.maxHeight ?? 5;
  }

  // Parse period: "12s", "12 seconds", "12s+"
  const periodMatch = lowerText.match(/(\d+)\s*(?:s|sec|seconds?)\s*(\+)?/);
  if (periodMatch) {
    const period = parseInt(periodMatch[1]);
    if (periodMatch[2] || lowerText.includes('period+')) {
      result.minPeriod = period;
    } else {
      result.minPeriod = period;
      result.maxPeriod = period + 4; // Give some range
    }
  }

  // Parse period descriptors
  if (/\b(long period|ground swell)\b/.test(lowerText)) {
    result.minPeriod = result.minPeriod ?? 12;
  } else if (/\bshort period\b/.test(lowerText)) {
    result.maxPeriod = result.maxPeriod ?? 10;
  }

  // Parse wind conditions
  if (/\b(offshore|clean|glassy)\b/.test(lowerText)) {
    result.maxWindSpeed = result.maxWindSpeed ?? 10;
  } else if (/\b(light wind|light winds)\b/.test(lowerText)) {
    result.maxWindSpeed = result.maxWindSpeed ?? 8;
  } else if (/\b(no wind|calm|windless)\b/.test(lowerText)) {
    result.maxWindSpeed = result.maxWindSpeed ?? 5;
  }

  // Parse swell direction
  const directionMap: Record<string, [number, number]> = {
    'north': [337, 22],
    'n ': [337, 22],
    'northeast': [22, 67],
    'ne ': [22, 67],
    'east': [67, 112],
    'e ': [67, 112],
    'southeast': [112, 157],
    'se ': [112, 157],
    'south': [157, 202],
    's ': [157, 202],
    'southwest': [202, 247],
    'sw ': [202, 247],
    'west': [247, 292],
    'w ': [247, 292],
    'northwest': [292, 337],
    'nw ': [292, 337],
  };

  // Check for swell direction
  for (const [dir, [min, max]] of Object.entries(directionMap)) {
    if (lowerText.includes(dir + ' swell') || lowerText.includes(dir + 'swell') ||
        lowerText.includes('swell from ' + dir) || lowerText.includes('swell from the ' + dir)) {
      result.minSwellDirection = min;
      result.maxSwellDirection = max;
      break;
    }
  }

  // Also check for just direction mentions (e.g., "NW swell")
  const dirAbbrevMatch = lowerText.match(/\b(nw|ne|sw|se|n|s|e|w)\b\s*swell/);
  if (dirAbbrevMatch && !result.minSwellDirection) {
    const dirKey = dirAbbrevMatch[1] + ' ';
    if (directionMap[dirKey]) {
      result.minSwellDirection = directionMap[dirKey][0];
      result.maxSwellDirection = directionMap[dirKey][1];
    }
  }

  // Parse tide
  if (/\b(low tide|low-tide)\b/.test(lowerText)) {
    result.minTideHeight = -3;
    result.maxTideHeight = 1;
  } else if (/\b(mid tide|mid-tide|medium tide)\b/.test(lowerText)) {
    result.minTideHeight = 1;
    result.maxTideHeight = 4;
  } else if (/\b(high tide|high-tide)\b/.test(lowerText)) {
    result.minTideHeight = 4;
    result.maxTideHeight = 8;
  }

  // Parse tide direction
  if (/\b(rising|incoming|coming in)\b/.test(lowerText)) {
    result.tideType = 'rising';
  } else if (/\b(falling|dropping|outgoing|going out)\b/.test(lowerText)) {
    result.tideType = 'falling';
  }

  // Generate a name based on what we found
  const nameParts: string[] = [];

  if (result.minSwellDirection !== undefined) {
    // Convert direction to cardinal
    const midDir = ((result.minSwellDirection || 0) + (result.maxSwellDirection || 0)) / 2;
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(midDir / 45) % 8;
    nameParts.push(cardinals[idx] + ' Swell');
  }

  if (result.minTideHeight !== undefined && result.maxTideHeight !== undefined) {
    if (result.maxTideHeight <= 1) nameParts.push('Low Tide');
    else if (result.minTideHeight >= 4) nameParts.push('High Tide');
    else nameParts.push('Mid Tide');
  }

  if (result.tideType === 'rising') nameParts.push('Rising');
  else if (result.tideType === 'falling') nameParts.push('Falling');

  if (result.maxWindSpeed !== undefined && result.maxWindSpeed <= 10) {
    nameParts.push('Clean');
  }

  if (result.minHeight !== undefined) {
    if (result.minHeight >= 8) nameParts.push('Big');
    else if (result.minHeight >= 5) nameParts.push('Overhead');
    else if (result.minHeight <= 3) nameParts.push('Small');
  }

  if (nameParts.length > 0) {
    result.name = nameParts.slice(0, 3).join(' ');
  }

  return result;
}
