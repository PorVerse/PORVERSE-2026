// app/api/health/route.ts — Production Health Monitoring (robust dev-safe)
// - Node runtime (Stripe etc. au nevoie de Node, nu Edge)
// - force-dynamic (fără cache), revalidate 0
// - probe condiționale: dacă lipsesc cheile în dev, marchează "degraded", NU "down"
// - DB test pe tabela "profiles" (există în proiectul tău)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Runtime & caching
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type UpState = 'up' | 'down' | 'degraded'
type GlobalState = 'healthy' | 'degraded' | 'unhealthy'

interface ServiceCheck {
  status: UpState
  responseTime: number
  error?: string
  lastCheck: string
}

interface HealthCheck {
  status: GlobalState
  timestamp: string
  version: string
  uptime: number
  region?: string
  services: Record<string, ServiceCheck>
  system: {
    memory: { used: number; total: number; percentage: number }
    nodejs: { version: string; uptime: number }
    environment: string
  }
  deployment: {
    buildId: string
    deployedAt: string
    commitHash: string
  }
}

// small helper to time any async fn and capture error as string
async function timed<T>(fn: () => Promise<T>): Promise<[T | null, number, string | undefined]> {
  const start = Date.now()
  try {
    const res = await fn()
    return [res, Date.now() - start, undefined]
  } catch (e: any) {
    return [null, Date.now() - start, e?.message || String(e)]
  }
}

const nowISO = () => new Date().toISOString()
const has = (v?: string) => typeof v === 'string' && v.length > 0

