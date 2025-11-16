import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Account {
  id: number
  name: string
  domain: string
  isActive: boolean
  sentCount: number
  receivedCount: number
  createdAt: string
}

interface User {
  id: number
  email: string
  name: string
  role: string
}

export default function Accounts() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && data.user.role === 'sysadmin') {
          setUser(data.user)
          setAuthChecked(true)
          loadAccounts()
        } else {
          navigate('/login')
        }
      })
      .catch(() => {
        navigate('/login')
      })
  }, [navigate])

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/sysadmin/accounts')
      const data = await response.json()
      if (data.success) {
        setAccounts(data.accounts)
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!authChecked || !user) {
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

            {loading ? (
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
                    {accounts.map((account) => (
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
