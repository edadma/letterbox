# Resend API Technical Reference

Complete reference for Resend email service integration.

## Overview

Resend is an email API service that provides both **sending** (outbound) and **receiving** (inbound) capabilities for transactional emails.

- **Base URL**: `https://api.resend.com`
- **Authentication**: Bearer token via `Authorization: Bearer YOUR_API_KEY`
- **Pricing**: Free tier available, paid plans for scale

## API Keys

### Types of Access

- **Sending Access Only**: Can only send emails (default when creating API key)
- **Full Access**: Can send emails AND retrieve received emails (required for inbound)

⚠️ **Important**: You need **Full Access** API key to use the inbound email retrieval API.

### Configuration

```bash
# Environment variable
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Domain Setup

### DNS Records Required

**For Sending (SPF & DKIM):**
- `TXT` record for SPF verification
- `TXT` record for DKIM (resend._domainkey)
- `TXT` record for DMARC (optional but recommended)

**For Receiving (MX Record):**
- `MX` record pointing to Resend's inbound servers
- Priority: 10
- Value: `inbound-setup.us-east-1...`

### Verified From Addresses

- **Development/Testing**: Use `onboarding@resend.dev` (pre-verified)
- **Production**: Use any address on your verified domain (e.g., `noreply@yourdomain.com`)

## Sending Emails (Outbound)

### Send Email Endpoint

```
POST https://api.resend.com/emails
```

**Request Body:**
```json
{
  "from": "Sender Name <sender@yourdomain.com>",
  "to": ["recipient@example.com"],
  "subject": "Email subject",
  "html": "<p>HTML content</p>",
  "text": "Plain text content"
}
```

**Optional Fields:**
- `cc`: Array of CC recipients
- `bcc`: Array of BCC recipients
- `reply_to`: Reply-to address
- `attachments`: Array of attachment objects

**Response:**
```json
{
  "id": "email_id_here"
}
```

### AdonisJS Integration

```typescript
import mail from '@adonisjs/mail/services/main'

await mail.send((message) => {
  message
    .to(email)
    .subject(subject)
    .html(htmlContent)
})
```

**Configuration** (`config/mail.ts`):
```typescript
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'resend',
  from: {
    address: env.get('MAIL_FROM_ADDRESS'),
    name: env.get('MAIL_FROM_NAME'),
  },
  mailers: {
    resend: transports.resend({
      key: env.get('RESEND_API_KEY') || '',
      baseUrl: 'https://api.resend.com',
    }),
  },
})
```

## Receiving Emails (Inbound)

### How It Works

1. Configure an inbound address (e.g., `support@yourdomain.com`)
2. Set up a webhook endpoint in your application
3. Resend sends webhook when email arrives
4. Fetch full email content using API (body not included in webhook)

### Webhook Payload Structure

**Event Type**: `email.received`

```json
{
  "type": "email.received",
  "created_at": "2025-11-14T23:07:43.000Z",
  "data": {
    "email_id": "uuid-here",
    "message_id": "<message-id@mail.server.com>",
    "from": "sender@example.com",
    "to": ["recipient@yourdomain.com"],
    "cc": [],
    "bcc": [],
    "subject": "Email subject",
    "created_at": "2025-11-14T23:07:57.026Z",
    "attachments": []
  }
}
```

⚠️ **Important**: The webhook does NOT include:
- `html` body
- `text` body
- `headers`
- Attachment content

These must be fetched separately using the Retrieve Received Email API.

### Retrieve Received Email API

```
GET https://api.resend.com/emails/receiving/{email_id}
```

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "id": "email_id",
  "object": "email",
  "created_at": "timestamp",
  "from": "sender@example.com",
  "to": ["recipient@yourdomain.com"],
  "subject": "Subject",
  "html": "<p>HTML body content</p>",
  "text": "Plain text body content",
  "headers": {...},
  "message_id": "<id>",
  "attachments": [...]
}
```

**Example (fetch):**
```typescript
const response = await fetch(
  `https://api.resend.com/emails/receiving/${emailId}`,
  {
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
  }
)

