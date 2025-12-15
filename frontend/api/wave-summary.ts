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
- Hogans (Black's Beach area): Powerful beach break. BUOY (Torrey Pines 46225): Look for 4-8ft @ 12-18s from SW-NW. TIDE: Medium to high (3-5ft) - low tide closes out. WIND: NE/E offshore. Gets heavy - not for beginners.
- Swamis (Encinitas): Classic reef/point. BUOY (Oceanside 46254): Best when 3-6ft @ 10-16s from SW-W. TIDE: Mid tide ideal (2-4ft) - too low exposes rocks, too high mushes. WIND: E/NE offshore. Long paddle worth it.
- Cardiff Reef: Mellow reef, all levels. BUOY: 2-4ft @ 8-14s from SW works. TIDE: Low to mid (1-3ft) best. WIND: E offshore.

**Orange County:**
- Trestles (San Onofre): World-class cobblestone point. BUOY (San Clemente 46086): Sweet spot 3-6ft @ 10-16s from S-SW. TIDE: Low to mid (1-4ft) often best, all tides work. WIND: NE/E offshore. Crowded but perfect.
- Huntington Beach: Consistent beach break. BUOY (Newport 46253): Picks up anything, best 3-5ft @ 8-14s. TIDE: All tides, mid often cleanest. WIND: NE offshore - gets blown out easily by onshore.
- Newport Beach (The Wedge): Heavy shore break, experts only. Needs S swells. Low tide dangerous.

**Texas Gulf Coast:**
- Bob Hall Pier (Corpus Christi): Best break in Texas. BUOY (42020): Need 3-6ft @ 7-12s from SE-E (Gulf storms/cold fronts). TIDE: All tides work, incoming often best. WIND: NW offshore. Inconsistent - when it's on, drop everything.
- Surfside Beach: Beach break. SE swells needed. Flat most of the time but fun when hurricanes/fronts push swell.

**Hawaii - Kauai:**
- Hanalei Bay: Legendary right point. BUOY (Waimea 51201): Firing when 6-12ft @ 14-20s from N-NW (winter swells). TIDE: Mid tide ideal (1-2ft) - low tide too shallow on reef. WIND: S/SW offshore. Dangerous when big - know your limits.

## How to Assess

1. Compare current BUOY reading to optimal range (size, period, direction)
2. Check current TIDE against what works for this spot
3. Evaluate WIND - is it offshore, onshore, or cross?
4. Give honest, actionable advice based on how conditions match

## Response Format

IMPORTANT: Output ONLY valid JSON. No markdown, no code fences, no extra text. Just the raw JSON object.

Two fields:
- "summary": 10-20 words max. Punchy assessment. Surfer speak. NO emoji.
- "localKnowledge": Format exactly as "Buoy: X-Xft @ X-Xs from DIR. Tide: X-Xft. Wind: DIR offshore."

If you don't know the spot, respond with exactly: NO_SUMMARY

Examples (output exactly like this, no extra text):
{"summary":"Overhead and offshore. Hanalei firing. Go now.","localKnowledge":"Buoy: 6-12ft @ 14-20s from N-NW. Tide: 1-2ft. Wind: S/SW offshore."}
{"summary":"Small but clean. Fun longboard session.","localKnowledge":"Buoy: 2-4ft @ 8-14s from SW. Tide: 1-3ft. Wind: E offshore."}
{"summary":"Period too short for this reef. Wait for longer lines.","localKnowledge":"Buoy: 4-8ft @ 14-18s from SW. Tide: 2-4ft. Wind: NE offshore."}`;

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
      max_tokens: 200,
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

    // Parse JSON response - extract JSON object even if there's extra text
    try {
      let jsonStr = responseText;

      // Remove markdown code fences
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      // Extract just the JSON object (find first { to last })
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(jsonStr);
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
