/**
 * Rate Limiting Middleware
 * Upstash Redis-based rate limiting pentru API protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ============================================================================
// UPSTASH REDIS CLIENT
// ============================================================================

let redis: Redis | null = null
let rateLimiters: Map<string, Ratelimit> = new Map()

/**
 * Initialize Redis client (lazy loading)
 */
function getRedis(): Redis {
  if (!redis) {
    const url = process.env['UPSTASH_REDIS_REST_URL']
    const token = process.env['UPSTASH_REDIS_REST_TOKEN']


    if (!url || !token) {
      throw new Error('Upstash Redis credentials not configured')
    }

    redis = new Redis({ url, token })
  }
  return redis
}

/**
 * Get or create rate limiter for specific route type
 */
function getRateLimiter(key: string, requiresAuth: boolean): Ratelimit {
  const cacheKey = `${key}-${requiresAuth}`
  
  if (rateLimiters.has(cacheKey)) {
    return rateLimiters.get(cacheKey)!
  }

  const redis = getRedis()
  let limiter: Ratelimit

  // Configurare per tip de rută
  switch (key) {
    case 'ai':
      // AI routes: 20 requests per minute (expensive operations)
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        analytics: true,
        prefix: '@porverse/ai'
      })
      break

    case 'auth':
      // Auth routes: 10 requests per minute (prevent brute force)
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: '@porverse/auth'
      })
      break

    case 'biometric':
      // Biometric: 30 requests per minute (camera stream)
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '1 m'),
        analytics: true,
        prefix: '@porverse/biometric'
      })
      break

    case 'webhook':
      // Webhooks: 100 requests per minute (external integrations)
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: '@porverse/webhook'
      })
      break

    default:
      // Standard API: 60 requests per minute
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
        prefix: '@porverse/api'
      })
  }

  rateLimiters.set(cacheKey, limiter)
  return limiter
}

// ============================================================================
// FALLBACK RATE LIMITING (In-Memory)
// ============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const inMemoryLimits = new Map<string, RateLimitEntry>()

/**
 * Fallback in-memory rate limiting (când Upstash nu e disponibil)
 */
function checkInMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const key = identifier
  const entry = inMemoryLimits.get(key)

  // Curățare periodică
  if (inMemoryLimits.size > 10000) {
    const cutoff = now - windowMs
    for (const [k, v] of inMemoryLimits.entries()) {
      if (v.resetAt < cutoff) {
        inMemoryLimits.delete(k)
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // Reset window
    inMemoryLimits.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, reset: entry.resetAt }
}

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Get identifier pentru rate limiting (user ID sau IP)
 */
function getIdentifier(request: NextRequest, requiresAuth: boolean): string {
  if (requiresAuth) {
    // Pentru rute autentificate, folosește session ID
    const sessionToken = request.cookies.get('sb-access-token')?.value
    if (sessionToken) {
      return `user:${sessionToken.substring(0, 20)}`
    }
  }

  // Pentru rute publice, folosește IP
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  
  return `ip:${ip}`
}

/**
 * Apply rate limiting la request
 */
export async function applyRateLimit(
  request: NextRequest,
  routeType: 'ai' | 'auth' | 'biometric' | 'webhook' | 'api',
  requiresAuth: boolean = false
): Promise<NextResponse | null> {
  try {
    const identifier = getIdentifier(request, requiresAuth)
    const limiter = getRateLimiter(routeType, requiresAuth)

    const { success, limit, remaining, reset, pending } = await limiter.limit(identifier)

    // Add rate limit headers
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', limit.toString())
    headers.set('X-RateLimit-Remaining', remaining.toString())
    headers.set('X-RateLimit-Reset', new Date(reset).toISOString())

    if (!success) {
      return NextResponse.json(
        {
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
            retryAfter: Math.ceil((reset - Date.now()) / 1000)
          }
        },
        { status: 429, headers }
      )
    }

    // Rate limit passed - return null to continue
    return null

  } catch (error) {
    console.error('Rate limiting error (falling back to in-memory):', error)

    // Fallback la in-memory rate limiting
    const identifier = getIdentifier(request, requiresAuth)
    const limits = {
      ai: { limit: 20, window: 60000 },
      auth: { limit: 10, window: 60000 },
      biometric: { limit: 30, window: 60000 },
      webhook: { limit: 100, window: 60000 },
      api: { limit: 60, window: 60000 }
    }

    const config = limits[routeType]
    const result = checkInMemoryRateLimit(identifier, config.limit, config.window)

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429
          }
        },
        { status: 429 }
      )
    }

    return null
  }
}

/**
 * Check rate limit (pentru folosire în API routes)
 */
export async function checkRateLimit(
  request: NextRequest,
  routeType: 'ai' | 'auth' | 'biometric' | 'webhook' | 'api',
  requiresAuth: boolean = false
): Promise<NextResponse | null> {
  return applyRateLimit(request, routeType, requiresAuth)
}