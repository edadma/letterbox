import type { HttpContext } from '@adonisjs/core/http'
import Account from '#models/account'

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

      const formattedAccounts = accounts.map((account) => ({
        id: account.id,
        name: account.name,
        domain: account.domain,
        defaultFromAddress: account.defaultFromAddress,
        defaultFromName: account.defaultFromName,
        defaultReplyToAddress: account.defaultReplyToAddress,
        defaultReplyToName: account.defaultReplyToName,
        isActive: account.isActive,
        createdAt: account.createdAt.toISO(),
        updatedAt: account.updatedAt.toISO(),
      }))

      return response.json({
        success: true,
        accounts: formattedAccounts,
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