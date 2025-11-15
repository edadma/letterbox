declare module '@adonisjs/core/types' {
  interface EventsList {
    'email:received': {
      id: number
      from: string
      to: string
      subject: string | null
      html: string | null
      text: string | null
      email_id: string | null
      message_id: string | null
      created_at: string | null | undefined
      attachments: any[]
      cc: string[]
      bcc: string[]
      accountId: number
      userId: number | null
      direction?: string
    }
  }
}
