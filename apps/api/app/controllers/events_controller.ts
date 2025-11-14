import type { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'

// Store connected SSE clients
const clients = new Set<any>()

// Store recent emails (in-memory for now)
const recentEmails: any[] = []

// Listen for email received events
emitter.on('email:received', (emailData) => {
  // Store the email
  recentEmails.unshift(emailData)
  if (recentEmails.length > 50) {
    recentEmails.pop()
  }

  // Broadcast to all connected clients
  const message = JSON.stringify({ type: 'email:received', data: emailData })
  clients.forEach((client) => {
    try {
      client.write(`data: ${message}\n\n`)
    } catch (error) {
      console.error('Error writing to SSE client:', error)
    }
  })
})

export default class EventsController {
  /**
   * Server-Sent Events endpoint
   * Clients can connect to receive real-time updates
   */
  async stream({ response }: HttpContext) {
    response.response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    // Add client to set
    clients.add(response.response)

    // Send initial connection message
    response.response.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`)

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
   * Get recent emails
   */
  async getRecentEmails({ response }: HttpContext) {
    return response.json({
      success: true,
      emails: recentEmails,
    })
  }
}
