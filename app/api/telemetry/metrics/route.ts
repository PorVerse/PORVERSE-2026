// app/api/telemetry/metrics/route.ts
import crypto from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const MAX_POINTS = 100
const MAX_BODY_BYTES = 64 * 1024
const RATE_WINDOW_MS = 60_000
const RATE_MAX_HITS = 240
const IP_HASH_SECRET = process.env['TELEMETRY_IP_HASH_SECRET'] || 'dev-secret-change-me'

const ALLOWED = new Set(['i18n.locale.applied', 'i18n.locale.changed'])

const MetricSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['counter', 'gauge']).optional(),
  value: z.number().optional(),
  tags: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  ts: z.string().datetime().optional(),
})

const hits = new Map<string, { c: number; t: number }>()
function rateLimit(ipHash: string): boolean {
  const now = Date.now()
  const r = hits.get(ipHash)
  if (!r || now - r.t > RATE_WINDOW_MS) {
    hits.set(ipHash, { c: 1, t: now })
    return true
  }
  if (r.c >= RATE_MAX_HITS) {return false}
  r.c++; return true
}

async function readBodyCapped(req: NextRequest): Promise<unknown> {
  const reader = req.body?.getReader?.()
  if (!reader) {return await req.json().catch(() => ({}))}
  let received = 0
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) {break}
    received += value?.byteLength ?? 0
    if (received > MAX_BODY_BYTES) {throw new Error('payload_too_large')}
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
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0'
    const ipHash = hash(ip)
    if (!rateLimit(ipHash)) {return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })}

    const body = await readBodyCapped(req)
    const arr = Array.isArray(body) ? body : [body]
    if (arr.length > MAX_POINTS) {arr.length = MAX_POINTS}

    const nowIso = new Date().toISOString()
    const sanitized = arr
      .map((p) => {
        const parsed = MetricSchema.safeParse(p)
        if (!parsed.success) {return null}
        const m = parsed.data
        if (!ALLOWED.has(m.name)) {return null}
        return {
          name: m.name,
          type: m.type ?? 'counter',
          value: typeof m.value === 'number' ? m.value : 1,
          tags: m.tags ?? {},
          ts: m.ts ?? nowIso,
          ip_hash: ipHash,
        }
      })
      .filter(Boolean)

    if (sanitized.length && process.env['NODE_ENV'] !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[telemetry/metrics]', JSON.stringify(sanitized))
    }
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  } catch (e: unknown) {
    const code = (e instanceof Error && e.message === 'payload_too_large') ? 413 : 204
    return new NextResponse(null, { status: code, headers: { 'Cache-Control': 'no-store' } })
  }
}

export function GET() {
  return NextResponse.json({ ok: true, endpoint: 'metrics' }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
