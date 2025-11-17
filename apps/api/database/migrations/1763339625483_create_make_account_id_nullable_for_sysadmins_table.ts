import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop the unique constraint on account_id + email
      table.dropUnique(['account_id', 'email'])

      // Make account_id nullable
      table.integer('account_id').unsigned().nullable().alter()
    })

    // Add a new unique constraint that handles nullable account_id
    // For sysadmins (account_id = null), email must be unique
    // For regular users, account_id + email must be unique
    this.schema.raw(`
      CREATE UNIQUE INDEX users_account_email_unique
      ON users (COALESCE(account_id, -1), email)
    `)
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Drop the custom unique index
      table.dropIndex(['account_id', 'email'], 'users_account_email_unique')

      // Make account_id not nullable again
      table.integer('account_id').unsigned().notNullable().alter()

      // Restore original unique constraint
      table.unique(['account_id', 'email'])
    })
  }
}