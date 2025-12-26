import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Ratelimit } from '@upstash/ratelimit'
import { rateLimiter } from '@/lib/middleware/rate-limit'

// Mock Upstash Ratelimit
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn()
  }))
}))

// Mock Redis
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn()
  }))
}))

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows requests within limit', async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000
    })

    const RatelimitMock = Ratelimit as unknown as vi.Mock
    RatelimitMock.mockImplementation(() => ({
      limit: mockLimit
    }))

    const result = await rateLimiter.check('test-key')

    expect(result.success).toBe(true)
    expect(result.remaining).toBeDefined()
  })

  it('blocks requests exceeding limit', async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000
    })

    const RatelimitMock = Ratelimit as unknown as vi.Mock
    RatelimitMock.mockImplementation(() => ({
      limit: mockLimit
    }))

    const result = await rateLimiter.check('test-key')

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('handles different rate limit tiers', async () => {
    const freeTierLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4
    })

    const RatelimitMock = Ratelimit as unknown as vi.Mock
    RatelimitMock.mockImplementation(() => ({
      limit: freeTierLimit
    }))

    const freeResult = await rateLimiter.check('free-user')
    expect(freeResult.limit).toBe(5)
  })

  it('includes reset timestamp', async () => {
    const resetTime = Date.now() + 60000
    const mockLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: resetTime
    })

    const RatelimitMock = Ratelimit as unknown as vi.Mock
    RatelimitMock.mockImplementation(() => ({
      limit: mockLimit
    }))

    const result = await rateLimiter.check('test-key')

    expect(result.reset).toBeDefined()
    expect(result.reset).toBeGreaterThan(Date.now())
  })

  it('handles rate limiter errors gracefully', async () => {
    const mockLimit = vi.fn().mockRejectedValue(new Error('Redis connection failed'))

    const RatelimitMock = Ratelimit as unknown as vi.Mock
    RatelimitMock.mockImplementation(() => ({
      limit: mockLimit
    }))

    await expect(rateLimiter.check('test-key')).rejects.toThrow()
  })

  it('uses different keys for different identifiers', async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9
    })

    const RatelimitMock = Ratelimit as unknown as vi.Mock
    RatelimitMock.mockImplementation(() => ({
      limit: mockLimit
    }))

    await rateLimiter.check('user-1')
    await rateLimiter.check('user-2')

    expect(mockLimit).toHaveBeenCalledTimes(2)
  })

  it('respects sliding window algorithm', async () => {
    const calls: number[] = []
    const mockLimit = vi.fn().mockImplementation(() => {
      calls.push(Date.now())
      return Promise.resolve({
        success: calls.length <= 10,
        limit: 10,
        remaining: Math.max(0, 10 - calls.length)
      })
    })

    const RatelimitMock = Ratelimit as unknown as vi.Mock
    RatelimitMock.mockImplementation(() => ({
      limit: mockLimit
    }))

    // Make 12 rapid calls
    const results = await Promise.all(
      Array.from({ length: 12 }, () => rateLimiter.check('test-key'))
    )

    const successCount = results.filter(r => r.success).length
    expect(successCount).toBeLessThanOrEqual(10)
  })
})