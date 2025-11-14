import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import env from '#start/env'

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

        // Fetch the full email content from Resend Inbound API
        let emailBody = { html: '', text: 'Email body not available' }

        try {
          // Use the correct endpoint for inbound emails
          const resendResponse = await fetch(
            `https://api.resend.com/emails/receiving/${emailId}`,
            {
              headers: {
                Authorization: `Bearer ${env.get('RESEND_API_KEY')}`,
              },
            }
          )

          if (resendResponse.ok) {
            const fullEmail = await resendResponse.json()
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

        const emailData = {
          from: payload.data.from,
          to: Array.isArray(payload.data.to) ? payload.data.to.join(', ') : payload.data.to,
          subject: payload.data.subject,
          html: emailBody.html,
          text: emailBody.text,
          email_id: payload.data.email_id,
          message_id: payload.data.message_id,
          created_at: payload.data.created_at,
          attachments: payload.data.attachments || [],
          cc: payload.data.cc || [],
          bcc: payload.data.bcc || [],
        }

        // Emit event for real-time updates (SSE)
        emitter.emit('email:received', emailData)

        console.log('Email processed and emitted:', emailData)
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
