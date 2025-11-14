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

router.get('/', async () => {
  return {
    name: 'Letterbox API',
    version: '1.0.0',
  }
})

// Server-Sent Events routes
router.get('/events/stream', [EventsController, 'stream'])
router.post('/events/trigger', [EventsController, 'trigger'])
