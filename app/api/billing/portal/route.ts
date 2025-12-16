// app/api/billing/portal/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/ssr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const STRIPE_SECRET_KEY = process.env['STRIPE_SECRET_KEY'] || ''
const REQUIRE_AUTH = process.env['NEXT_BILLING_REQUIRE_AUTH'] === '1' // dacă e 0, permitem dev-fallback

if (!STRIPE_SECRET_KEY) {
  console.warn('[billing] STRIPE_SECRET_KEY missing')
}
const stripe = new Stripe(STRIPE_SECRET_KEY)

function inferSiteUrl(req: Request): string {
  const proto = (req.headers.get('x-forwarded-proto') || 'http').replace(/:$/, '')
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
  return `${proto}://${host}`.replace(/\/+$/, '')
}
function pickLang(headers: Headers): 'en' | 'ro' {
  const cookie = headers.get('cookie') || ''
  const m = cookie.match(/i18n_locale=([^;]+)/)
  const fromCookie = m ? decodeURIComponent(m[1]).split('-')[0].toLowerCase() : ''
  if (fromCookie === 'ro') return 'ro'
  if (fromCookie === 'en') return 'en'
  const ref = headers.get('referer') || ''
  if (/\/ro(\/|$)/.test(ref)) return 'ro'
  return 'en'
}

export async function POST(req: Request) {
  try {
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: 'Stripe not configured.' }, { status: 500 })
    }

    // 1) user (dacă există)
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: userRes } = await supabase.auth.getUser()
    const user = userRes?.user || null

    // 2) dacă cerem auth și nu există user -> 401
    if (REQUIRE_AUTH && !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 3) Dacă avem user: citim/scriem stripe_customer_id în profiles
    let customerId: string | null = null
    if (user) {
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle()
      if (profErr) {
        if (process.env['NODE_ENV'] !== 'production') console.error('[billing] profile read error', profErr)
        return NextResponse.json({ ok: false, error: 'Profile read failed.' }, { status: 500 })
      }

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id
      } else {
        const customer = await stripe.customers.create({
          email: profile?.email || user.email || undefined,
          name: profile?.full_name || undefined,
          metadata: { user_id: user.id },
        })
        customerId = customer.id
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
        if (updErr && process.env['NODE_ENV'] !== 'production') {
          console.warn('[billing] profile update warn', updErr)
        }
      }
    }

    // 4) Fallback DEV: fără user și fără REQUIRE_AUTH -> client temporar (nepersistat)
    if (!customerId && !user && !REQUIRE_AUTH) {
      const devEmail = `dev+${Date.now()}@porverse.local`
      const tempCustomer = await stripe.customers.create({
        email: devEmail,
        name: 'Dev User',
        metadata: { note: 'temp_dev_customer_no_auth' },
      })
      customerId = tempCustomer.id
      if (process.env['NODE_ENV'] !== 'production') {
        console.info('[billing] using temp dev customer', { customerId })
      }
    }

    if (!customerId) {
      // dacă ajungem aici, înseamnă că nu avem user și nici dev-fallback activ
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 5) creează sesiunea de portal
    const siteUrl = inferSiteUrl(req)
    const lang = pickLang(req.headers)
    const returnUrl = `${siteUrl}/${lang}/billing`
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err: any) {
    const msg = err?.message || 'Unknown error'
    if (process.env['NODE_ENV'] !== 'production') console.error('[billing] portal error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 })
}
