import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface WaveData {
  spotName: string;
  region?: string;
  buoy?: {
    waveHeight: number;
    wavePeriod: number;
    meanWaveDirection: string;
    waterTemp: number;
    windGust?: number;
    windSpeed?: number;
    windDirection?: string;
  };
  forecast?: {
    primary: {
      height: number;
      period: number;
      direction: string;
    };
    secondary: {
      height: number;
      period: number;
      direction: string;
    };
    windSpeed: number;
    windDirection: string;
    airTemp: number;
  };
  tide?: {
    currentHeight: number;
    currentDirection: string;
    nextEventType: string;
    nextEventHeight: number;
    nextEventTime: string;
  };
}

const SYSTEM_PROMPT = `You are a knowledgeable local surfer who knows the breaks intimately. Your job is to give a quick, actionable wave assessment based on current conditions AND your knowledge of what works at each spot.

## Your Local Knowledge

**San Diego County:**
- Hogans (Black's Beach area): Powerful beach break, needs bigger SW-NW swells to work. Best on medium-high tide. NE/E winds are offshore. Gets heavy - not for beginners. Works best 4ft+.
- Swamis (Encinitas): Classic reef/point break. Handles S-NW swells well, best on SW. Works on all tides but mid is ideal. E/NE offshore. Long paddle, worth it when it's on.
- Cardiff Reef: Mellow reef break, great for all levels. SW swells ideal. Low-mid tide best. E winds offshore.

**Orange County:**
- Trestles (San Onofre): World-class cobblestone point. Best on S-SW swells, 3-8ft range. All tides work, low-mid often best. NE/E offshore. Crowded but perfect waves.
- Huntington Beach: Consistent beach break, picks up any swell. Works all tides. NE offshore. Can be blown out easily. Good for all levels when small.
- Newport Beach (The Wedge): Heavy shore break, needs S swells. Only for experts. Low tide dangerous.

**Texas Gulf Coast:**
- Bob Hall Pier (Corpus Christi): Best break in Texas. Needs SE-E swells from Gulf storms or cold fronts. Works on all tides. NW offshore. Inconsistent - when it's on, drop everything.
- Surfside Beach: Beach break south of Houston. SE swells. Flat most of the time but fun when hurricanes/fronts push swell.

**Hawaii - Kauai:**
- Hanalei Bay: Legendary right point break. Needs N-NW winter swells to light up. Works best 4-12ft. Mid tide ideal. S/SW winds offshore. Can be dangerous when big. One of the best waves in the world when it's on.

## How to Assess

1. Check if the swell direction works for the spot
2. Evaluate if the size is in the optimal range
3. Consider wind - is it offshore, onshore, or cross?
4. Factor in tide - is it favorable?
5. Give honest, actionable advice

## Response Format

Respond in JSON format with two fields:
1. "summary": Your punchy 10-20 word assessment. Use surfer speak but be clear. NO emoji.
2. "localKnowledge": A brief statement of what locals know about this spot that informed your assessment (e.g., "Works best on SW swells with E offshore winds")

If you don't have reliable local knowledge about a specific spot, respond with exactly: NO_SUMMARY

Example responses (as JSON):
{"summary": "Overhead and offshore. Hanalei is firing. Paddle out now.", "localKnowledge": "Needs N-NW winter swells, 4-12ft. S/SW winds offshore."}
{"summary": "Small but clean 2-3ft. Fun longboard session.", "localKnowledge": "Mellow reef, works on SW swells. E winds offshore."}
{"summary": "Junky onshore wind chop. Wait for the evening glass-off.", "localKnowledge": "NE offshore. Gets blown out easily by onshore flow."}
{"summary": "Wrong swell direction. This spot needs SW, getting NW.", "localKnowledge": "Best on S-SW swells in the 3-8ft range."}
{"summary": "Flat. Gulf is sleeping. Check back after the front.", "localKnowledge": "Needs SE-E swells from Gulf storms or cold fronts."}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body as WaveData;

  if (!data.spotName) {
    return res.status(400).json({ error: 'Missing spotName' });
  }

  // Build context from available data
  const parts: string[] = [];

  if (data.buoy) {
    parts.push(`Live buoy reading: ${data.buoy.waveHeight}ft @ ${data.buoy.wavePeriod}s from ${data.buoy.meanWaveDirection}, water temp ${data.buoy.waterTemp}°F`);
    if (data.buoy.windGust || data.buoy.windSpeed) {
      const windSpeed = data.buoy.windGust || data.buoy.windSpeed;
      parts.push(`Buoy wind: ${windSpeed}kt from ${data.buoy.windDirection || 'unknown'}`);
    }
  }

  if (data.forecast) {
    parts.push(`Forecast primary swell: ${data.forecast.primary.height}ft @ ${data.forecast.primary.period}s from ${data.forecast.primary.direction}`);
    if (data.forecast.secondary && data.forecast.secondary.height > 0) {
      parts.push(`Secondary swell: ${data.forecast.secondary.height}ft @ ${data.forecast.secondary.period}s from ${data.forecast.secondary.direction}`);
    }
    parts.push(`Forecast wind: ${data.forecast.windSpeed}kt from ${data.forecast.windDirection}, air temp ${data.forecast.airTemp}°F`);
  }

  if (data.tide) {
    parts.push(`Current tide: ${data.tide.currentHeight}ft and ${data.tide.currentDirection}, next ${data.tide.nextEventType} is ${data.tide.nextEventHeight}ft at ${data.tide.nextEventTime}`);
  }

  const conditions = parts.length > 0 ? parts.join('. ') : 'No current data available.';
  const spotContext = data.region ? `${data.spotName} in ${data.region}` : data.spotName;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Give me a quick wave check for ${spotContext}.\n\nCurrent conditions:\n${conditions}`
        }
      ],
    });

    const responseText = (message.content[0] as { type: string; text: string }).text.trim();

    // If Claude doesn't have local knowledge, return empty
    if (responseText === 'NO_SUMMARY' || responseText.includes('NO_SUMMARY')) {
      return res.status(200).json({ summary: null, localKnowledge: null });
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(responseText);
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({
        summary: parsed.summary || null,
        localKnowledge: parsed.localKnowledge || null
      });
    } catch {
      // Fallback if not valid JSON - use as plain summary
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({ summary: responseText, localKnowledge: null });
    }
  } catch (error) {
    console.error('Claude API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to generate summary', details: errorMessage });
  }
}
