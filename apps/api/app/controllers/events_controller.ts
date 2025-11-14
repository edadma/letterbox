import type { HttpContext } from '@adonisjs/core/http'

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

    // Send initial connection message
    response.response.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`)

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
      response.response.write(`:heartbeat\n\n`)
    }, 30000)

    // Clean up on connection close
    response.response.on('close', () => {
      clearInterval(heartbeatInterval)
    })
  }

  /**
   * Example endpoint to trigger an event
   * In a real app, this would broadcast to all connected clients
   */
  async trigger({ request, response }: HttpContext) {
    const data = request.only(['message'])

    // In a real implementation, you would broadcast this to all connected SSE clients
    // For now, just acknowledge receipt
    return response.json({
      success: true,
      message: 'Event triggered',
      data,
    })
  }
}
