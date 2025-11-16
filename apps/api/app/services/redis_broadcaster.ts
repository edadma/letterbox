import { Redis } from 'ioredis'
import env from '#start/env'

// Store connected SSE clients with their user info
const clients = new Map<any, { userId: number; accountId: number; role: string }>()

// Redis pub/sub setup for production
let redisPublisher: Redis | null = null
let redisSubscriber: Redis | null = null

const isProduction = env.get('NODE_ENV') === 'production'

if (isProduction) {
  const redisHost = env.get('REDIS_HOST', '127.0.0.1')
  const redisPort = env.get('REDIS_PORT', 6379)

  redisPublisher = new Redis({
    host: redisHost,
    port: redisPort,
  })

  redisSubscriber = new Redis({
    host: redisHost,
    port: redisPort,
  })

  // Subscribe to email events channel
  redisSubscriber.subscribe('email:received')

  // Handle incoming messages from Redis
  redisSubscriber.on('message', (channel: string, message: string) => {
    if (channel === 'email:received') {
      const emailData = JSON.parse(message)
      broadcastToClients(emailData)
    }
  })
}

/**
 * Broadcast email data to connected SSE clients based on their permissions
 */
function broadcastToClients(emailData: any) {
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
}

/**
 * Broadcast an email event to all connected clients
 * In production: publishes to Redis for multi-instance support
 * In development: broadcasts directly to in-memory clients
 */
export function broadcastEmail(emailData: any) {
  if (isProduction && redisPublisher) {
    // Publish to Redis channel for multi-instance support
    redisPublisher.publish('email:received', JSON.stringify(emailData))
  } else {
    // Direct broadcast to in-memory clients (development)
    broadcastToClients(emailData)
  }
}

/**
 * Add a new SSE client connection
 */
export function addClient(client: any, userInfo: { userId: number; accountId: number; role: string }) {
  clients.set(client, userInfo)
}

/**
 * Remove an SSE client connection
 */
export function removeClient(client: any) {
  clients.delete(client)
}

/**
 * Get the number of connected clients
 */
export function getClientCount() {
  return clients.size
}
