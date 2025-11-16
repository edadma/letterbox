/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const EventsController = () => import('#controllers/events_controller')
const MailController = () => import('#controllers/mail_controller')
const WebhooksController = () => import('#controllers/webhooks_controller')
const SysadminsController = () => import('#controllers/sysadmins_controller')
const AdminsController = () => import('#controllers/admins_controller')

router.get('/', async () => {
  return {
    name: 'Letterbox API',
    version: '1.0.0',
  }
})

// Auth routes (public)
router.post('/auth/register-account', [AuthController, 'registerAccount'])
router.post('/auth/register-user', [AuthController, 'registerUser'])
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/logout', [AuthController, 'logout'])
router.get('/auth/me', [AuthController, 'me']).use(middleware.auth())

// Server-Sent Events routes (protected)
router
  .group(() => {
    router.get('/events/stream', [EventsController, 'stream'])
    router.get('/events/recent-emails', [EventsController, 'getRecentEmails'])
  })
  .use(middleware.auth())

// Mail routes (protected)
router
  .group(() => {
    router.post('/mail/send', [MailController, 'send'])
  })
  .use(middleware.auth())

// Webhook routes (public - called by Resend)
router.post('/webhooks/inbound-email', [WebhooksController, 'inboundEmail'])

// Admin routes (protected - admin only)
router
  .group(() => {
    router.get('/admin/users', [AdminsController, 'getUsers'])
    router.post('/admin/check-mailbox', [AdminsController, 'checkMailbox'])
  })
  .use(middleware.auth())

// Sysadmin routes (protected - sysadmin only)
router
  .group(() => {
    router.get('/sysadmin/accounts', [SysadminsController, 'getAccounts'])
  })
  .use(middleware.auth())
