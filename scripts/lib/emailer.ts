/**
 * Email Delivery via Resend
 * Sends alert emails to users
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
const FROM_EMAIL = 'Wave_Wire <alerts@wave-wire.com>';
const FROM_EMAIL_DEV = 'Wave_Wire <onboarding@resend.dev>'; // For development/testing

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
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #020817; /* Brand Abyss */
            font-family: 'Courier New', Courier, monospace;
            color: #e2e8f0; /* Brand Foam */
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        .card {
            background-color: #020817;
            border: 1px solid #1e293b; /* Muted Border */
            border-radius: 0; /* Brutalist */
            padding: 40px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
        }

        .logo {
            font-size: 24px;
            font-weight: 800;
            color: #fafafa; /* Primary White */
            margin-bottom: 24px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            text-shadow: 0 0 10px rgba(250, 250, 250, 0.3);
        }

        h1 {
            font-size: 20px;
            margin-bottom: 16px;
            color: #fafafa;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border: 1px solid ${conditionColor};
            background-color: #1e293b;
            color: ${conditionColor};
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 24px;
            font-family: monospace;
            box-shadow: 0 0 10px ${conditionColor}40;
        }

        p {
            font-size: 14px;
            line-height: 1.6;
            color: #94a3b8; /* Concrete */
            margin-bottom: 32px;
        }

        .btn {
            display: inline-block;
            background-color: #fafafa; /* Primary White */
            color: #020817; /* Background Dark */
            font-weight: bold;
            text-decoration: none;
            padding: 14px 32px;
            text-transform: uppercase;
            font-family: 'Courier New', Courier, monospace;
            transition: all 0.2s;
            border: 1px solid #fafafa;
            box-shadow: 4px 4px 0px 0px #1e293b; /* Brutalist shadow */
        }

        .btn:hover {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px 0px #1e293b;
        }

        .footer {
            margin-top: 32px;
            font-size: 12px;
            color: #52525b;
            text-align: center;
        }

        .link-url {
            color: #94a3b8;
            text-decoration: underline;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="card">
            <div class="logo">Wave_Wire</div>
            
            <h1>${spotName}</h1>
            
            <div class="badge">
                ${icon} ${condition}
            </div>

            <p>${escapeHtml(message)}</p>

            <a href="https://wave-wire.com" class="btn">View Dashboard</a>
        </div>

        <div class="footer">
            <p>You received this because you set up a trigger for ${spotName}</p>
            <p>Sent from <a href="https://wave-wire.com" class="link-url">wave-wire.com</a></p>
        </div>
    </div>
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
