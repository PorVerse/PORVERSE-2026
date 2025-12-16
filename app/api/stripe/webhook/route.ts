// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { svLog, svMetric } from '@/lib/telemetry/server'
import { sendMail } from '@/lib/email/mailer'
import { stripeReceiptTemplate } from '@/lib/email/templates/stripeReceipt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const STRIPE_SECRET_KEY = process.env['STRIPE_SECRET_KEY'] || ''
const WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] || ''

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

/** Stripe semnătură + raw body handling */
export async function POST(req: Request) {
  try {
    if (!WEBHOOK_SECRET) {
      await svLog('billing.webhook.misconfigured', { reason: 'STRIPE_WEBHOOK_SECRET missing' })
      return NextResponse.json({ ok: false, error: 'Webhook not configured' }, { status: 500 })
    }

    // Stripe cere payload raw
    const buf = Buffer.from(await req.arrayBuffer())
    const sig = req.headers.get('stripe-signature') || ''

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(buf, sig, WEBHOOK_SECRET)
    } catch (err: any) {
      await svLog('billing.webhook.signature_invalid', { error: err?.message })
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 })
    }

    // Telemetrie: contor general
    await svMetric('billing.webhook.event', 1)
    await svLog('billing.webhook.received', { type: event.type, id: event.id })

    switch (event.type) {
      case 'checkout.session.completed': {
        const session: Stripe.Checkout.Session = event.data.object
        const amount = session.amount_total ?? session.amount_subtotal ?? 0
        const currency = session.currency?.toUpperCase() ?? 'USD'
        const customerEmail =
          typeof session.customer === 'string'
          ? undefined
          : ('email' in (session.customer ?? {}) ? (session.customer as any)?.email : undefined)

        await svLog('billing.checkout.completed', {
          sessionId: session.id,
          customer: session.customer,
          email,
          amount,
          currency,
          mode: session.mode,
        })
        await svMetric('billing.checkout.completed', 1)

        // Trimite email (best-effort; doar dacă avem email)
        if (email) {
          const amountFmt = formatMinorToMajor(amount, currency)
          const html = stripeReceiptTemplate({
            title: 'Payment confirmation',
            intro: 'Thank you for your purchase! Your plan is now active.',
            planLabel: 'Plan',
            amountLabel: 'Amount charged',
            amount: `${amountFmt} ${currency}`,
            nextSteps: ['Access your dashboard', 'Check billing page for invoices'],
            footerNote: 'If this wasn’t you, reply to this email.',
          })
          try {
            await sendMail({
              to: email,
              subject: 'PorVerse • Payment confirmation',
              html,
            })
            await svLog('billing.email.sent', { to: email, template: 'stripeReceipt' })
          } catch (e: any) {
            await svLog('billing.email.failed', { to: email, error: e?.message })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub: Stripe.Subscription = event.data.object
        await svLog('billing.subscription.updated', {
          id: sub.id,
          status: sub.status,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        await svMetric(`billing.subscription.status.${sub.status}`, 1)
        break
      }

      case 'invoice.payment_succeeded': {
        const inv: Stripe.Invoice = event.data.object
        await svLog('billing.invoice.paid', {
          id: inv.id,
          number: inv.number,
          total: inv.total,
          currency: inv.currency?.toUpperCase(),
        })
        await svMetric('billing.invoice.paid', 1)
        break
      }

      default: {
        // alte evenimente — log light
        if (process.env['NODE_ENV'] !== 'production') {
          console.info('[stripe.webhook.unhandled]', event.type)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[stripe.webhook.error]', err)
    await svLog('billing.webhook.error', { error: err?.message })
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 })
}

/** Stripe amount_minor_units → human string (ex: 1900, "EUR") => "19.00" */
function formatMinorToMajor(minor: number, currency: string) {
  // majoritatea monedelor au 2 zecimale; pentru JPY etc. poți extinde dacă ai nevoie
  const decimals = 2
  const base = Math.pow(10, decimals)
  return (minor / base).toFixed(decimals)
}
