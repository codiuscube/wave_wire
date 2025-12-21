# Resend Domain Setup Guide

To ensure high deliverability and remove "via resend.com" from your emails, you need to verify your domain.

## 1. Add Domain in Resend -- Already complete
1.  Log in to your [Resend Dashboard](https://resend.com/domains).
2.  Click **Add Domain**.
3.  Enter your domain name (`wave-wire.com`).
4.  Select a region (usually `us-east-1`).

## 2. Update DNS Records
See wave-wire.com.txt for the current DNS records. Ensure they are what we need

### Common Records:
-   **DKIM (CNAME)**: `resend._domainkey` -> `resend.resend.com` (or similar)
-   **SPF (TXT)**: `v=spf1 include:resend.com ~all` (Resend might effectively manage this via a return-path CNAME)
-   **DMARC (TXT)**: `_dmarc` -> `v=DMARC1; p=none;` (Recommended to start with `p=none`)

> [!IMPORTANT]
> If you are using **Vercel** for DNS, you can copy the records directly. If using **Cloudflare**, make sure to **turn off the orange cloud (Proxy)** for these specific CNAME records (set them to "DNS Only").

## 3. Verify
1.  Once records are added, go back to Resend and click **Verify DNS Records**.
2.  It may take a few minutes to propagate (up to 24-48h in rare cases).
3.  Once verified, the status will turn **Verified**.

## 4. Update Environment Variables
Ensure your application is configured to send from this domain.
In `scripts/lib/emailer.ts`:
```typescript
const FROM_EMAIL = 'Wave_Wire <alerts@wave-wire.com>';
```

## 5. Warm Up (Optional but Recommended)
For a new domain, try not to send thousands of emails immediately. Start slow if possible, though for transactional alerts it's usually fine.
