/**
 * Manual test script for email delivery
 * Run: npx tsx scripts/test-email.ts your-email@example.com
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from frontend directory BEFORE importing emailer
const envPath = resolve(__dirname, '../frontend/.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    process.env[key.trim()] = value.trim();
  }
}

// Dynamic import after env is loaded
const { sendAlertEmail } = await import('./lib/emailer.js');

const testEmail = process.argv[2];

if (!testEmail) {
  console.error('Usage: npx tsx scripts/test-email.ts <your-email>');
  process.exit(1);
}

console.log(`Sending test email to: ${testEmail}`);
console.log(`Using RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

const result = await sendAlertEmail({
  to: testEmail,
  subject: '🌊 Test Alert: Wave_Wire Email Test',
  message: 'This is a test email to verify the Resend integration is working correctly with wave-wire.com domain.',
  spotName: 'Test Spot',
  condition: 'good',
  emoji: '🧪',
});

if (result.success) {
  console.log(`✅ Email sent successfully! Resend ID: ${result.resendId}`);
} else {
  console.error(`❌ Email failed: ${result.error}`);
  process.exit(1);
}