export async function GET() {
  const startedAt = nowISO()

  const health: HealthCheck = {
    status: 'healthy',
    timestamp: startedAt,
    version: process.env['NEXT_PUBLIC_APP_VERSION'] || process.env['APP_VERSION'] || 'dev',
    uptime: process.uptime(),
    region: process.env['VERCEL_REGION'] || process.env['FLY_REGION'],
    services: {},
    system: {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage:
          (process.memoryUsage().heapUsed / Math.max(process.memoryUsage().heapTotal, 1)) * 100,
      },
      nodejs: { version: process.version, uptime: process.uptime() },
      environment: process.env['NODE_ENV'] || 'unknown',
    },
    deployment: {
      buildId: process.env['NEXT_BUILD_ID'] || 'unknown',
      deployedAt: process.env['DEPLOYMENT_DATE'] || 'unknown',
      commitHash: process.env['VERCEL_GIT_COMMIT_SHA'] || process.env['COMMIT_SHA'] || 'unknown',
    },
  }

  // --- 1) Database (Supabase) ---
  {
    const lastCheck = nowISO()
    if (has(process.env['NEXT_PUBLIC_SUPABASE_URL']) && has(process.env['SUPABASE_SERVICE_ROLE_KEY'])) {
      const [dbRes, ms, err] = await timed(async () => {
        const supabase = createClient(
          process.env['NEXT_PUBLIC_SUPABASE_URL']!,
          process.env['SUPABASE_SERVICE_ROLE_KEY']!
        )
        return supabase.from('profiles').select('id').limit(1)
      })
      if (!err && dbRes && (dbRes as any).error == null) {
        health.services.database = { status: 'up', responseTime: ms, lastCheck }
      } else {
        health.services.database = {
          status: 'down',
          responseTime: ms,
          error: err || (dbRes as any)?.error?.message,
          lastCheck,
        }
        health.status = 'unhealthy'
      }
    } else {
      health.services.database = {
        status: 'degraded',
        responseTime: 0,
        error: 'env missing',
        lastCheck,
      }
      if (health.status === 'healthy') health.status = 'degraded'
    }
  }

  // --- 2) OpenAI ---
  {
    const lastCheck = nowISO()
    if (has(process.env['OPENAI_API_KEY'])) {
      const [_, ms, err] = await timed(async () => {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env['OPENAI_API_KEY']}` },
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        })
        if (!r.ok) throw new Error(`OpenAI ${r.status}`)
        return r
      })
      health.services.openai = { status: err ? 'down' : 'up', responseTime: ms, error: err, lastCheck }
      if (err) health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy'
    } else {
      health.services.openai = { status: 'degraded', responseTime: 0, error: 'env missing', lastCheck }
      if (health.status === 'healthy') health.status = 'degraded'
    }
  }

  // --- 3) Anthropic ---
  {
    const lastCheck = nowISO()
    if (has(process.env['ANTHROPIC_API_KEY'])) {
      const [_, ms, err] = await timed(async () => {
        const r = await fetch('https://api.anthropic.com/', {
          headers: { 'x-api-key': process.env['ANTHROPIC_API_KEY']! },
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        })
        if (r.status >= 500) throw new Error(`Anthropic ${r.status}`)
        return r
      })
      health.services.anthropic = {
        status: err ? 'down' : 'up',
        responseTime: ms,
        error: err,
        lastCheck,
      }
      if (err) health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy'
    } else {
      health.services.anthropic = {
        status: 'degraded',
        responseTime: 0,
        error: 'env missing',
        lastCheck,
      }
      if (health.status === 'healthy') health.status = 'degraded'
    }
  }

  // --- 4) Stripe ---
  {
    const lastCheck = nowISO()
    if (has(process.env['STRIPE_SECRET_KEY'])) {
      const [_, ms, err] = await timed(async () => {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, { apiVersion: '2024-06-20' })
        return stripe.accounts.retrieve()
      })
      health.services.stripe = { status: err ? 'down' : 'up', responseTime: ms, error: err, lastCheck }
      if (err) health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy'
    } else {
      health.services.stripe = { status: 'degraded', responseTime: 0, error: 'env missing', lastCheck }
      if (health.status === 'healthy') health.status = 'degraded'
    }
  }

  // --- 5) Resend (Email) ---
  {
    const lastCheck = nowISO()
    if (has(process.env['RESEND_API_KEY'])) {
      const [_, ms, err] = await timed(async () => {
        const r = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${process.env['RESEND_API_KEY']}` },
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        })
        if (!r.ok) throw new Error(`Resend ${r.status}`)
        return r
      })
      health.services.email = { status: err ? 'down' : 'up', responseTime: ms, error: err, lastCheck }
      if (err) health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy'
    } else {
      health.services.email = { status: 'degraded', responseTime: 0, error: 'env missing', lastCheck }
      if (health.status === 'healthy') health.status = 'degraded'
    }
  }

  // --- 6) Cloudflare ---
  {
    const lastCheck = nowISO()
    if (has(process.env['CLOUDFLARE_ZONE_ID']) && has(process.env['CLOUDFLARE_API_TOKEN'])) {
      const [_, ms, err] = await timed(async () => {
        const r = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${process.env['CLOUDFLARE_ZONE_ID']}`,
          {
            headers: { Authorization: `Bearer ${process.env['CLOUDFLARE_API_TOKEN']}` },
            signal: AbortSignal.timeout(5000),
            cache: 'no-store',
          }
        )
        if (!r.ok) throw new Error(`Cloudflare ${r.status}`)
        return r
      })
      health.services.cloudflare = { status: err ? 'down' : 'up', responseTime: ms, error: err, lastCheck }
      if (err) health.status = health.status === 'healthy' ? 'degraded' : 'unhealthy'
    } else {
      health.services.cloudflare = { status: 'degraded', responseTime: 0, error: 'env missing', lastCheck }
      if (health.status === 'healthy') health.status = 'degraded'
    }
  }

  // --- 7) Heuristici sistem ---
  if (health.system.memory.percentage > 90) {
    health.status = health.status === 'healthy' ? 'degraded' : health.status
  }

  const totalMs = Date.now() - new Date(startedAt).getTime()
  const statusCode = health.status === 'unhealthy' ? 503 : 200

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'X-Health-Check-Duration': String(totalMs),
      'X-Service-Status': health.status,
    },
  })
}
