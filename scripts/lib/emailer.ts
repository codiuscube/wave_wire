/**
 * Email Delivery via Resend
 * Sends alert emails to users
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
const FROM_EMAIL = 'Homebreak <alerts@homebreak.app>';
const FROM_EMAIL_DEV = 'Homebreak <onboarding@resend.dev>'; // For development/testing

export interface EmailContent {
  to: string;
  subject: string;
  message: string;
  spotName: string;
  condition: string;
  emoji?: string;
}

export interface SendResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

/**
 * Send an alert email via Resend
 */
export async function sendAlertEmail(content: EmailContent): Promise<SendResult> {
  const { to, subject, message, spotName, condition, emoji } = content;

  // Use dev email in non-production or if domain not verified
  const from = process.env.NODE_ENV === 'production' ? FROM_EMAIL : FROM_EMAIL_DEV;

  const html = generateEmailHtml({
    message,
    spotName,
    condition,
    emoji,
  });

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: message, // Plain text fallback
    });

    if (result.error) {
      console.error(`Resend error for ${to}:`, result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    console.log(`Email sent to ${to}: ${result.data?.id}`);
    return {
      success: true,
      resendId: result.data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Email send error for ${to}:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHtml(params: {
  message: string;
  spotName: string;
  condition: string;
  emoji?: string;
}): string {
  const { message, spotName, condition, emoji } = params;

  const conditionColor = getConditionColor(condition);
  const icon = emoji || getConditionEmoji(condition);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surf Alert: ${spotName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 500px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${conditionColor} 0%, #1a1a1a 100%); padding: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">${icon}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${spotName}</h1>
              <div style="display: inline-block; background-color: ${conditionColor}; color: #000000; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 8px;">
                ${condition}
              </div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                ${escapeHtml(message)}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                Homebreak Surf Alerts
              </p>
              <p style="margin: 8px 0 0 0; color: #444444; font-size: 11px;">
                You received this because you set up a trigger for ${spotName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function getConditionColor(condition: string): string {
  switch (condition.toLowerCase()) {
    case 'epic':
      return '#ef4444'; // Red
    case 'good':
      return '#22c55e'; // Green
    case 'fair':
      return '#3b82f6'; // Blue
    default:
      return '#6b7280'; // Gray
  }
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

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
