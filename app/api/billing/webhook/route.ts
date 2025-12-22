// app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const STRIPE_SECRET = process.env['STRIPE_SECRET_KEY']
const STRIPE_WH_SECRET = process.env['STRIPE_WEBHOOK_SECRET']

const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: '2025-12-15.clover' as const }) : null

// Stripe cere "raw body" pentru verificare semnătură
async function readRawBody(req: NextRequest): Promise<string> {
  const reader = req.body?.getReader()
  if (!reader) {return ''}
  const chunks: Uint8Array[] = []
  // @ts-ignore
for await (const chunk of (async function* () { while (true) { const { done, value } = await reader.read(); if (done) {break;} yield value } })()) {
    chunks.push(chunk)
  }
  const merged = Buffer.concat(chunks.map((c) => Buffer.from(c)))
  return merged.toString('utf8')
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe || !STRIPE_WH_SECRET) {
      return NextResponse.json({ ok: false }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }

    const sig = req.headers.get('stripe-signature') || ''
    const raw = await readRawBody(req)

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WH_SECRET)
    } catch (err) {
      if (process.env['NODE_ENV'] !== 'production') {console.error('[stripe] bad signature', err)}
      return new NextResponse('Bad signature', { status: 400 })
    }

    // Lazy import Supabase helper
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('@supabase/ssr').catch(() => null)
    const supabaseAdminKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any = null
    if (mod?.createClient && supabaseAdminKey) {
      // Server-side admin client (nu folosește cookie)
      supabase = mod.createClient(process.env['NEXT_PUBLIC_SUPABASE_URL']!, supabaseAdminKey)
    }

    const type = event.type

    if (type === 'checkout.session.completed') {
      const session = event.data.object
      const customerId = session.customer as string | null
      const priceId = (session.line_items?.data?.[0]?.price?.id ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).lines?.data?.[0]?.price?.id) as string | undefined

      // user_id l-am pus în metadata în timpul creării sesiunii
      const userId = (session.metadata?.['user_id'] || session.client_reference_id || '').trim() || null

      if (supabase && customerId) {
        if (userId) {
          await supabase.from('profiles').update({
            stripe_customer_id: customerId,
            stripe_price_id: priceId ?? null,
            stripe_status: 'active',
            i18n_updated_at: new Date().toISOString(),
          }).eq('id', userId)
        } else if (session.customer_details?.email) {
          // fallback by email
          await supabase.from('profiles').update({
            stripe_customer_id: customerId,
            stripe_price_id: priceId ?? null,
            stripe_status: 'active',
            i18n_updated_at: new Date().toISOString(),
          }).eq('email', session.customer_details.email)
        }
      }
    }

    if (type === 'customer.subscription.updated' || type === 'customer.subscription.created') {
      const sub = event.data.object
      const customerId = sub.customer as string
      const priceId = sub.items.data[0]?.price?.id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEnd = new Date((sub as any).current_period_end * 1000).toISOString()
      const status = sub.status

      if (supabase) {
        await supabase.from('profiles').update({
          stripe_price_id: priceId ?? null,
          stripe_current_period_end: periodEnd,
          stripe_status: status,
          i18n_updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId)
      }
    }

    if (type === 'invoice.paid') {
      const invoice = event.data.object
      if (invoice.customer && supabase) {
        await supabase.from('profiles').update({
          stripe_status: 'active',
        }).eq('stripe_customer_id', invoice.customer as string)
      }
    }

    if (type === 'customer.subscription.deleted') {
      const sub = event.data.object
      if (supabase) {
        await supabase.from('profiles').update({
          stripe_status: 'canceled',
        }).eq('stripe_customer_id', sub.customer as string)
      }
    }

    return new NextResponse(null, { status: 200 })
  } catch (e) {
    if (process.env['NODE_ENV'] !== 'production') {console.error('[stripe] webhook error', e)}
    return new NextResponse(null, { status: 200 })
  }
}

export function GET() {
  return NextResponse.json({ ok: true, endpoint: 'billing.webhook' }, { status: 200 })
}
