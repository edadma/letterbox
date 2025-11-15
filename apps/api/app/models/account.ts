import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Email from '#models/email'

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare domain: string

  @column({ serializeAs: null })
  declare resendApiKey: string

  @column()
  declare defaultFromAddress: string

  @column()
  declare defaultFromName: string

  @column()
  declare defaultReplyToAddress: string | null

  @column()
  declare defaultReplyToName: string | null

  @column()
  declare isActive: boolean

  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @hasMany(() => Email)
  declare emails: HasMany<typeof Email>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}