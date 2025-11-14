import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

const queryClient = new QueryClient()

interface InboundEmail {
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  email_id?: string
  created_at?: string
  attachments?: any[]
}

function App() {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [receivedEmails, setReceivedEmails] = useState<InboundEmail[]>([])

  // Connect to SSE for real-time email updates
  useEffect(() => {
    const eventSource = new EventSource('/api/events/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'email:received') {
          setReceivedEmails((prev) => [data.data, ...prev])
        }
      } catch (error) {
        console.error('SSE parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
    }

    // Load recent emails on mount
    fetch('/api/events/recent-emails')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.emails) {
          setReceivedEmails(data.emails)
        }
      })
      .catch((error) => console.error('Failed to load recent emails:', error))

    return () => {
      eventSource.close()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, body }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Email sent successfully!')
        setTo('')
        setSubject('')
        setBody('')
      } else {
        console.error('Error response:', data)
        setMessage(`Error: ${data.message || data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setMessage('Failed to send email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-base-200">
        <div className="navbar bg-base-100 shadow-lg">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl">Letterbox</a>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Email Section */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Send Email</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">To Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    className="input input-bordered"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Subject</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Email subject"
                    className="input input-bordered"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Body</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-32"
                    placeholder="Email body..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  ></textarea>
                </div>

                {message && (
                  <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                    <span>{message}</span>
                  </div>
                )}

                <div className="card-actions justify-end">
                  <button
                    type="submit"
                    className={`btn btn-primary ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Received Emails Section */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                Received Emails
                {receivedEmails.length > 0 && (
                  <span className="badge badge-primary">{receivedEmails.length}</span>
                )}
              </h2>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {receivedEmails.length === 0 ? (
                  <div className="text-center py-8 text-base-content/50">
                    No emails received yet. Send an email to any @letterbox.to address!
                  </div>
                ) : (
                  receivedEmails.map((email, index) => (
                    <div key={index} className="border border-base-300 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">From:</span>{' '}
                          <span className="text-base-content/70">{email.from}</span>
                        </div>
                        <div>
                          <span className="font-semibold">To:</span>{' '}
                          <span className="text-base-content/70">{email.to}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Subject:</span>{' '}
                          <span className="text-base-content/70">{email.subject}</span>
                        </div>
                        <div className="divider my-2"></div>
                        <div>
                          <span className="font-semibold">Body:</span>
                          <div className="mt-2 p-3 bg-base-200 rounded text-base-content/70 whitespace-pre-wrap">
                            {email.text || email.html || 'No content'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App
