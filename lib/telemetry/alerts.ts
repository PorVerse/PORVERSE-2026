// lib/telemetry/alerts.ts
export type AlertLevel = 'info' | 'warn' | 'error' | 'critical'

/**
 * sendCriticalAlert: trimite email via Resend dacă există cheile,
 * altfel doar console.error (degrade grațios).
 */
export async function sendCriticalAlert(subject: string, details: Record<string, unknown>) {
  try {
    const key = process.env['RESEND_API_KEY']
    const to = process.env['ALERT_EMAIL'] // ex: ops@porverse.com
    if (!key || !to) {
      console.error('[ALERT][NO-EMAIL]', subject, details)
      return
    }

    // lazy import (evită bloat în edge)
    const { Resend } = await import('resend')
    const resend = new Resend(key)

    await resend.emails.send({
      from: 'PorVerse Alerts <alerts@porverse.com>',
      to,
      subject: `[CRITICAL] ${subject}`,
      text: JSON.stringify(details, null, 2),
    })
  } catch (e) {
    console.error('[ALERT][FAILED]', subject, details, e)
  }
}
