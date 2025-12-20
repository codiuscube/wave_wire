export interface ParsedSpot {
  name: string;
  lat: number | null;
  lon: number | null;
  exposure: string;
  locationQuery: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ParseSpotResult {
  success: boolean;
  spot?: ParsedSpot;
  error?: string;
}

/**
 * Parse a natural language spot description using the AI API.
 * Extracts location (geocoded to lat/lon), exposure, and spot name.
 */
export async function parseSpotDescription(description: string): Promise<ParseSpotResult> {
  try {
    const response = await fetch('/api/parse-spot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: description.trim() }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Too many requests. Please wait a moment.' };
      }
      if (response.status >= 500) {
        return { success: false, error: 'AI service unavailable. Please try again.' };
      }
      return { success: false, error: 'Something went wrong. Please try again.' };
    }

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.error || 'Could not understand the description.' };
    }

    return {
      success: true,
      spot: data.spot,
    };
  } catch (error) {
    console.error('Spot parsing error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

/**
 * Simple keyword-based fallback parser for when AI is unavailable.
 * Tries to extract basic exposure from keywords.
 */
export function parseSpotKeywords(text: string): Partial<ParsedSpot> {
  const result: Partial<ParsedSpot> = {};
  const lowerText = text.toLowerCase();

  // Try to extract exposure from keywords
  if (lowerText.includes('california') || lowerText.includes('oregon') || lowerText.includes('washington')) {
    result.exposure = 'pacific-us';
  } else if (lowerText.includes('florida') || lowerText.includes('carolina') || lowerText.includes('new york') || lowerText.includes('jersey')) {
    result.exposure = 'atlantic-us';
  } else if (lowerText.includes('texas') || lowerText.includes('gulf')) {
    result.exposure = 'gulf';
  } else if (lowerText.includes('hawaii') || lowerText.includes('oahu') || lowerText.includes('maui')) {
    if (lowerText.includes('north shore') || lowerText.includes('north')) {
      result.exposure = 'hawaii-north';
    } else {
      result.exposure = 'hawaii-south';
    }
  } else if (lowerText.includes('el salvador') || lowerText.includes('nicaragua') || lowerText.includes('costa rica') || lowerText.includes('mexico')) {
    result.exposure = 'central-pacific';
  } else if (lowerText.includes('caribbean') || lowerText.includes('puerto rico')) {
    result.exposure = 'caribbean';
  } else if (lowerText.includes('portugal') || lowerText.includes('spain') || lowerText.includes('france') || lowerText.includes('ireland')) {
    result.exposure = 'europe-atlantic';
  } else if (lowerText.includes('australia') || lowerText.includes('sydney') || lowerText.includes('gold coast')) {
    if (lowerText.includes('west') || lowerText.includes('perth') || lowerText.includes('margaret')) {
      result.exposure = 'australia-west';
    } else {
      result.exposure = 'australia-east';
    }
  } else if (lowerText.includes('bali') || lowerText.includes('indonesia') || lowerText.includes('mentawai')) {
    result.exposure = 'indonesia';
  } else if (lowerText.includes('pacific') || lowerText.includes('west coast') || lowerText.includes('facing west')) {
    result.exposure = 'pacific-us';
  } else if (lowerText.includes('atlantic') || lowerText.includes('east coast') || lowerText.includes('facing east')) {
    result.exposure = 'atlantic-us';
  }

  return result;
}
