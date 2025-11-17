import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'

interface LoginForm {
  mailbox: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  // Get domain from env var (for dev) or current URL hostname (for production)
  const domain = import.meta.env.VITE_DEV_DOMAIN || window.location.hostname

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${data.mailbox}@${domain}`,
          password: data.password,
        }),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Login failed')
      }
      if (result.user.role !== 'admin' && result.user.role !== 'sysadmin') {
        throw new Error('Access denied. Admin role required.')
      }
      return result
    },
    onSuccess: () => {
      navigate('/')
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const onSubmit = (formData: LoginForm) => {
    setError('')
    loginMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Admin Login - {domain}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Mailbox</span>
              </label>
              <div className="join w-full">
                <input
                  type="text"
                  placeholder="admin"
                  className={`input input-bordered join-item flex-1 ${errors.mailbox ? 'input-error' : ''}`}
                  {...register('mailbox', {
                    required: 'Mailbox name is required',
                    pattern: {
                      value: /^[a-z0-9._-]+$/i,
                      message: 'Invalid mailbox name (use letters, numbers, dots, dashes, underscores)',
                    },
                  })}
                />
                <span className="join-item btn btn-disabled">@{domain}</span>
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
                {...register('password', { required: 'Password is required' })}
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

            <div className="card-actions justify-end">
              <button type="submit" className="btn btn-primary" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
