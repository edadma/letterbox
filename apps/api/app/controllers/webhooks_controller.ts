import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import Account from '#models/account'
import Email from '#models/email'
import { DateTime } from 'luxon'

export default class WebhooksController {
  /**
   * Handle incoming email webhook from Resend
   * Payload structure:
   * {
   *   "type": "email.received",
   *   "created_at": "2024-02-22T23:41:12.126Z",
   *   "data": {
   *     "email_id": "...",
   *     "created_at": "...",
   *     "from": "email@domain.com",
   *     "to": ["recipient@domain.com"],
   *     "subject": "Subject",
   *     "message_id": "...",
   *     "attachments": [...],
   *     "bcc": [],
   *     "cc": []
   *   }
   * }
   * Note: html/text content is NOT included in webhook, must fetch separately
   */
  async inboundEmail({ request, response }: HttpContext) {
    try {
      const payload = request.body()

      console.log('Received inbound email webhook:', JSON.stringify(payload, null, 2))

      // Extract the email data from the webhook payload
      if (payload.type === 'email.received' && payload.data) {
        const emailId = payload.data.email_id

        // Extract the domain from the "to" address to find the account
        const toAddresses = Array.isArray(payload.data.to) ? payload.data.to : [payload.data.to]
        const primaryTo = toAddresses[0]
        const domain = primaryTo.split('@')[1]

        // Find the account by domain
        const account = await Account.query().where('domain', domain).first()

        if (!account) {
          console.error(`No account found for domain: ${domain}`)
          return response.status(404).json({
            success: false,
            message: `No account configured for domain: ${domain}`,
          })
        }

        // Fetch the full email content from Resend Inbound API
        let emailBody = { html: '', text: 'Email body not available' }

        try {
          // Use the correct endpoint for inbound emails with account's API key
          const resendResponse = await fetch(
            `https://api.resend.com/emails/receiving/${emailId}`,
            {
              headers: {
                Authorization: `Bearer ${account.resendApiKey}`,
              },
            }
          )

          if (resendResponse.ok) {
            const fullEmail = (await resendResponse.json()) as {
              html?: string
              text?: string
            }
            console.log('Fetched inbound email:', fullEmail)
            emailBody = {
              html: fullEmail.html || '',
              text: fullEmail.text || fullEmail.html || 'No content',
            }
          } else {
            console.error('Failed to fetch email content from Resend:', await resendResponse.text())
          }
        } catch (fetchError) {
          console.error('Error fetching email content:', fetchError)
        }

        // Extract the user email from the "to" address (before @domain)
        const userEmail = primaryTo.split('@')[0]

        // Find the user if they exist in this account
        const user = await account
          .related('users')
          .query()
          .where('email', 'like', `${userEmail}%`)
          .first()

        // Save email to database
        const email = await Email.create({
          accountId: account.id,
          userId: user?.id || null,
          direction: 'inbound',
          emailId: payload.data.email_id,
          messageId: payload.data.message_id,
          from: payload.data.from,
          to: toAddresses.join(', '),
          cc: payload.data.cc ? payload.data.cc.join(', ') : null,
          bcc: payload.data.bcc ? payload.data.bcc.join(', ') : null,
          subject: payload.data.subject,
          html: emailBody.html,
          text: emailBody.text,
          attachments: payload.data.attachments || null,
          headers: null,
          emailCreatedAt: DateTime.fromISO(payload.data.created_at),
        })

        const emailData = {
          id: email.id,
          from: email.from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          email_id: email.emailId,
          message_id: email.messageId,
          created_at: email.emailCreatedAt?.toISO(),
          attachments: email.attachments || [],
          cc: email.cc?.split(', ') || [],
          bcc: email.bcc?.split(', ') || [],
          accountId: email.accountId,
          userId: email.userId,
        }

        // Emit event for real-time updates (SSE)
        emitter.emit('email:received', emailData)

        console.log('Email saved and emitted:', emailData)
      }

      return response.json({
        success: true,
        message: 'Webhook received',
      })
    } catch (error) {
      console.error('Webhook error:', error)
      return response.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        error: error.message,
      })
    }
  }
}
