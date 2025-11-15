import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Email from '#models/email'
import { Resend } from 'resend'

export default class MailController {
  /**
   * Send an email using the authenticated user's account
   */
  async send({ request, response, auth }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        to: vine.string().email(),
        subject: vine.string().minLength(1),
        body: vine.string().minLength(1),
      })
    )

    try {
      // Check authentication
      await auth.check()
      const user = auth.user
      if (!user) {
        return response.status(401).json({
          success: false,
          message: 'Not authenticated',
        })
      }

      // Load user's account
      await user.load('account')
      const account = user.account

      if (!account || !account.isActive) {
        return response.status(403).json({
          success: false,
          message: 'Account is inactive or not found',
        })
      }

      const data = await request.validateUsing(validator)

      // Create Resend client with account's API key
      const resend = new Resend(account.resendApiKey)

      // Prepare HTML template
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <div style="background-color: white; padding: 20px; border-radius: 5px;">
              ${data.body.replace(/\n/g, '<br>')}
            </div>
          </div>
        </body>
        </html>
      `

      // Send email via Resend
      const result = await resend.emails.send({
        from: `${user.name} <${account.defaultFromAddress}>`,
        to: data.to,
        subject: data.subject,
        html: htmlContent,
      })

      // Save sent email to database
      await Email.create({
        accountId: account.id,
        userId: user.id,
        direction: 'outbound',
        emailId: result.data?.id || null,
        messageId: null,
        from: account.defaultFromAddress,
        to: data.to,
        subject: data.subject,
        html: htmlContent,
        text: data.body,
        attachments: null,
        headers: null,
        emailCreatedAt: null,
      })

      return response.json({
        success: true,
        message: 'Email sent successfully',
        id: result.data?.id,
      })
    } catch (error) {
      console.error('Send email error:', error)
      return response.status(400).json({
        success: false,
        message: 'Failed to send email',
        error: error.message,
      })
    }
  }
}
