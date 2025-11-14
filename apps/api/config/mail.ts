import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'resend',

  /**
   * A static address for the "from" property. It will be used
   * unless an explicit from address is set when sending emails.
   */
  from: {
    address: env.get('MAIL_FROM_ADDRESS', 'noreply@letterbox.app'),
    name: env.get('MAIL_FROM_NAME', 'Letterbox'),
  },

  /**
   * A static address for the "reply-to" property. It will be used
   * unless an explicit replyTo address is set when sending emails.
   */
  replyTo: {
    address: env.get('MAIL_REPLY_TO_ADDRESS', 'noreply@letterbox.app'),
    name: env.get('MAIL_REPLY_TO_NAME', 'Letterbox'),
  },

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    resend: transports.resend({
      key: env.get('RESEND_API_KEY') || '',
      baseUrl: 'https://api.resend.com',
    }),
  },
})

export default mailConfig
