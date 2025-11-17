import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Account from '#models/account'
import vine from '@vinejs/vine'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  /**
   * Register a new account with initial admin user
   */
  async registerAccount({ request, response, auth }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        accountName: vine.string().trim().minLength(2),
        domain: vine.string().trim().minLength(3),
        resendApiKey: vine.string().trim().minLength(10),
        defaultFromAddress: vine.string().email(),
        defaultFromName: vine.string().trim().minLength(2),
        defaultReplyToAddress: vine.string().email().optional(),
        defaultReplyToName: vine.string().trim().optional(),
        name: vine.string().trim().minLength(2),
        email: vine.string().email(),
        password: vine.string().minLength(8),
      })
    )

    try {
      const data = await request.validateUsing(validator)

      // Check if account with this domain already exists
      const existingAccount = await Account.query().where('domain', data.domain).first()
      if (existingAccount) {
        return response.status(409).json({
          success: false,
          message: 'An account with this domain already exists',
        })
      }

      // Create the account
      const account = await Account.create({
        name: data.accountName,
        domain: data.domain,
        resendApiKey: data.resendApiKey,
        defaultFromAddress: data.defaultFromAddress,
        defaultFromName: data.defaultFromName,
        defaultReplyToAddress: data.defaultReplyToAddress,
        defaultReplyToName: data.defaultReplyToName,
        isActive: true,
      })

      // Create the initial admin user
      const user = await User.create({
        accountId: account.id,
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'admin',
        isActive: true,
      })

      // Log the user in
      await auth.use('web').login(user)

      return response.json({
        success: true,
        message: 'Account created successfully',
        account: {
          id: account.id,
          name: account.name,
          domain: account.domain,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      })
    } catch (error) {
      console.error('Registration error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to create account',
        error: error.message,
      })
    }
  }

  /**
   * Register a new user within an existing account
   */
  async registerUser({ request, response, auth }: HttpContext) {
    // Require authentication
    await auth.check()
    const currentUser = auth.user

    if (!currentUser) {
      return response.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
    }

    // Only admins can create users, and they must have an account
    if (currentUser.role !== 'admin' || !currentUser.accountId) {
      return response.status(403).json({
        success: false,
        message: 'Only account admins can create users',
      })
    }

    // In development, allow any password. In production, require minimum 8 characters
    const isDev = env.get('NODE_ENV') === 'development'

    const validator = vine.compile(
      vine.object({
        name: vine.string().trim().minLength(2),
        email: vine.string().regex(/^[^\s@]+@[^\s@]+$/),
        password: isDev ? vine.string().minLength(1) : vine.string().minLength(8),
      })
    )

    try {
      const data = await request.validateUsing(validator)

      // Use the admin's accountId
      const accountId = currentUser.accountId

      // Check if account exists and is active
      const account = await Account.find(accountId)
      if (!account || !account.isActive) {
        return response.status(404).json({
          success: false,
          message: 'Account not found or inactive',
        })
      }

      // Check if user already exists in this account
      const existingUser = await User.query()
        .where('account_id', accountId)
        .where('email', data.email)
        .first()

      if (existingUser) {
        return response.status(409).json({
          success: false,
          message: 'User already exists in this account',
        })
      }

      // Create the user
      const user = await User.create({
        accountId: accountId,
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'user',
        isActive: true,
      })

      return response.json({
        success: true,
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      })
    } catch (error) {
      console.error('User registration error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: error.message,
      })
    }
  }

  /**
   * Login
   */
  async login({ request, response, auth }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        email: vine.string().regex(/^[^\s@]+@[^\s@]+$/),
        password: vine.string(),
      })
    )

    try {
      const { email, password } = await request.validateUsing(validator)

      // Find user by email
      const user = await User.query().where('email', email).first()

      if (!user) {
        return response.status(401).json({
          success: false,
          message: 'Invalid credentials',
        })
      }

      // Sysadmins have no account
      if (user.accountId !== null) {
        await user.load('account')

        // Check if account is active for regular users
        if (!user.account.isActive || !user.isActive) {
          return response.status(403).json({
            success: false,
            message: 'Account is inactive',
          })
        }
      } else {
        // For sysadmins, just check if user is active
        if (!user.isActive) {
          return response.status(403).json({
            success: false,
            message: 'User is inactive',
          })
        }
      }

      // Verify password
      const isPasswordValid = await hash.verify(user.password, password)
      if (!isPasswordValid) {
        return response.status(401).json({
          success: false,
          message: 'Invalid credentials',
        })
      }

      // Log the user in
      await auth.use('web').login(user)

      return response.json({
        success: true,
        message: 'Logged in successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountId: user.accountId,
        },
      })
    } catch (error) {
      console.error('Login error:', error)
      return response.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      })
    }
  }

  /**
   * Logout
   */
  async logout({ response, auth }: HttpContext) {
    try {
      await auth.use('web').logout()
      return response.json({
        success: true,
        message: 'Logged out successfully',
      })
    } catch (error) {
      console.error('Logout error:', error)
      return response.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message,
      })
    }
  }

  /**
   * Get current user
   */
  async me({ response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user

      if (!user) {
        return response.status(401).json({
          success: false,
          message: 'Not authenticated',
        })
      }

      // Sysadmins don't have an account
      if (user.accountId !== null) {
        await user.load('account')

        return response.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            accountId: user.accountId,
            account: {
              id: user.account.id,
              name: user.account.name,
              domain: user.account.domain,
            },
          },
        })
      } else {
        return response.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            accountId: null,
            account: null,
          },
        })
      }
    } catch (error) {
      return response.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
    }
  }
}
