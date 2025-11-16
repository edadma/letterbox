/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring mail
  |----------------------------------------------------------
  */
  RESEND_API_KEY: Env.schema.string.optional(),
  MAIL_FROM_ADDRESS: Env.schema.string.optional(),
  MAIL_FROM_NAME: Env.schema.string.optional(),
  MAIL_REPLY_TO_ADDRESS: Env.schema.string.optional(),
  MAIL_REPLY_TO_NAME: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for bootstrapping the initial account
  |----------------------------------------------------------
  */
  BOOTSTRAP_DOMAIN: Env.schema.string.optional(),
  BOOTSTRAP_ACCOUNT_NAME: Env.schema.string.optional(),
  BOOTSTRAP_ADMIN_EMAIL: Env.schema.string.optional(),
  BOOTSTRAP_ADMIN_PASSWORD: Env.schema.string.optional(),
  BOOTSTRAP_ADMIN_NAME: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for sysadmin user
  |----------------------------------------------------------
  */
  SYSADMIN_EMAIL: Env.schema.string.optional(),
  SYSADMIN_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Redis (production SSE)
  |----------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string.optional({ format: 'host' }),
  REDIS_PORT: Env.schema.number.optional(),
})
