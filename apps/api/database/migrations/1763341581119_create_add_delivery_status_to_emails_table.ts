import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'emails'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Delivery status: sent, delivered, bounced, failed, delivery_delayed
      table.string('delivery_status').nullable().defaultTo('sent')

      // Bounce/failure information
      table.text('bounce_reason').nullable()
      table.string('bounce_type').nullable() // hard, soft, transient

      // Timestamps for delivery events
      table.timestamp('delivered_at').nullable()
      table.timestamp('bounced_at').nullable()
      table.timestamp('failed_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('delivery_status')
      table.dropColumn('bounce_reason')
      table.dropColumn('bounce_type')
      table.dropColumn('delivered_at')
      table.dropColumn('bounced_at')
      table.dropColumn('failed_at')
    })
  }
}