import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

export default function RegisterAccount() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    accountName: '',
    domain: '',
    resendApiKey: '',
    defaultFromAddress: '',
    defaultFromName: '',
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/auth/register-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Registration failed')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    registerMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Register New Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="divider">Account Information</div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Account Name</span>
              </label>
              <input
                type="text"
                placeholder="My Company"
                className="input input-bordered"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Domain</span>
              </label>
              <input
                type="text"
                placeholder="mycompany.com"
                className="input input-bordered"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Resend API Key</span>
              </label>
              <input
                type="text"
                placeholder="re_xxxxxxxxxxxxx"
                className="input input-bordered font-mono"
                value={formData.resendApiKey}
                onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Default From Email</span>
                </label>
                <input
                  type="email"
                  placeholder="noreply@mycompany.com"
                  className="input input-bordered"
                  value={formData.defaultFromAddress}
                  onChange={(e) => setFormData({ ...formData, defaultFromAddress: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Default From Name</span>
                </label>
                <input
                  type="text"
                  placeholder="My Company"
                  className="input input-bordered"
                  value={formData.defaultFromName}
                  onChange={(e) => setFormData({ ...formData, defaultFromName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="divider">Admin User</div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Your Name</span>
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="input input-bordered"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Your Email</span>
              </label>
              <input
                type="email"
                placeholder="john@mycompany.com"
                className="input input-bordered"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Min 8 characters"
                className="input input-bordered"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="card-actions justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate('/login')}
                disabled={registerMutation.isPending}
              >
                Already have an account?
              </button>
              <button type="submit" className="btn btn-primary" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
