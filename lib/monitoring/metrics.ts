/**
 * Metrics Collection Service
 * SUPER ENTERPRISE INTERSTELLAR Level
 * 
 * Features:
 * - Counter metrics (increments)
 * - Gauge metrics (current values)
 * - Histogram metrics (distributions)
 * - Timing metrics (durations)
 * - Tags/labels support
 * - Business metrics tracking
 */

import { StatsD } from 'node-statsd'
import { getEnv } from '@/lib/env'

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMING = 'timing'
}

/**
 * Metrics Service using StatsD
 */
export class MetricsService {
  private statsd: StatsD
  private prefix: string

  constructor(prefix = 'porverse') {
    this.prefix = prefix
    this.statsd = new StatsD({
      host: getEnv('STATSD_HOST'),
      port: getEnv('STATSD_PORT'),
      prefix: `${this.prefix}.`,
      cacheDns: true,
      mock: process.env['NODE_ENV'] === 'test' // Mock in tests
    })
  }

  /**
   * Increment a counter metric
   * Use for: requests, events, errors
   */
  increment(metric: string, value = 1, tags?: Record<string, string>): void {
    this.statsd.increment(metric, value, this.formatTags(tags))
  }

  /**
   * Decrement a counter metric
   */
  decrement(metric: string, value = 1, tags?: Record<string, string>): void {
    this.statsd.decrement(metric, value, this.formatTags(tags))
  }

  /**
   * Set a gauge value
   * Use for: active users, queue size, memory usage
   */
  gauge(metric: string, value: number, tags?: Record<string, string>): void {
    this.statsd.gauge(metric, value, this.formatTags(tags))
  }

  /**
   * Record a histogram value
   * Use for: response sizes, batch sizes
   */
  histogram(metric: string, value: number, tags?: Record<string, string>): void {
    this.statsd.histogram(metric, value, this.formatTags(tags))
  }

  /**
   * Record timing (duration in milliseconds)
   * Use for: API response times, query durations
   */
  timing(metric: string, duration: number, tags?: Record<string, string>): void {
    this.statsd.timing(metric, duration, this.formatTags(tags))
  }

  /**
   * Time a function execution
   * Automatically records duration
   */
  async time<T>(
    metric: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = Date.now()

    try {
      const result = await fn()
      const duration = Date.now() - start

      this.timing(metric, duration, { ...tags, status: 'success' })
      return result
    } catch (error) {
      const duration = Date.now() - start

      this.timing(metric, duration, { ...tags, status: 'error' })
      this.increment(`${metric}.error`, 1, tags)

      throw error
    }
  }

  /**
   * Time a synchronous function
   */
  timeSync<T>(
    metric: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const start = Date.now()

    try {
      const result = fn()
      const duration = Date.now() - start

      this.timing(metric, duration, { ...tags, status: 'success' })
      return result
    } catch (error) {
      const duration = Date.now() - start

      this.timing(metric, duration, { ...tags, status: 'error' })
      this.increment(`${metric}.error`, 1, tags)

      throw error
    }
  }

  /**
   * Set multiple metrics at once
   */
  set(metrics: Record<string, number>, tags?: Record<string, string>): void {
    Object.entries(metrics).forEach(([metric, value]) => {
      this.gauge(metric, value, tags)
    })
  }

  /**
   * Close connection (cleanup)
   */
  close(): void {
    this.statsd.close()
  }

  /**
   * Format tags for StatsD
   * Converts { key: value } to ['key:value']
   */
  private formatTags(tags?: Record<string, string>): string[] {
    if (!tags) return []
    return Object.entries(tags).map(([key, value]) => `${key}:${value}`)
  }
}

/**
 * Singleton metrics instance
 */
let metricsService: MetricsService | null = null

export function getMetricsService(): MetricsService {
  if (!metricsService) {
    metricsService = new MetricsService()
  }
  return metricsService
}

/**
 * Convenience object for metrics
 */
