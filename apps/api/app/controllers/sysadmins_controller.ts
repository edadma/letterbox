import type { HttpContext } from '@adonisjs/core/http'
import Account from '#models/account'
import db from '@adonisjs/lucid/services/db'

export default class SysadminsController {
  /**
   * Get all accounts (sysadmin only)
   */
  async getAccounts({ response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user

      if (!user || user.role !== 'sysadmin') {
        return response.status(403).json({
          success: false,
          message: 'Forbidden - sysadmin access required',
        })
      }

      const accounts = await Account.query().orderBy('created_at', 'desc')

      // Get email counts for each account
      const accountsWithCounts = await Promise.all(
        accounts.map(async (account) => {
          const sentCount = await db
            .from('emails')
            .where('account_id', account.id)
            .where('direction', 'outbound')
            .count('* as total')

          const receivedCount = await db
            .from('emails')
            .where('account_id', account.id)
            .where('direction', 'inbound')
            .count('* as total')

          return {
            id: account.id,
            name: account.name,
            domain: account.domain,
            isActive: account.isActive,
            sentCount: Number(sentCount[0].total),
            receivedCount: Number(receivedCount[0].total),
            createdAt: account.createdAt.toISO(),
            updatedAt: account.updatedAt.toISO(),
          }
        })
      )

      return response.json({
        success: true,
        accounts: accountsWithCounts,
      })
    } catch (error) {
      console.error('Get accounts error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to get accounts',
        error: error.message,
      })
    }
  }
}