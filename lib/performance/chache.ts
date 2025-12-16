/**
 * Caching Service
 * SUPER ENTERPRISE INTERSTELLAR Level
 * 
 * Features:
 * - Multi-tier caching (Memory + Redis)
 * - TTL management
 * - Cache invalidation patterns
 * - AI response caching (expensive operations)
 * - Query result caching
 */

import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'
import { getEnv, hasEnv } from '@/lib/env'

/**
 * Cache TTL presets (in seconds)
 */
export const TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  VERY_LONG: 86400,    // 24 hours
  WEEK: 604800,        // 7 days
  MONTH: 2592000       // 30 days
} as const

/**
 * In-memory cache (L1)
 * Fast but limited capacity
 */
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>()
  private maxSize = 1000

  set(key: string, value: any, ttl: number): void {
    // Enforce size limit
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * Multi-tier caching service
 * L1: Memory (fast, limited)
 * L2: Redis (slower, unlimited)
 */
export class CacheService {
  private redis: Redis | null = null
  private memoryCache = new MemoryCache()
  private TTL = TTL

  constructor() {
    // Initialize Redis if available
    if (hasEnv('UPSTASH_REDIS_REST_URL') && hasEnv('UPSTASH_REDIS_REST_TOKEN')) {
      this.redis = new Redis({
        url: getEnv('UPSTASH_REDIS_REST_URL'),
        token: getEnv('UPSTASH_REDIS_REST_TOKEN')
      })
    } else {
      console.warn('⚠️  Redis not configured. Using memory cache only (limited performance).')
    }
  }

  /**
   * Get value from cache
   * Checks memory first, then Redis
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (L1)
    const memoryValue = this.memoryCache.get(key)
    if (memoryValue !== null) {
      return memoryValue as T
    }

    // Try Redis (L2)
    if (this.redis) {
      try {
        const value = await this.redis.get<T>(key)
        
        // Populate memory cache for next access
        if (value !== null) {
          this.memoryCache.set(key, value, this.TTL.SHORT)
        }
        
        return value
      } catch (error) {
        console.error('Redis get error:', error)
        return null
      }
    }

    return null
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(
    key: string,
    value: T,
    ttl: number = this.TTL.MEDIUM
  ): Promise<void> {
    // Set in memory cache (L1)
    this.memoryCache.set(key, value, ttl)

    // Set in Redis (L2)
    if (this.redis) {
      try {
        await this.redis.setex(key, ttl, value)
      } catch (error) {
        console.error('Redis set error:', error)
      }
    }
  }

  /**
   * Get or compute and cache
   * Classic cache-aside pattern
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.TTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Cache miss - compute value
    const value = await fetcher()

    // Store in cache
    await this.set(key, value, ttl)

    return value
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)
    
    if (this.redis) {
      try {
        await this.redis.del(key)
      } catch (error) {
        console.error('Redis delete error:', error)
      }
    }
  }

  /**
   * Invalidate cache by pattern
   * E.g., invalidate('user:123:*') deletes all keys for user 123
   */
  async invalidate(pattern: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } catch (error) {
        console.error('Redis invalidate error:', error)
      }
    }
    
    // Clear memory cache (can't pattern match efficiently)
    this.memoryCache.clear()
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
    
    if (this.redis) {
      try {
        await this.redis.flushdb()
      } catch (error) {
        console.error('Redis clear error:', error)
      }
    }
  }

  /**
   * Cache AI responses (expensive to generate)
   * Uses content hash as key for deduplication
   */
  async cacheAIResponse(
    prompt: string,
    response: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const key = this.createAIKey(prompt)
    const value = {
      response,
      metadata,
      cached_at: new Date().toISOString()
    }
    
    await this.set(key, value, this.TTL.VERY_LONG)
  }

  /**
   * Get cached AI response
   */
  async getCachedAIResponse(
    prompt: string
  ): Promise<{ response: string; metadata?: Record<string, any> } | null> {
    const key = this.createAIKey(prompt)
    return await this.get(key)
  }

  /**
   * Cache database query results
   */
  async cacheQuery<T>(
    query: string,
    params: any[],
    fetcher: () => Promise<T>,
    ttl: number = this.TTL.MEDIUM
  ): Promise<T> {
    const key = this.createQueryKey(query, params)
    return await this.getOrSet(key, fetcher, ttl)
  }

  /**
   * Cache user data
   */
  async cacheUserData<T>(
    userId: string,
    dataType: string,
    data: T,
    ttl: number = this.TTL.LONG
  ): Promise<void> {
    const key = `user:${userId}:${dataType}`
    await this.set(key, data, ttl)
  }

  /**
   * Get cached user data
   */
  async getUserData<T>(userId: string, dataType: string): Promise<T | null> {
    const key = `user:${userId}:${dataType}`
    return await this.get<T>(key)
  }

  /**
   * Invalidate all cache for a user
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.invalidate(`user:${userId}:*`)
  }

  /**
   * Cache portal data
   */
  async cachePortal<T>(
    portalId: string,
    data: T,
    ttl: number = this.TTL.LONG
  ): Promise<void> {
    const key = `portal:${portalId}`
    await this.set(key, data, ttl)
  }

  /**
   * Get cached portal
   */
  async getPortal<T>(portalId: string): Promise<T | null> {
    const key = `portal:${portalId}`
    return await this.get<T>(key)
  }

  /**
   * Cache statistics
   */
  getStats(): {
    memorySize: number
    redisAvailable: boolean
  } {
    return {
      memorySize: this.memoryCache.size(),
      redisAvailable: this.redis !== null
    }
  }

  /**
   * Create AI response cache key
   * Uses SHA-256 hash of prompt for consistent keys
   */
  private createAIKey(prompt: string): string {
    const hash = this.hashString(prompt)
    return `ai:response:${hash}`
  }

  /**
   * Create query cache key
   */
  private createQueryKey(query: string, params: any[]): string {
    const combined = `${query}:${JSON.stringify(params)}`
    const hash = this.hashString(combined)
    return `query:${hash}`
  }

  /**
   * Hash string for cache keys
   */
  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16)
  }
}

/**
 * Singleton instance
 */
let cacheService: CacheService | null = null

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService()
  }
  return cacheService
}

/**
 * Convenience functions
 */
export const cache = {
  get: <T>(key: string) => getCacheService().get<T>(key),
  set: <T>(key: string, value: T, ttl?: number) => getCacheService().set(key, value, ttl),
  getOrSet: <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => 
    getCacheService().getOrSet(key, fetcher, ttl),
  delete: (key: string) => getCacheService().delete(key),
  invalidate: (pattern: string) => getCacheService().invalidate(pattern),
  clear: () => getCacheService().clear()
}

/**
 * Example usage:
 * 
 * // Cache database query
 * const portals = await cache.getOrSet(
 *   `user:${userId}:portals`,
 *   async () => db.query('SELECT * FROM portals WHERE user_id = $1', [userId]),
 *   TTL.MEDIUM
 * )
 * 
 * // Cache AI response
 * const service = getCacheService()
 * const cached = await service.getCachedAIResponse(prompt)
 * if (!cached) {
 *   const response = await openai.chat.completions.create(...)
 *   await service.cacheAIResponse(prompt, response.choices[0].message.content)
 * }
 * 
 * // Invalidate user cache on update
 * await cache.invalidate(`user:${userId}:*`)
 */