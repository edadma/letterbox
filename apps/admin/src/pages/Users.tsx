import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface User {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Account {
  domain: string
}

interface CreateUserForm {
  name: string
  mailbox: string
  password: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserForm>()

  useEffect(() => {
    loadAccount()
    loadUsers()
  }, [])

  const loadAccount = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success && data.user) {
        setAccount({ domain: data.user.account.domain })
      }
    } catch (error) {
      console.error('Failed to load account:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (formData: CreateUserForm) => {
    if (!account) {
      setError('Account information not loaded')
      return
    }

    setError('')

    try {
      const email = `${formData.mailbox}@${account.domain}`
      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowModal(false)
        reset()
        loadUsers()
      } else {
        setError(data.message || 'Failed to create user')
      }
    } catch (err) {
      setError('Failed to create user')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Create User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : users.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center py-8 text-base-content/50">No users found</div>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className="badge badge-ghost">{user.role}</span>
                      </td>
                      <td>
                        {user.isActive ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-error">Inactive</span>
                        )}
                      </td>
                      <td className="text-sm text-base-content/60">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && account && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New User</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.name.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Mailbox</span>
                </label>
                <div className="join w-full">
                  <input
                    type="text"
                    placeholder="john"
                    className={`input input-bordered join-item flex-1 ${errors.mailbox ? 'input-error' : ''}`}
                    {...register('mailbox', {
                      required: 'Mailbox is required',
                      pattern: {
                        value: /^[a-zA-Z0-9._-]+$/,
                        message: 'Only letters, numbers, dots, hyphens, and underscores allowed',
                      },
                    })}
                  />
                  <span className="btn join-item no-animation">@{account.domain}</span>
                </div>
                {errors.mailbox && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.mailbox.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                {errors.password && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.password.message}</span>
                  </label>
                )}
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowModal(false)
                    reset()
                    setError('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
