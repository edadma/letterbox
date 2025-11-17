import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Account from '#models/account'
import User from '#models/user'
import env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    // Only seed if bootstrap account doesn't exist
    const bootstrapDomain = env.get('BOOTSTRAP_DOMAIN')
    if (!bootstrapDomain) {
      console.log('Skipping account seeder - BOOTSTRAP_DOMAIN not set')
      return
    }

    const existingAccount = await Account.query().where('domain', bootstrapDomain).first()
    if (existingAccount) {
      console.log(`Bootstrap account for domain ${bootstrapDomain} already exists`)
      return
    }

    // Create the bootstrap account (letterbox.to)
    const account = await Account.create({
      name: env.get('BOOTSTRAP_ACCOUNT_NAME') || 'Letterbox',
      domain: bootstrapDomain,
      resendApiKey: env.get('RESEND_API_KEY') || '',
      defaultFromAddress: env.get('MAIL_FROM_ADDRESS') || `noreply@${bootstrapDomain}`,
      defaultFromName: env.get('MAIL_FROM_NAME') || 'Letterbox',
      defaultReplyToAddress: env.get('MAIL_REPLY_TO_ADDRESS') || null,
      defaultReplyToName: env.get('MAIL_REPLY_TO_NAME') || null,
      isActive: true,
    })

    console.log(`Created bootstrap account: ${account.name} (${account.domain})`)

    // Create the initial admin user if credentials provided
    const adminMailbox = env.get('BOOTSTRAP_ADMIN_MAILBOX')
    const adminPassword = env.get('BOOTSTRAP_ADMIN_PASSWORD')
    const adminName = env.get('BOOTSTRAP_ADMIN_NAME') || 'Admin'

    if (adminMailbox && adminPassword) {
      const adminEmail = `${adminMailbox}@${bootstrapDomain}`
      const existingUser = await User.query()
        .where('account_id', account.id)
        .where('email', adminEmail)
        .first()

      if (!existingUser) {
        const user = await User.create({
          accountId: account.id,
          email: adminEmail,
          password: adminPassword,
          name: adminName,
          role: 'admin',
          isActive: true,
        })

        console.log(`Created bootstrap admin user: ${user.email}`)
      }
    } else {
      console.log(
        'Skipping admin user creation - BOOTSTRAP_ADMIN_MAILBOX and/or BOOTSTRAP_ADMIN_PASSWORD not set'
      )
    }

    // Create the sysadmin user if credentials provided
    // Sysadmin is not tied to any account (accountId = null)
    const sysadminEmail = env.get('SYSADMIN_EMAIL')
    const sysadminPassword = env.get('SYSADMIN_PASSWORD')

    if (sysadminEmail && sysadminPassword) {
      const existingSysadmin = await User.query()
        .whereNull('account_id')
        .where('email', sysadminEmail)
        .first()

      if (!existingSysadmin) {
        const sysadmin = await User.create({
          accountId: null,
          email: sysadminEmail,
          password: sysadminPassword,
          name: 'System Admin',
          role: 'sysadmin',
          isActive: true,
        })

        console.log(`Created sysadmin user: ${sysadmin.email}`)
      }
    }
  }
}