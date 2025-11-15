import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import Email from '#models/email'

// Store connected SSE clients with their user info
const clients = new Map<any, { userId: number; accountId: number; role: string }>()

// Listen for email received events
emitter.on('email:received', (emailData) => {
  // Broadcast to connected clients based on their permissions
  const message = JSON.stringify({ type: 'email:received', data: emailData })

  clients.forEach((userInfo, client) => {
    try {
      // Check if this client should receive this email
      const shouldReceive =
        userInfo.role === 'sysadmin' || // Sysadmin sees all
        (userInfo.role === 'admin' && userInfo.accountId === emailData.accountId) || // Admin sees all in their account
        (userInfo.role === 'user' && userInfo.userId === emailData.userId) // User sees only their emails

      if (shouldReceive) {
        client.write(`data: ${message}\n\n`)
      }
    } catch (error) {
      console.error('Error writing to SSE client:', error)
    }
  })
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
    clients.set(response.response, {
      userId: user.id,
      accountId: user.accountId,
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
      clients.delete(response.response)
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
      emails = await Email.query()
        .where('account_id', user.accountId)
        .orderBy('created_at', 'desc')
        .limit(50)
    } else {
      // Regular user sees only their emails
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
    }))

    return response.json({
      success: true,
      emails: formattedEmails,
    })
  }
}
