import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface WaveData {
  spotName: string;
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
    parts.push(`Live buoy: ${data.buoy.waveHeight}ft @ ${data.buoy.wavePeriod}s from ${data.buoy.meanWaveDirection}, water ${data.buoy.waterTemp}°F`);
    if (data.buoy.windGust || data.buoy.windSpeed) {
      parts.push(`Wind: ${data.buoy.windGust || data.buoy.windSpeed}kt from ${data.buoy.windDirection || 'unknown'}`);
    }
  }

  if (data.forecast) {
    parts.push(`Forecast primary swell: ${data.forecast.primary.height}ft @ ${data.forecast.primary.period}s from ${data.forecast.primary.direction}`);
    if (data.forecast.secondary.height > 0) {
      parts.push(`Secondary: ${data.forecast.secondary.height}ft @ ${data.forecast.secondary.period}s from ${data.forecast.secondary.direction}`);
    }
    parts.push(`Model wind: ${data.forecast.windSpeed}kt from ${data.forecast.windDirection}, air ${data.forecast.airTemp}°F`);
  }

  if (data.tide) {
    parts.push(`Tide: ${data.tide.currentHeight}ft ${data.tide.currentDirection}, next ${data.tide.nextEventType} ${data.tide.nextEventHeight}ft at ${data.tide.nextEventTime}`);
  }

  const context = parts.join('. ');

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `You are a local surfer giving a quick wave report for ${data.spotName}. Be punchy, brief, and use surfer speak. NO emoji. Keep it under 15 words. Current conditions: ${context}

Examples of good responses:
- "Solid head-high lines. Light offshore. Get out there."
- "Small but clean. Fun for the log."
- "Junky wind chop. Save your gas."
- "Pumping. Double overhead bombs. Know your limits."

Give a one-line assessment:`
        }
      ],
    });

    const summary = (message.content[0] as { type: string; text: string }).text.trim();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ summary });
  } catch (error) {
    console.error('Claude API error:', error);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
}
