/**
 * Rate Limiting Service
 * SUPER ENTERPRISE INTERSTELLAR Level
 * 
 * Protection against:
 * - Brute force attacks
 * - DDoS attacks
 * - API abuse
 * - Cost overruns (AI API calls)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getEnv, hasEnv } from '@/lib/env'

/**
 * Redis client (singleton)
 */
let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    if (!hasEnv('UPSTASH_REDIS_REST_URL') || !hasEnv('UPSTASH_REDIS_REST_TOKEN')) {
      throw new Error('Redis configuration missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
    }

    redis = new Redis({
      url: getEnv('UPSTASH_REDIS_REST_URL'),
      token: getEnv('UPSTASH_REDIS_REST_TOKEN')
    })
  }
  return redis
}

/**
 * Authentication rate limiter
 * - Very strict: 5 requests per 15 minutes
 * - Prevents brute force attacks
 */
export const authRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'porverse:ratelimit:auth'
})

/**
 * API rate limiter
 * - Standard: 100 requests per minute
 * - General API protection
 */
export const apiRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'porverse:ratelimit:api'
})

/**
 * AI chat rate limiter
 * - Expensive operations: 20 requests per hour
 * - Prevents cost overruns
 */
export const aiChatRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'porverse:ratelimit:ai'
})

/**
 * Biometric scan rate limiter
 * - Moderate: 50 scans per hour
 * - Prevents camera abuse
 */
export const biometricRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(50, '1 h'),
  analytics: true,
  prefix: 'porverse:ratelimit:biometric'
})

/**
 * Portal unlock rate limiter
 * - Conservative: 10 unlocks per hour
 * - Prevents gaming the system
 */
export const portalUnlockRateLimit = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'porverse:ratelimit:unlock'
})

/**
 * Rate limit result type
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending?: Promise<unknown>
}

/**
 * Check rate limit for a given identifier
 * Returns detailed result about limit status
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier)
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending
  }
}

/**
 * Get client identifier from request
 * Priority: User ID > IP Address > Fallback
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit middleware for API routes
 * Usage in API route:
 * 
 * const identifier = getClientIdentifier(request, userId)
 * const result = await applyRateLimit(apiRateLimit, identifier)
 * if (!result.success) {
 *   return new Response('Rate limit exceeded', {
 *     status: 429,
 *     headers: {
 *       'X-RateLimit-Limit': result.limit.toString(),
 *       'X-RateLimit-Remaining': result.remaining.toString(),
 *       'X-RateLimit-Reset': result.reset.toString()
 *     }
 *   })
 * }
 */
export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult & { headers: Record<string, string> }> {
  const result = await checkRateLimit(limiter, identifier)
  
  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
      'Retry-After': result.success ? '0' : Math.ceil((result.reset - Date.now()) / 1000).toString()
    }
  }
}

/**
 * Create 429 Rate Limit Response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const resetDate = new Date(result.reset).toISOString()
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again after ${retryAfter} seconds.`,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetDate,
      retry_after: retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': retryAfter.toString()
      }
    }
  )
}

/**
 * Advanced: Per-user rate limiting with tiers
 */
export enum UserTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

const TIER_LIMITS: Record<UserTier, number> = {
  [UserTier.FREE]: 100,
  [UserTier.PRO]: 500,
  [UserTier.ENTERPRISE]: 5000
}

export async function checkUserTierRateLimit(
  userId: string,
  tier: UserTier = UserTier.FREE
): Promise<RateLimitResult> {
  const limit = TIER_LIMITS[tier]
  
  const rateLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(limit, '1 h'),
    analytics: true,
    prefix: `porverse:ratelimit:user:${tier}`
  })

  return checkRateLimit(rateLimiter, userId)
}

/**
 * Burst protection
 * Allows short bursts but protects over time
 */
export const burstProtection = new Ratelimit({
  redis: getRedis(),
  limiter: Ratelimit.tokenBucket(10, '1 s', 100),
  analytics: true,
  prefix: 'porverse:ratelimit:burst'
})