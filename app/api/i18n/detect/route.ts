// app/api/i18n/detect/route.ts
import { NextResponse } from 'next/server'
import { detect } from '@/lib/i18n/language-detector'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const data = detect(req)
    return new NextResponse(
      JSON.stringify({ ok: true, data, meta: { source: data.source } }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // no-store pentru a nu memora valori de user între sesiuni
          'Cache-Control': 'no-store',
          Vary: 'Accept-Language, Cookie',
        },
      },
    )
  } catch (e: any) {
    // degradează grațios
    return new NextResponse(
      JSON.stringify({
        ok: true,
        data: {
          language: 'en',
          currency: 'EUR',
          pricingTier: 'eu',
          confidence: 0.3,
          source: 'fallback',
        },
        meta: { error: e?.message || 'fallback' },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          Vary: 'Accept-Language, Cookie',
        },
      },
    )
  }
}
