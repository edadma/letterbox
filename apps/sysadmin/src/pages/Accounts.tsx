import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'

interface Account {
  id: number
  name: string
  domain: string
  isActive: boolean
  sentCount: number
  receivedCount: number
  createdAt: string
}

export default function Accounts() {
  const navigate = useNavigate()

  // Check authentication
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me')
      if (!response.ok) throw new Error('Not authenticated')
      return response.json()
    },
    retry: false,
  })

  const user = authData?.success && authData.user.role === 'sysadmin' ? authData.user : null

  // Redirect if not sysadmin
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [authLoading, user, navigate])

  // Fetch accounts
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['sysadmin', 'accounts'],
    queryFn: async () => {
      const response = await fetch('/api/sysadmin/accounts')
      if (!response.ok) throw new Error('Failed to load accounts')
      return response.json()
    },
    enabled: !!user,
  })

  const accounts = accountsData?.success ? accountsData.accounts : []

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
    },
    onSuccess: () => {
      navigate('/login')
    },
  })

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Letterbox Sysadmin</a>
          <span className="ml-4 text-sm text-base-content/60">
            {user.name} ({user.email})
          </span>
        </div>
        <div className="flex-none">
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              Accounts
              {accounts.length > 0 && <span className="badge badge-primary">{accounts.length}</span>}
            </h2>

            {accountsLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-base-content/50">No accounts found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Domain</th>
                      <th>Sent</th>
                      <th>Received</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account: Account) => (
                      <tr key={account.id}>
                        <td>{account.id}</td>
                        <td>
                          <div className="font-semibold">{account.name}</div>
                        </td>
                        <td>
                          <span className="badge badge-ghost">{account.domain}</span>
                        </td>
                        <td>{account.sentCount}</td>
                        <td>{account.receivedCount}</td>
                        <td>
                          {account.isActive ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-error">Inactive</span>
                          )}
                        </td>
                        <td className="text-sm text-base-content/60">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
