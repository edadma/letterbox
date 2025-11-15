import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('account_id').unsigned().references('id').inTable('accounts').onDelete('CASCADE')
      table.string('email', 255).notNullable()
      table.string('password', 255).notNullable()
      table.string('name', 255).notNullable()
      table.enum('role', ['user', 'admin', 'sysadmin']).defaultTo('user')
      table.boolean('is_active').defaultTo(true)

      table.unique(['account_id', 'email'])
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}