const email = await response.json()
// email.html, email.text now available
```

### Webhook Setup

**In Resend Dashboard:**
1. Go to Webhooks section
2. Add new webhook
3. Enter your endpoint URL (e.g., `https://your-domain.com/webhooks/inbound-email`)
4. Select event: `email.received`
5. Save

**For Local Development:**
Use ngrok to expose localhost:
```bash
ngrok http 3333
# Use the HTTPS URL: https://xxx.ngrok-free.app/webhooks/inbound-email
```

**Webhook Controller Pattern:**
```typescript
async inboundEmail({ request, response }: HttpContext) {
  const payload = request.body()

  if (payload.type === 'email.received' && payload.data) {
    const emailId = payload.data.email_id

    // Fetch full email content
    const res = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}`,
      { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } }
    )

    const fullEmail = await res.json()

    // Now you have: fullEmail.html, fullEmail.text
  }

  return response.json({ success: true })
}
```

## Attachments

### In Webhook Payload

Attachments metadata is included in the webhook:

```json
{
  "attachments": [
    {
      "content_type": "image/png",
      "filename": "screenshot.png"
    }
  ]
}
```

### Retrieve Attachments API

```
GET https://api.resend.com/emails/receiving/{email_id}/attachments
```

**Response:**
```json
{
  "data": [
    {
      "id": "attachment_id",
      "filename": "file.pdf",
      "content_type": "application/pdf",
      "size": 12345,
      "download_url": "https://..."
    }
  ]
}
```

The `download_url` is a temporary URL to download the attachment content.

## Common Patterns

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxx

# Recommended
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=Your App Name
MAIL_REPLY_TO_ADDRESS=support@yourdomain.com
MAIL_REPLY_TO_NAME=Your App Support
```

### Error Handling

**Common Errors:**

- `401 Unauthorized`: Invalid API key
- `401 restricted_api_key`: API key lacks necessary permissions (need Full Access)
- `404 not_found`: Email ID not found (wrong endpoint or email doesn't exist)
- `405 method_not_allowed`: Using wrong HTTP method or endpoint path

**Error Response Format:**
```json
{
  "statusCode": 401,
  "message": "This API key is restricted to only send emails",
  "name": "restricted_api_key"
}
```

## Inbound Email Addresses

### Auto-generated

Resend provides a `.resend.dev` subdomain automatically.

### Custom Domain

Use any address on your verified domain:
- `support@yourdomain.com`
- `hello@yourdomain.com`
- `*@yourdomain.com` (catch-all)

Configure in Resend dashboard under "Receiving" section.

## Testing Strategies

### Development

1. **Sending**: Use `onboarding@resend.dev` as from address
2. **Receiving**: Use ngrok for webhook endpoint
3. **Verify**: Check Resend dashboard for email logs

### Production

1. **Sending**: Use verified domain addresses
2. **Receiving**: Use public HTTPS endpoint for webhooks
3. **Monitor**: Set up webhook retry logic and logging

## Limitations & Best Practices

### Webhook Payload Limits

- Webhooks don't include email body to support serverless environments with limited request sizes
- Always fetch full content via API when needed

### Rate Limits

- Check Resend documentation for current rate limits
- Implement retry logic with exponential backoff

### Email Storage

- Resend stores inbound emails even if webhook is down
- Emails visible in dashboard
- Can be filtered by to, from, subject

### Security

- Verify webhook signatures (if Resend implements this)
- Use HTTPS for webhook endpoints
- Keep API keys secure (never commit to git)
- Use environment variables for configuration

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/emails` | POST | Send outbound email |
| `/emails/{id}` | GET | Retrieve sent email (outbound only) |
| `/emails/receiving/{id}` | GET | Retrieve received email (inbound) |
| `/emails/receiving/{id}/attachments` | GET | Get attachment list with download URLs |

## Resources

- **Main Docs**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference
- **Dashboard**: https://resend.com/dashboard
- **Webhooks**: https://resend.com/webhooks
- **Domain Setup**: https://resend.com/domains
- **Inbound Guide**: https://resend.com/docs/dashboard/receiving/introduction

## Notes

- Launched inbound email feature: November 2025
- Supports webhooks for real-time email receiving
- Provides both email-sending and email-receiving in one service
- Good for transactional emails, notifications, support systems
- Alternative to SendGrid, Mailgun, AWS SES
