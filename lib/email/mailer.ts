// lib/email/mailer.ts
import { Resend } from 'resend'

const RESEND_API_KEY = process.env['RESEND_API_KEY']

let client: Resend | null = null

function getClient(): Resend {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY missing')
  }
  if (!client) client = new Resend(RESEND_API_KEY)
  return client
}

export type MailSendParams = {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendMail(params: MailSendParams) {
  const resend = getClient()
  const from = params.from ?? 'PorVerse <no-reply@porverse.com>'
  const res = await resend.emails.send({
    from,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  })
  return res
}
