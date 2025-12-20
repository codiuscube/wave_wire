import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Photon API for geocoding
const PHOTON_API_BASE = 'https://photon.komoot.io/api/';

interface ParseSpotRequest {
  description: string;
}

interface ParseSpotResponse {
  success: boolean;
  spot?: {
    name: string;
    lat: number | null;
    lon: number | null;
    exposure: string;
    locationQuery: string;
    confidence: 'high' | 'medium' | 'low';
  };
  error?: string;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

// Geocode a location query using Photon API
async function geocodeLocation(query: string): Promise<{ lat: number; lon: number } | null> {
  if (!query || query.trim().length < 2) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: '1',
    });

    const response = await fetch(`${PHOTON_API_BASE}?${params}`);

    if (!response.ok) {
      console.error('Photon API error:', response.status);
      return null;
    }

    const data: PhotonResponse = await response.json();

    if (data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    return {
      lon: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

const SYSTEM_PROMPT = `You are a surf spot parser. Extract location and exposure information from natural language descriptions of surf spots.

## Output Format
Return ONLY valid JSON. No markdown, no explanations. Just the JSON object.

## Available Fields
- name: string (generate a short name for the spot based on the description)
- locationQuery: string (the place name/location to geocode, e.g., "Santa Cruz, California" or "Bondi Beach, Australia")
- exposure: string (one of the exposure values below that best matches the location and any directional hints)
- confidence: "high" | "medium" | "low" (how confident you are in the exposure inference)

## Exposure Values (pick the most appropriate one)
### North America
- "pacific-us" - US Pacific / West Coast (California, Oregon, Washington)
- "atlantic-us" - US Atlantic / East Coast (Florida, Carolinas, New York, New England)
- "gulf" - Gulf of Mexico (Texas, Louisiana, Mississippi, Alabama, Florida Gulf side)
- "hawaii-north" - Hawaii North Shore
- "hawaii-south" - Hawaii South Shore

### Central America & Caribbean
- "central-pacific" - Central America Pacific (Mexico Pacific, El Salvador, Nicaragua, Costa Rica Pacific, Panama Pacific)
- "caribbean" - Caribbean (Puerto Rico, Dominican Republic, Caribbean islands, Costa Rica Caribbean)

### South America
- "south-pacific" - South America Pacific (Peru, Chile, Ecuador)
- "south-atlantic" - South America Atlantic (Brazil, Argentina, Uruguay)

### Europe & Africa
- "europe-atlantic" - Europe Atlantic (Portugal, Spain Atlantic, France, UK, Ireland)
- "europe-med" - Mediterranean (Spain Med, France Med, Italy, Greece)
- "africa-atlantic" - Africa Atlantic (Morocco, Senegal, South Africa Atlantic)
- "indian-ocean" - Indian Ocean (South Africa Indian Ocean side, Mozambique, Madagascar, Maldives, Sri Lanka)

### Asia Pacific
- "asia-pacific" - Asia Pacific (Japan, Philippines, Taiwan)
- "australia-east" - Australia East Coast (Queensland, NSW, Victoria)
- "australia-west" - Australia West Coast (Western Australia)
- "indonesia" - Indonesia (Bali, Mentawais, Sumatra, Java)

### Other
- "unknown" - Use this ONLY if you cannot determine the exposure at all

## Exposure Inference Rules
1. Use the LOCATION to determine the most likely exposure
2. Directional hints override location-based inference:
   - "facing west", "west-facing", "westside" → typically pacific exposures
   - "facing east", "east-facing", "eastside" → typically atlantic exposures
   - "pacific side", "pacific coast" → pacific exposure
   - "atlantic side", "atlantic coast" → atlantic exposure
   - "gulf side" → gulf exposure
3. For well-known surf spots, use your knowledge of where they are
4. If location is ambiguous (e.g., "Florida" could be atlantic or gulf), default to the more common surf side (atlantic for Florida)

## Examples

Input: "Secret reef spot near Santa Cruz facing southwest"
Output: {"name":"Secret Reef","locationQuery":"Santa Cruz, California","exposure":"pacific-us","confidence":"high"}

Input: "Beach break in El Salvador on the pacific coast"
Output: {"name":"El Salvador Beach Break","locationQuery":"El Salvador","exposure":"central-pacific","confidence":"high"}

Input: "My local spot at Bondi Beach"
Output: {"name":"Bondi Local","locationQuery":"Bondi Beach, Sydney, Australia","exposure":"australia-east","confidence":"high"}

Input: "Point break near Uluwatu"
Output: {"name":"Uluwatu Point","locationQuery":"Uluwatu, Bali, Indonesia","exposure":"indonesia","confidence":"high"}

Input: "Fun little wave in Portugal"
Output: {"name":"Portugal Fun Wave","locationQuery":"Portugal","exposure":"europe-atlantic","confidence":"medium"}

Input: "Reef break facing north on Oahu"
Output: {"name":"North Shore Reef","locationQuery":"North Shore, Oahu, Hawaii","exposure":"hawaii-north","confidence":"high"}

Input: "My secret spot somewhere warm"
Output: {"name":"Secret Warm Spot","locationQuery":"","exposure":"unknown","confidence":"low"}`;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { description } = req.body as ParseSpotRequest;

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing description' });
  }

  if (!description.trim()) {
    return res.status(400).json({ success: false, error: 'Description cannot be empty' });
  }

  try {
    // Call Claude to parse the description
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse this surf spot description:\n\n"${description.trim()}"`
        }
      ],
    });

    const responseText = (message.content[0] as { type: string; text: string }).text.trim();

    // Parse JSON response
    let parsed: { name?: string; locationQuery?: string; exposure?: string; confidence?: string };
    try {
      let jsonStr = responseText;

      // Remove markdown code fences if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      // Extract just the JSON object
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      parsed = JSON.parse(jsonStr);
    } catch {
      return res.status(200).json({
        success: false,
        error: 'Could not parse the description. Try including a location name.'
      } as ParseSpotResponse);
    }

    // Geocode the location if we have a locationQuery
    let lat: number | null = null;
    let lon: number | null = null;

    if (parsed.locationQuery && parsed.locationQuery.trim()) {
      const coords = await geocodeLocation(parsed.locationQuery);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    return res.status(200).json({
      success: true,
      spot: {
        name: parsed.name || 'My Spot',
        lat,
        lon,
        exposure: parsed.exposure || 'unknown',
        locationQuery: parsed.locationQuery || '',
        confidence: (parsed.confidence as 'high' | 'medium' | 'low') || 'low',
      }
    } as ParseSpotResponse);

  } catch (error) {
    console.error('Claude API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: 'Failed to process description. Please try again.',
      details: errorMessage
    });
  }
}
