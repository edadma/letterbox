import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AdminsController {
  /**
   * Get all users in the admin's account
   */
  async getUsers({ response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user

      if (!user || (user.role !== 'admin' && user.role !== 'sysadmin')) {
        return response.status(403).json({
          success: false,
          message: 'Forbidden - admin access required',
        })
      }

      const users = await User.query()
        .where('account_id', user.accountId)
        .where('role', '!=', 'sysadmin')
        .orderBy('created_at', 'desc')

      const formattedUsers = users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISO(),
      }))

      return response.json({
        success: true,
        users: formattedUsers,
      })
    } catch (error) {
      console.error('Get users error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error.message,
      })
    }
  }

  /**
   * Check if a mailbox (email) is available
   */
  async checkMailbox({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user

      if (!user || (user.role !== 'admin' && user.role !== 'sysadmin')) {
        return response.status(403).json({
          success: false,
          message: 'Forbidden - admin access required',
        })
      }

      const { email } = request.only(['email'])

      const existingUser = await User.query().where('email', email).first()

      return response.json({
        success: true,
        available: !existingUser,
      })
    } catch (error) {
      console.error('Check mailbox error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to check mailbox',
        error: error.message,
      })
    }
  }
}