export const metrics = {
  /**
   * HTTP Request metrics
   */
  http: {
    request(method: string, path: string, status: number, duration: number): void {
      const m = getMetricsService()
      m.increment('http.requests', 1, { method, status: status.toString() })
      m.timing('http.duration', duration, { method, status: status.toString() })
    },

    error(method: string, path: string, error: string): void {
      getMetricsService().increment('http.errors', 1, { method, error })
    }
  },

  /**
   * Database metrics
   */
  db: {
    query(duration: number, table?: string): void {
      const m = getMetricsService()
      m.timing('db.query.duration', duration, table ? { table } : undefined)
      m.increment('db.query.count', 1, table ? { table } : undefined)
    },

    error(error: string, table?: string): void {
      getMetricsService().increment('db.errors', 1, { error, table: table || 'unknown' })
    },

    connections(active: number): void {
      getMetricsService().gauge('db.connections.active', active)
    }
  },

  /**
   * Cache metrics
   */
  cache: {
    hit(layer: 'memory' | 'redis'): void {
      getMetricsService().increment('cache.hits', 1, { layer })
    },

    miss(layer: 'memory' | 'redis'): void {
      getMetricsService().increment('cache.misses', 1, { layer })
    },

    set(layer: 'memory' | 'redis', duration: number): void {
      const m = getMetricsService()
      m.increment('cache.sets', 1, { layer })
      m.timing('cache.set.duration', duration, { layer })
    },

    size(layer: 'memory' | 'redis', size: number): void {
      getMetricsService().gauge('cache.size', size, { layer })
    }
  },

  /**
   * AI API metrics
   */
  ai: {
    request(provider: 'openai' | 'anthropic', model: string, duration: number): void {
      const m = getMetricsService()
      m.increment('ai.requests', 1, { provider, model })
      m.timing('ai.duration', duration, { provider, model })
    },

    tokens(provider: 'openai' | 'anthropic', model: string, tokens: number): void {
      getMetricsService().histogram('ai.tokens', tokens, { provider, model })
    },

    cost(provider: 'openai' | 'anthropic', model: string, cost: number): void {
      getMetricsService().histogram('ai.cost', cost, { provider, model })
    },

    error(provider: 'openai' | 'anthropic', error: string): void {
      getMetricsService().increment('ai.errors', 1, { provider, error })
    }
  },

  /**
   * Business metrics (Portal-specific)
   */
  portal: {
    unlock(category: string): void {
      getMetricsService().increment('portal.unlocks', 1, { category })
    },

    complete(category: string, duration: number): void {
      const m = getMetricsService()
      m.increment('portal.completions', 1, { category })
      m.histogram('portal.completion_time', duration, { category })
    },

    progress(category: string, percentage: number): void {
      getMetricsService().histogram('portal.progress', percentage, { category })
    }
  },

  /**
   * Biometric metrics
   */
  biometric: {
    scan(success: boolean, duration: number): void {
      const m = getMetricsService()
      m.increment('biometric.scans', 1, { status: success ? 'success' : 'failure' })
      m.timing('biometric.scan.duration', duration)
    },

    emotion(emotion: string): void {
      getMetricsService().increment('biometric.emotions', 1, { emotion })
    }
  },

  /**
   * User metrics
   */
  user: {
    login(method: 'email' | 'oauth', success: boolean): void {
      getMetricsService().increment('user.logins', 1, {
        method,
        status: success ? 'success' : 'failure'
      })
    },

    register(method: 'email' | 'oauth'): void {
      getMetricsService().increment('user.registrations', 1, { method })
    },

    active(count: number): void {
      getMetricsService().gauge('user.active', count)
    },

    sessions(count: number): void {
      getMetricsService().gauge('user.sessions.active', count)
    }
  },

  /**
   * Performance metrics
   */
  performance: {
    memory(bytes: number): void {
      getMetricsService().gauge('performance.memory', bytes)
    },

    cpu(percentage: number): void {
      getMetricsService().gauge('performance.cpu', percentage)
    }
  },

  /**
   * Security metrics
   */
  security: {
    rateLimit(exceeded: boolean): void {
      getMetricsService().increment('security.rate_limit', 1, {
        status: exceeded ? 'exceeded' : 'ok'
      })
    },

    authFailure(reason: string): void {
      getMetricsService().increment('security.auth_failures', 1, { reason })
    },

    invalidInput(type: string): void {
      getMetricsService().increment('security.invalid_input', 1, { type })
    }
  }
}

/**
 * Example usage:
 * 
 * // Track HTTP request
 * metrics.http.request('GET', '/api/portals', 200, 45)
 * 
 * // Track database query
 * await metrics.db.query(23, 'portals')
 * 
 * // Track AI API call
 * metrics.ai.request('openai', 'gpt-4', 1500)
 * metrics.ai.tokens('openai', 'gpt-4', 500)
 * metrics.ai.cost('openai', 'gpt-4', 0.01)
 * 
 * // Track business events
 * metrics.portal.unlock('mindfulness')
 * metrics.portal.complete('mindfulness', 3600000) // 1 hour
 * 
 * // Track cache
 * metrics.cache.hit('redis')
 * metrics.cache.miss('memory')
 * 
 * // Time an operation
 * const m = getMetricsService()
 * await m.time('api.portals.list', async () => {
 *   return await getPortals()
 * }, { userId: '123' })
 */