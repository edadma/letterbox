import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

interface InboundEmail {
  id: number
  from: string
  to: string
  subject: string
  html?: string
  text?: string
  email_id?: string
  created_at?: string
  attachments?: unknown[]
  direction?: string
}

interface User {
  id: number
  email: string
  name: string
  role: string
  accountId: number
  account: {
    id: number
    name: string
    domain: string
  }
}

interface SendEmailForm {
  to: string
  subject: string
  body: string
}

export default function Mailbox() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [receivedEmails, setReceivedEmails] = useState<InboundEmail[]>([])
  const [authChecked, setAuthChecked] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SendEmailForm>()

  // Check authentication on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user)
          setAuthChecked(true)
        } else {
          navigate('/login')
        }
      })
      .catch(() => {
        navigate('/login')
      })
  }, [navigate])

  // Connect to SSE for real-time email updates
  useEffect(() => {
    if (!authChecked || !user) return

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
  }, [authChecked, user])

  const onSubmit = async (formData: SendEmailForm) => {
    setMessage('')

    try {
      const response = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Email sent successfully!')
        reset()
      } else {
        console.error('Error response:', data)
        setMessage(`Error: ${data.message || data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setMessage('Failed to send email. Please try again.')
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
          <a className="btn btn-ghost text-xl">Letterbox</a>
          <span className="ml-4 text-sm text-base-content/60">
            {user.name} ({user.email}) - {user.account.name}
          </span>
        </div>
        <div className="flex-none">
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Email Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Send Email</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">To</span>
                </label>
                <input
                  type="text"
                  placeholder="recipient@example.com"
                  className={`input input-bordered ${errors.to ? 'input-error' : ''}`}
                  {...register('to', {
                    required: 'Recipient is required',
                    validate: (value) => {
                      // Allow formats: email@domain.com or "Name" <email@domain.com> or Name <email@domain.com>
                      const emailOnly = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
                      const nameAndEmail = /^.+\s*<[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}>$/i

                      if (emailOnly.test(value.trim()) || nameAndEmail.test(value.trim())) {
                        return true
                      }
                      return 'Invalid format. Use: email@domain.com or Name <email@domain.com>'
                    },
                  })}
                />
                {errors.to && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.to.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Subject</span>
                </label>
                <input
                  type="text"
                  placeholder="Email subject"
                  className={`input input-bordered ${errors.subject ? 'input-error' : ''}`}
                  {...register('subject', { required: 'Subject is required' })}
                />
                {errors.subject && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.subject.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Body</span>
                </label>
                <textarea
                  className={`textarea textarea-bordered h-32 ${errors.body ? 'textarea-error' : ''}`}
                  placeholder="Email body..."
                  {...register('body', { required: 'Body is required' })}
                ></textarea>
                {errors.body && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.body.message}</span>
                  </label>
                )}
              </div>

              {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
                  <span>{message}</span>
                </div>
              )}

              <div className="card-actions justify-end">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Received Emails Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">
              My Emails
              {receivedEmails.length > 0 && <span className="badge badge-primary">{receivedEmails.length}</span>}
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {receivedEmails.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  No emails yet. Send an email to {user.email.split('@')[0]}@{user.account.domain}!
                </div>
              ) : (
                receivedEmails.map((email, index) => (
                  <div key={email.id || index} className="border border-base-300 rounded-lg p-4">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {email.direction === 'outbound' && <span className="badge badge-sm">Sent</span>}
                        {email.direction === 'inbound' && <span className="badge badge-sm badge-primary">Received</span>}
                      </div>
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
  )
}
