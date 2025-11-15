import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 255).notNullable()
      table.string('domain', 255).notNullable().unique()
      table.text('resend_api_key').notNullable()
      table.string('default_from_address', 255).notNullable()
      table.string('default_from_name', 255).notNullable()
      table.string('default_reply_to_address', 255).nullable()
      table.string('default_reply_to_name', 255).nullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}