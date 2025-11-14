/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const EventsController = () => import('#controllers/events_controller')
const MailController = () => import('#controllers/mail_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')

router.get('/', async () => {
  return {
    name: 'Letterbox API',
    version: '1.0.0',
  }
})

// Server-Sent Events routes
router.get('/events/stream', [EventsController, 'stream'])
router.get('/events/recent-emails', [EventsController, 'getRecentEmails'])

// Mail routes
router.post('/mail/send', [MailController, 'send'])

// Webhook routes
router.post('/webhooks/inbound-email', [WebhooksController, 'inboundEmail'])
