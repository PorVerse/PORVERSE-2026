// app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { buildCheckoutSessionParams } from '@/lib/billing/checkout'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET) console.warn('[billing] Missing STRIPE_SECRET_KEY env')
const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' }) : null

const BodySchema = z.object({
  productId: z.string().min(1),
  tier: z.enum(['romania', 'eu', 'us']).optional(),
  locale: z.enum(['auto', 'en', 'ro']).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT',
  'NL','PL','PT','RO','SK','SI','ES','SE',
])
function tierFromAL(al?: string): 'romania' | 'eu' | 'us' {
  if (!al) return 'eu'
  const tag = al.split(',')[0]?.trim().toLowerCase()
  const [lang, region] = (tag || '').split('-')
  const country = (region || '').toUpperCase()
  if (country === 'RO' || lang === 'ro') return 'romania'
  if (country === 'US') return 'us'
  if (country && EU_COUNTRIES.has(country)) return 'eu'
  return 'eu'
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }
    if (!stripe) {
      return NextResponse.json({ ok: false, error: 'stripe_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }

    const body = parsed.data
    const al = req.headers.get('accept-language') ?? undefined
    const tier = body.tier ?? tierFromAL(al)
    const locale = body.locale ?? 'auto'

    const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
    const successUrl = body.successUrl ?? `${site}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = body.cancelUrl ?? `${site}/billing/cancel`

    let userId: string | undefined
    try {
      const mod: any = await import('@supabase/auth-helpers-nextjs').catch(() => null)
      if (mod?.createRouteHandlerClient) {
        const supabase = mod.createRouteHandlerClient({ cookies: () => req.cookies })
        const { data } = await supabase.auth.getUser()
        userId = data?.user?.id
      }
    } catch {}

    const params = buildCheckoutSessionParams({
      productId: body.productId,
      tier,
      locale,
      successUrl,
      cancelUrl,
      userId,
    })
    const session = await stripe.checkout.sessions.create(params)

    return NextResponse.json(
      { ok: true, url: session.url },
      { status: 200, headers: { 'Cache-Control': 'no-store', Vary: 'Accept-Language' } }
    )
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[billing] checkout error:', e)
    }
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export function GET() {
  return NextResponse.json({ ok: true, endpoint: 'billing.checkout' }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
