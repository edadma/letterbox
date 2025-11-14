import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import vine from '@vinejs/vine'

export default class MailController {
  /**
   * Send a test email
   */
  async send({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        to: vine.string().email(),
        subject: vine.string().minLength(1),
        body: vine.string().minLength(1),
      })
    )

    try {
      const data = await request.validateUsing(validator)

      await mail.send((message) => {
        message
          .to(data.to)
          .subject(data.subject)
          .html(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Test Email</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                <h2 style="color: #5850ec; margin-top: 0;">Letterbox Test Email</h2>
                <div style="background-color: white; padding: 20px; border-radius: 5px; margin-top: 20px;">
                  ${data.body.replace(/\n/g, '<br>')}
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">
                  Sent from Letterbox
                </p>
              </div>
            </body>
            </html>
          `)
      })

      return response.json({
        success: true,
        message: 'Email sent successfully',
      })
    } catch (error) {
      return response.status(400).json({
        success: false,
        message: 'Failed to send email',
        error: error.message,
      })
    }
  }
}
