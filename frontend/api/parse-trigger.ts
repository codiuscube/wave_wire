import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ParseTriggerRequest {
  description: string;
  spotName: string;
  spotRegion?: string;
}

const SYSTEM_PROMPT = `You are a surf conditions parser for a surf alert app. Your job is to extract trigger parameters from natural language descriptions.

## Output Format
Return ONLY valid JSON. No markdown, no explanations. Just the JSON object.

## Available Parameters
- name: string (generate a short descriptive name if not provided, e.g. "NW Swell Low Tide")
- emoji: string (pick an appropriate emoji: "🔥" for epic, "🌊" for good, "👍" for fair, or match the vibe)
- condition: "epic" | "good" | "fair" (interpret quality words: "really good"/"firing"/"epic" → epic, "good"/"solid"/"fun" → good, "ok"/"decent"/"fair" → fair)
- minHeight: number (feet, 0-15)
- maxHeight: number (feet, 0-15)
- minPeriod: number (seconds, 0-20)
- maxPeriod: number (seconds, 0-20)
- minSwellDirection: number (degrees 0-360)
- maxSwellDirection: number (degrees 0-360)
- minWindSpeed: number (mph, 0-20)
- maxWindSpeed: number (mph, 0-20)
- minWindDirection: number (degrees 0-360)
- maxWindDirection: number (degrees 0-360)
- tideType: "rising" | "falling" | "any"
- minTideHeight: number (feet, -3 to 8)
- maxTideHeight: number (feet, -3 to 8)

## Direction Mapping
- N/North: 0° (range: 337.5-22.5, use min:337, max:22 or min:0, max:45)
- NE/Northeast: 45° (range: 22.5-67.5)
- E/East: 90° (range: 67.5-112.5)
- SE/Southeast: 135° (range: 112.5-157.5)
- S/South: 180° (range: 157.5-202.5)
- SW/Southwest: 225° (range: 202.5-247.5)
- W/West: 270° (range: 247.5-292.5)
- NW/Northwest: 315° (range: 292.5-337.5)

For direction ranges, add ±22.5° window. E.g., "northwest swell" → minSwellDirection: 292, maxSwellDirection: 338

## Tide Mapping
- "low tide" → minTideHeight: -3, maxTideHeight: 1
- "mid tide" → minTideHeight: 1, maxTideHeight: 4
- "high tide" → minTideHeight: 4, maxTideHeight: 8
- "rising"/"incoming" → tideType: "rising"
- "falling"/"dropping"/"outgoing" → tideType: "falling"

## Height Mapping
- "overhead" → minHeight: 5, maxHeight: 8
- "head high" → minHeight: 4, maxHeight: 6
- "waist high" → minHeight: 2, maxHeight: 3
- "double overhead" → minHeight: 8, maxHeight: 12
- "X+" or "Xft+" → minHeight: X (no maxHeight)

## Period Hints
- "long period" → minPeriod: 12
- "short period" → maxPeriod: 10
- "ground swell" → minPeriod: 14

## Wind Hints
- "offshore"/"clean"/"glassy" → maxWindSpeed: 10
- "light wind" → maxWindSpeed: 8
- "no wind" → maxWindSpeed: 5

## Rules
1. ONLY include fields you can confidently extract from the description
2. If unsure about a value, DO NOT include it (the app will use smart defaults)
3. For partial direction mentions like "NW swell", create a reasonable range
4. Generate a creative but descriptive trigger name based on the key conditions mentioned
5. Always include condition if quality is mentioned (firing, good, epic, etc.)

## Examples

Input: "Ponto is really good at low tide in northwest swell"
Output: {"name":"NW Swell Low Tide","emoji":"🔥","condition":"epic","minSwellDirection":292,"maxSwellDirection":338,"minTideHeight":-3,"maxTideHeight":1}

Input: "overhead waves with long period and offshore wind"
Output: {"name":"Overhead Clean Conditions","emoji":"🌊","condition":"good","minHeight":5,"maxHeight":8,"minPeriod":12,"maxWindSpeed":10}

Input: "small fun waves under 4ft for longboarding"
Output: {"name":"Longboard Fun","emoji":"🏄","condition":"fair","minHeight":1,"maxHeight":4}

Input: "epic conditions when it's 6-8ft at 14 seconds from the south"
Output: {"name":"South Swell Epic","emoji":"🔥","condition":"epic","minHeight":6,"maxHeight":8,"minPeriod":14,"minSwellDirection":157,"maxSwellDirection":202}

Input: "4-6ft with offshore wind"
Output: {"name":"Clean Mid-Size","emoji":"🌊","minHeight":4,"maxHeight":6,"maxWindSpeed":10}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { description, spotName, spotRegion } = req.body as ParseTriggerRequest;

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing description' });
  }

  if (!description.trim()) {
    return res.status(400).json({ success: false, error: 'Description cannot be empty' });
  }

  // Build context
  const spotContext = spotRegion
    ? `${spotName} in ${spotRegion}`
    : spotName || 'a surf spot';

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse this trigger description for ${spotContext}:\n\n"${description.trim()}"`
        }
      ],
    });

    const responseText = (message.content[0] as { type: string; text: string }).text.trim();

    // Parse JSON response
    try {
      let jsonStr = responseText;

      // Remove markdown code fences if present
      jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      // Extract just the JSON object (find first { to last })
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(jsonStr);

      // Validate that we got at least something useful
      if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
        return res.status(200).json({
          success: false,
          error: 'Could not extract any conditions. Try being more specific about wave height, direction, or tide.'
        });
      }

      return res.status(200).json({
        success: true,
        trigger: parsed
      });
    } catch {
      return res.status(200).json({
        success: false,
        error: 'Could not parse the description. Try being more specific about conditions like height, period, or wind.'
      });
    }
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
