// app/api/i18n/preferences/route.ts
import { NextResponse } from 'next/server'
import { saveUserLanguagePreference } from '@/lib/i18n/language-detector'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { language, country, currency, timezone, pricingTier } = body || {}

    const result = await saveUserLanguagePreference({
      language,
      country,
      currency,
      timezone,
      pricingTier,
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason || 'persist_failed' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
}
