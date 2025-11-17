import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Account from '#models/account'
import User from '#models/user'

export default class Email extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare accountId: number

  @column()
  declare userId: number | null

  @column()
  declare direction: 'inbound' | 'outbound'

  @column()
  declare emailId: string | null

  @column()
  declare messageId: string | null

  @column()
  declare from: string

  @column()
  declare to: string

  @column()
  declare cc: string | null

  @column()
  declare bcc: string | null

  @column()
  declare subject: string | null

  @column()
  declare html: string | null

  @column()
  declare text: string | null

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare attachments: any[] | null

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare headers: Record<string, any> | null

  @column.dateTime()
  declare emailCreatedAt: DateTime | null

  @column()
  declare deliveryStatus: 'sent' | 'delivered' | 'bounced' | 'failed' | 'delivery_delayed' | null

  @column()
  declare bounceReason: string | null

  @column()
  declare bounceType: 'hard' | 'soft' | 'transient' | null

  @column.dateTime()
  declare deliveredAt: DateTime | null

  @column.dateTime()
  declare bouncedAt: DateTime | null

  @column.dateTime()
  declare failedAt: DateTime | null

  @belongsTo(() => Account)
  declare account: BelongsTo<typeof Account>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}