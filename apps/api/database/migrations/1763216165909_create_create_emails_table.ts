import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'emails'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('account_id').unsigned().references('id').inTable('accounts').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.enum('direction', ['inbound', 'outbound']).notNullable()
      table.string('email_id', 255).nullable()
      table.string('message_id', 255).nullable()
      table.string('from', 255).notNullable()
      table.text('to').notNullable()
      table.text('cc').nullable()
      table.text('bcc').nullable()
      table.string('subject', 500).nullable()
      table.text('html').nullable()
      table.text('text').nullable()
      table.json('attachments').nullable()
      table.json('headers').nullable()

      table.timestamp('email_created_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['account_id', 'direction'])
      table.index(['account_id', 'user_id'])
      table.index('email_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}