import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import Email from '#models/email'
import {
  broadcastEmail,
  broadcastEmailStatus,
  addClient,
  removeClient,
} from '#services/redis_broadcaster'

// Listen for email received events
emitter.on('email:received', (emailData) => {
  // Broadcast using Redis in production, in-memory in development
  broadcastEmail(emailData)
})

// Listen for email status update events
// @ts-ignore - Custom event for email status updates
emitter.on('email:status_updated', (statusData) => {
  // Broadcast using Redis in production, in-memory in development
  broadcastEmailStatus(statusData)
})

export default class EventsController {
  /**
   * Server-Sent Events endpoint
   * Clients can connect to receive real-time updates for emails they have access to
   */
  async stream({ response, auth }: HttpContext) {
    // Check authentication
    await auth.check()
    const user = auth.user
    if (!user) {
      return response.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
    }

    response.response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // Add client with user info
    addClient(response.response, {
      userId: user.id,
      accountId: user.accountId ?? 0, // 0 for sysadmins
      role: user.role,
    })

    // Send initial connection message
    response.response.write(
      `data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`
    )

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
      response.response.write(`:heartbeat\n\n`)
    }, 30000)

    // Clean up on connection close
    response.response.on('close', () => {
      clearInterval(heartbeatInterval)
      removeClient(response.response)
    })
  }

  /**
   * Get recent emails for the authenticated user
   */
  async getRecentEmails({ response, auth }: HttpContext) {
    // Check authentication
    await auth.check()
    const user = auth.user
    if (!user) {
      return response.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
    }

    let emails

    if (user.role === 'sysadmin') {
      // Sysadmin sees all emails
      emails = await Email.query().orderBy('created_at', 'desc').limit(50)
    } else if (user.role === 'admin') {
      // Admin sees all emails in their account
      if (!user.accountId) {
        return response.status(403).json({
          success: false,
          message: 'Invalid account',
        })
      }
      emails = await Email.query()
        .where('account_id', user.accountId)
        .orderBy('created_at', 'desc')
        .limit(50)
    } else {
      // Regular user sees only their emails
      if (!user.accountId) {
        return response.status(403).json({
          success: false,
          message: 'Invalid account',
        })
      }
      emails = await Email.query()
        .where('account_id', user.accountId)
        .where('user_id', user.id)
        .orderBy('created_at', 'desc')
        .limit(50)
    }

    // Transform emails to match the format expected by frontend
    const formattedEmails = emails.map((email) => ({
      id: email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      email_id: email.emailId,
      message_id: email.messageId,
      created_at: email.emailCreatedAt?.toISO() || email.createdAt.toISO(),
      attachments: email.attachments || [],
      cc: email.cc?.split(', ') || [],
      bcc: email.bcc?.split(', ') || [],
      accountId: email.accountId,
      userId: email.userId,
      direction: email.direction,
      deliveryStatus: email.deliveryStatus,
      bounceReason: email.bounceReason,
      bounceType: email.bounceType,
    }))

    return response.json({
      success: true,
      emails: formattedEmails,
    })
  }
}
