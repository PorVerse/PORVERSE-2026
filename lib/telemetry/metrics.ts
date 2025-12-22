// ===============================================
// File: lib/telemetry/metrics.ts
// Lightweight metrics registry: counters, gauges, histograms, timers + flush
// ===============================================

type NumberMap = Record<string, number>

export interface MetricsOptions {
  endpointUrl?: string // e.g., '/api/telemetry/metrics'
  flushIntervalMs?: number
  enableConsole?: boolean
}

export interface MetricsSnapshot {
  ts: string
  counters: NumberMap
  gauges: NumberMap
  histograms: Record<string, { count: number; sum: number; min: number; max: number }>
}

class MetricsRegistry {
  private counters: NumberMap = {}
  private gauges: NumberMap = {}
  private histos: Record<string, { count: number; sum: number; min: number; max: number }> = {}
  private opts: Required<MetricsOptions> = { endpointUrl: '', flushIntervalMs: 5000, enableConsole: false }
  private timer: number | null = null

  configure(opts: MetricsOptions) {
    this.opts = { ...this.opts, ...opts }
    this.ensureTimer()
  }

  private ensureTimer() {
    if (typeof window === 'undefined') {return}
    if (this.timer != null) {return}
    this.timer = window.setInterval(() => { this.flush().catch(() => void 0) }, this.opts.flushIntervalMs)
  }

  inc(name: string, by = 1) { this.counters[name] = (this.counters[name] || 0) + by; this.debug('counter', name, by) }
  set(name: string, value: number) { this.gauges[name] = value; this.debug('gauge', name, value) }
  observe(name: string, value: number) {
    const h = (this.histos[name] ||= { count: 0, sum: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY })
    h.count++; h.sum += value; h.min = Math.min(h.min, value); h.max = Math.max(h.max, value)
    this.debug('histogram', name, value)
  }

  // Timer helpers
  time<T>(name: string, fn: () => T): T {
    const t = performance.now()
    try { return fn() } finally { this.observe(name, performance.now() - t) }
  }
  async timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const t = performance.now()
    try { return await fn() } finally { this.observe(name, performance.now() - t) }
  }

  snapshot(): MetricsSnapshot {
    return {
      ts: new Date().toISOString(),
      counters: { ...this.counters },
      gauges: { ...this.gauges },
      histograms: JSON.parse(JSON.stringify(this.histos)),
    }
  }

  clear() { this.counters = {}; this.gauges = {}; this.histos = {} }

  async flush() {
    const endpoint = this.opts.endpointUrl
    if (!endpoint || typeof window === 'undefined') {return}
    const payload = JSON.stringify({ metrics: this.snapshot() })

    try {
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const blob = new Blob([payload], { type: 'application/json' })
        const ok = (navigator as any).sendBeacon(endpoint, blob)
        if (ok) {return}
      }
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      })
    } catch {
      // swallow
    }
  }

  private debug(kind: string, name: string, value: number) {
    if (!this.opts.enableConsole) {return}
    // eslint-disable-next-line no-console
    console.debug(`[metrics:${kind}]`, name, value)
  }
}

export const metrics = new MetricsRegistry()
export function setupMetrics(opts: MetricsOptions) { metrics.configure(opts) }

export async function fetchWithMetrics(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts?: { metricName?: string }
) {
  const name = opts?.metricName || 'http.client.request.duration_ms'
  const t = performance.now()
  try {
    const res = await fetch(input, init)
    const ms = performance.now() - t
    metrics.observe(name, ms)
    metrics.inc(`http.client.status.${Math.floor(res.status / 100)}xx`)
    return res
  } catch (err) {
    const ms = performance.now() - t
    metrics.observe(name, ms)
    metrics.inc('http.client.error')
    throw err
  }
}
