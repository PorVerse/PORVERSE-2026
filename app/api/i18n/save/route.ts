// app/api/i18n/save/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/ssr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type PricingTier = 'romania' | 'eu' | 'us'
type IsoCurrency = 'RON' | 'EUR' | 'USD'
type Lang = 'en' | 'ro'

interface SaveBody {
  language?: Lang
  country?: string | null
  currency?: IsoCurrency
  timezone?: string | null
  pricingTier?: PricingTier
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SaveBody
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: getUserErr } = await supabase.auth.getUser()
    if (getUserErr || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Construim payload doar cu câmpurile furnizate (nu suprascriem inutil)
    const update: Record<string, unknown> = {}
    if (body.language) update.language = body.language
    if (typeof body.country !== 'undefined') update.country = body.country
    if (body.currency) update.currency = body.currency
    if (typeof body.timezone !== 'undefined') update.timezone = body.timezone
    if (body.pricingTier) update.pricing_tier = body.pricingTier

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    update.i18n_updated_at = new Date().toISOString()

    const { error: upErr } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)

    if (upErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[i18n.save] update error', upErr)
      }
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[i18n.save] fatal', e)
    }
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 })
}
