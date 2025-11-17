import { useQuery } from '@tanstack/react-query'

export default function Dashboard() {
  // Fetch users list to get count
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to load users')
      return response.json()
    },
  })

  const userCount = usersData?.success ? usersData.users.length : 0

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Users</div>
            <div className="stat-value text-3xl">
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                userCount
              )}
            </div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Active Sessions</div>
            <div className="stat-value text-3xl">-</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">System Status</div>
            <div className="stat-value text-3xl text-success">Online</div>
          </div>
        </div>
      </div>
    </div>
  )
}
