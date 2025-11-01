// lib/security/rate-limit.ts
type Decision = { allowed: true } | { allowed: false; retryAfterSec: number }

type LimiterOpts = {
  key: string
  max: number
  windowSec: number
}

/**
 * LIMITER: folosește Upstash Redis dacă există cheile;
 * altfel un fallback in-memory (bun local, nu pe serverless multi-instance).
 */
export async function rateLimit({ key, max, windowSec }: LimiterOpts): Promise<Decision> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    // Fixed window: incr + ttl
    const nowBucket = Math.floor(Date.now() / 1000 / windowSec)
    const bucketKey = `rl:${key}:${nowBucket}`

    const res = await fetch(`${url}/incr/${encodeURIComponent(bucketKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const count = Number(await res.text())
    if (Number.isNaN(count)) return { allowed: true } // fail-open

    if (count === 1) {
      // set expiry
      await fetch(`${url}/pexpire/${encodeURIComponent(bucketKey)}/${windowSec * 1000}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
    }

    if (count > max) {
      return { allowed: false, retryAfterSec: windowSec }
    }
    return { allowed: true }
  }

  // ---- fallback in-memory (dev only) ----
  const g = globalThis as any
  g.__RL__ = g.__RL__ || new Map<string, { count: number; resetAt: number }>()
  const now = Date.now()
  const rec = g.__RL__.get(key)
  if (!rec || now > rec.resetAt) {
    g.__RL__.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return { allowed: true }
    }
  rec.count += 1
  if (rec.count > max) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((rec.resetAt - now) / 1000)) }
  }
  return { allowed: true }
}
