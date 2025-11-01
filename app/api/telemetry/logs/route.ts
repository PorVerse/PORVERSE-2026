// app/api/telemetry/logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// --- Config ---
const MAX_EVENTS = 50
const MAX_BODY_BYTES = 64 * 1024 // 64KB
const RATE_WINDOW_MS = 60_000
const RATE_MAX_HITS = 120 // /min per IP
const IP_HASH_SECRET = process.env.TELEMETRY_IP_HASH_SECRET || 'dev-secret-change-me'

// --- Allowlist & schema ---
const ALLOWED = new Set([
  'i18n.detected',
  'i18n.locale.applied',
  'i18n.locale.changed',
  'i18n.preference.persisted',
])

const EventSchema = z.object({
  event: z.string().min(1),
  level: z.enum(['info', 'warn', 'error']).optional(),
  ts: z.string().datetime().optional(),
}).passthrough()

// --- Rate limit (in-memory; replace upstream in prod if ai redis) ---
const hits = new Map<string, { c: number; t: number }>()
function rateLimit(ipHash: string): boolean {
  const now = Date.now()
  const r = hits.get(ipHash)
  if (!r || now - r.t > RATE_WINDOW_MS) {
    hits.set(ipHash, { c: 1, t: now })
    return true
  }
  if (r.c >= RATE_MAX_HITS) return false
  r.c++; return true
}

// --- Helpers ---
async function readBodyCapped(req: NextRequest): Promise<unknown> {
  const reader = req.body?.getReader?.()
  if (!reader) return await req.json().catch(() => ({}))
  let received = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value?.byteLength ?? 0
    if (received > MAX_BODY_BYTES) throw new Error('payload_too_large')
    chunks.push(value)
  }
  const bytes = Buffer.concat(chunks.map((u) => Buffer.from(u)))
  return JSON.parse(bytes.toString('utf8'))
}

function hash(value: string) {
  return crypto.createHmac('sha256', IP_HASH_SECRET).update(value).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || 'XX'
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0'
    const ipHash = hash(ip)

    if (!rateLimit(ipHash)) {
      return NextResponse.json({ ok: true }, { status: 204, headers: { 'Cache-Control': 'no-store' } })
    }

    const body = await readBodyCapped(req)
    const arr = Array.isArray(body) ? body : [body]
    if (arr.length > MAX_EVENTS) arr.length = MAX_EVENTS

    const nowIso = new Date().toISOString()
    const sanitized = arr
      .map((e) => {
        const parsed = EventSchema.safeParse(e)
        if (!parsed.success) return null
        const ev = parsed.data
        if (!ALLOWED.has(ev.event)) return null
        return {
          event: ev.event,
          level: ev.level ?? 'info',
          ts: ev.ts ?? nowIso,
          // Context fields whitelisted explicit:
          language: (e as any).language,
          pricingTier: (e as any).pricingTier,
          currency: (e as any).currency,
          source: (e as any).source,
          confidence: (e as any).confidence,
          // Privacy tags:
          ip_hash: ipHash,
          country,
        }
      })
      .filter(Boolean)

    if (sanitized.length === 0) {
      return NextResponse.json({ ok: true }, { status: 204, headers: { 'Cache-Control': 'no-store' } })
    }

    // Sink: replace with your data pipeline (Kafka/S3/ClickHouse). Non-blocking.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[telemetry/logs]', JSON.stringify(sanitized))
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    const code = e?.message === 'payload_too_large' ? 413 : 200
    return NextResponse.json({ ok: true }, { status: code, headers: { 'Cache-Control': 'no-store' } })
  }
}

export function GET() {
  return NextResponse.json({ ok: true, endpoint: 'logs' }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
