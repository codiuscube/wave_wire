/**
 * Message Generator
 * Generates alert messages using AI for local/hype styles or template interpolation for custom
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ConditionData } from './evaluator.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface MessageContext {
  spotName: string;
  condition: 'fair' | 'good' | 'epic' | null;
  triggerName: string;
  conditionData: ConditionData;
}

/**
 * Generate an alert message based on notification style
 */
export async function generateMessage(
  style: 'local' | 'hype' | 'custom' | null,
  messageTemplate: string | null,
  context: MessageContext
): Promise<string> {
  // Custom template: interpolate variables
  if (style === 'custom' && messageTemplate) {
    return interpolateTemplate(messageTemplate, context);
  }

  // AI-generated for local or hype styles
  const effectiveStyle = style || 'local';
  return generateAIMessage(effectiveStyle, context);
}

/**
 * Interpolate custom template with condition data
 */
function interpolateTemplate(template: string, context: MessageContext): string {
  const { spotName, condition, triggerName, conditionData } = context;

  const replacements: Record<string, string> = {
    '{{spotName}}': spotName,
    '{{spot}}': spotName,
    '{{condition}}': condition || 'good',
    '{{triggerName}}': triggerName,
    '{{trigger}}': triggerName,
    '{{height}}': `${conditionData.waveHeight}ft`,
    '{{waveHeight}}': `${conditionData.waveHeight}ft`,
    '{{period}}': `${conditionData.wavePeriod}s`,
    '{{wavePeriod}}': `${conditionData.wavePeriod}s`,
    '{{swellDirection}}': `${conditionData.swellDirection}°`,
    '{{direction}}': `${conditionData.swellDirection}°`,
    '{{windSpeed}}': `${conditionData.windSpeed}kts`,
    '{{wind}}': `${conditionData.windSpeed}kts`,
    '{{windDirection}}': conditionData.windDirection,
    '{{tideHeight}}': conditionData.tideHeight ? `${conditionData.tideHeight}ft` : 'N/A',
    '{{tide}}': conditionData.tideHeight ? `${conditionData.tideHeight}ft` : 'N/A',
    '{{tideDirection}}': conditionData.tideDirection || 'N/A',
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

/**
 * Generate AI message using Claude
 */
async function generateAIMessage(
  style: 'local' | 'hype',
  context: MessageContext
): Promise<string> {
  const { spotName, condition, conditionData } = context;

  const styleGuide = style === 'local'
    ? `Write like a chill local surfer giving a quick update. Be casual, brief, no fluff.
       Use simple language. Don't use emojis unless the conditions are truly epic.
       Example tone: "Looking solid out there. 4-5ft, clean, rising tide. Worth checking."`
    : `Write like an excited surf forecaster who's stoked about the conditions.
       Be energetic and enthusiastic. Use 1-2 emojis max.
       Example tone: "It's PUMPING! 🔥 6ft sets rolling through, offshore winds, this is what we've been waiting for!"`;

  const conditionLabel = condition === 'epic' ? 'EPIC' : condition === 'good' ? 'good' : 'decent';

  const prompt = `Generate a short surf alert message for ${spotName}.

${styleGuide}

Current conditions (${conditionLabel}):
- Wave height: ${conditionData.waveHeight}ft
- Wave period: ${conditionData.wavePeriod}s
- Swell direction: ${conditionData.swellDirection}°
- Wind: ${conditionData.windSpeed} knots ${conditionData.windDirection}
${conditionData.tideHeight ? `- Tide: ${conditionData.tideHeight}ft ${conditionData.tideDirection}` : ''}

Requirements:
- Keep it under 2 sentences
- Just the message, no greeting or sign-off
- Be specific about what makes it good right now`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content[0];
    if (textContent.type === 'text') {
      return textContent.text.trim();
    }

    // Fallback if response format is unexpected
    return generateFallbackMessage(context);
  } catch (error) {
    console.error('AI message generation error:', error);
    return generateFallbackMessage(context);
  }
}

/**
 * Generate a simple fallback message if AI fails
 */
function generateFallbackMessage(context: MessageContext): string {
  const { spotName, condition, conditionData } = context;

  const conditionLabel = condition === 'epic' ? 'Epic' : condition === 'good' ? 'Good' : 'Fair';

  return `${conditionLabel} conditions at ${spotName}: ${conditionData.waveHeight}ft @ ${conditionData.wavePeriod}s, wind ${conditionData.windSpeed}kts.`;
}

/**
 * Generate email subject line
 */
export function generateSubject(
  emoji: string | null,
  spotName: string,
  condition: string | null
): string {
  const conditionLabel = condition || 'good';
  const icon = emoji || getConditionEmoji(conditionLabel);

  return `${icon} ${spotName} - ${capitalizeFirst(conditionLabel)} conditions`;
}

function getConditionEmoji(condition: string): string {
  switch (condition.toLowerCase()) {
    case 'epic':
      return '🔥';
    case 'good':
      return '🌊';
    case 'fair':
      return '👍';
    default:
      return '🏄';
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
