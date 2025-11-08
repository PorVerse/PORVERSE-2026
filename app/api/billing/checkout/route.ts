// app/api/billing/checkout/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type PricingTier = 'romania' | 'eu' | 'us'
type ProductId = 'portal_premium' | 'pro_monthly'

/**
 * ENV obligatorii:
 * - STRIPE_SECRET_KEY
 * - STRIPE_PRICE_* (pe produs & tier)
 * Opționale:
 * - NEXT_BILLING_REQUIRE_AUTH=1 (cere login pentru checkout)
 */
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const REQUIRE_AUTH = process.env.NEXT_BILLING_REQUIRE_AUTH === '1'
if (!STRIPE_SECRET_KEY) console.warn('[billing] STRIPE_SECRET_KEY missing')

const stripe = new Stripe(STRIPE_SECRET_KEY)

// ---- Price map din ENV (TEST/PROD în funcție de cheie) ----
const PRICE_MAP: Record<ProductId, Record<PricingTier, string | undefined>> = {
  portal_premium: {
    romania: process.env.STRIPE_PRICE_PORTAL_PREMIUM_RO,
    eu: process.env.STRIPE_PRICE_PORTAL_PREMIUM_EU,
    us: process.env.STRIPE_PRICE_PORTAL_PREMIUM_US,
  },
  pro_monthly: {
    romania: process.env.STRIPE_PRICE_PRO_MONTHLY_RO,
    eu: process.env.STRIPE_PRICE_PRO_MONTHLY_EU,
    us: process.env.STRIPE_PRICE_PRO_MONTHLY_US,
  },
}

// ---- Helpers ------------------------------------------------
function pickCookie(cookieHeader: string, name: string): string | undefined {
  const m = cookieHeader?.match(new RegExp(`${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : undefined
}

function pickTierFromHeaders(headers: Headers): PricingTier {
  const explicit = headers.get('x-porverse-tier') as PricingTier | null
  if (explicit === 'romania' || explicit === 'eu' || explicit === 'us') return explicit

  const cookie = headers.get('cookie') || ''
  const country = pickCookie(cookie, 'i18n_country')?.toUpperCase()
  if (country === 'RO') return 'romania'
  if (country === 'US') return 'us'

  const al = headers.get('accept-language') || ''
  const base = al.split(',')[0]?.trim().toLowerCase().split('-')[0] || ''
  if (base === 'ro') return 'romania'
  if (base === 'en') return 'eu'

  return 'eu'
}

function localeToCustomerLocale(locale?: string): Stripe.Checkout.SessionCreateParams.Locale | undefined {
  if (!locale) return undefined
  if (locale.startsWith('ro')) return 'ro'
  if (locale.startsWith('en')) return 'en'
  return undefined
}

// Folosește host+protocol+port din request (corect pt. 3000/3001 etc.)
function inferSiteUrl(req: Request): string {
  const proto = (req.headers.get('x-forwarded-proto') || 'http').replace(/:$/, '')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  return `${proto}://${host}`.replace(/\/+$/, '')
}

// ---- Route: POST /api/billing/checkout ----------------------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const productId = body?.productId as ProductId
    const locale = (body?.locale as string | undefined) || 'en'
    const explicitTier = body?.tier as PricingTier | undefined

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: 'Stripe not configured (secret key missing).' }, { status: 500 })
    }
    if (!productId || !['portal_premium', 'pro_monthly'].includes(productId)) {
      return NextResponse.json({ ok: false, error: 'Invalid productId.' }, { status: 400 })
    }

    // Auth (opțional, controlat prin env)
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (REQUIRE_AUTH && !user) {
      return NextResponse.json({ ok: false, error: 'Forbidden: authentication required.' }, { status: 403 })
    }

    // Profil (dacă user există)
    let stripeCustomerId: string | null = null
    let userEmail: string | null = null
    if (user) {
      userEmail = user.email ?? null
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
        let customerRow: any = null
try {
  const { data } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()
  customerRow = data
} catch {
  customerRow = null
}

      stripeCustomerId = profile?.stripe_customer_id ?? null
    }

    // Tier + price
    const tier: PricingTier = explicitTier || pickTierFromHeaders(req.headers)
    const priceId = PRICE_MAP[productId][tier]
    if (!priceId) {
      return NextResponse.json({ ok: false, error: `No price configured for ${productId} @ ${tier}.` }, { status: 500 })
    }

    const siteUrl = inferSiteUrl(req)
    const lang = locale.startsWith('ro') ? 'ro' : 'en'
    const successUrl = `${siteUrl}/${lang}/billing?status=success&product=${productId}`
    const cancelUrl = `${siteUrl}/${lang}/pricing?status=cancel`

    // Construim parametrii sesiuni — “enterprise”: customer (dacă îl avem), altfel email;
    // atașăm user_id în metadata pentru mapare sigură în webhook; activăm tax & promo codes.
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: localeToCustomerLocale(locale),
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      // legăm sesiunea de user, dacă este logat
      client_reference_id: user?.id || undefined,
      metadata: user?.id ? { user_id: user.id } : undefined,
      subscription_data: user?.id ? { metadata: { user_id: user.id } } : undefined,
    }

    // dacă știm customer-ul, îl folosim; altfel, folosim email (dacă există)
    if (stripeCustomerId) {
      params.customer = stripeCustomerId
    } else if (userEmail) {
      params.customer_email = userEmail
    }

    const session = await stripe.checkout.sessions.create(params)

    if (process.env.NODE_ENV !== 'production') {
      console.info('[billing] session created', {
        id: session.id, tier, productId, priceId, siteUrl,
        hasCustomer: !!params.customer, usedEmail: !!params.customer_email,
      })
    }

    return NextResponse.json({ ok: true, url: session.url, id: session.id })
  } catch (err: any) {
    const code = err?.raw?.code || err?.code
    const type = err?.raw?.type || err?.type
    const message = err?.raw?.message || err?.message || 'Unknown error'
    const status = Number(err?.statusCode) || (String(message).toLowerCase().includes('auth') ? 403 : 500)

    if (process.env.NODE_ENV !== 'production') {
      console.error('[billing] checkout error', { type, code, status, message })
    }
    return NextResponse.json({ ok: false, error: message, code, type }, { status })
  }
}

// Interzicem GET (evităm crawling)
export function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 })
}
