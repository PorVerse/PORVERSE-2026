// ===============================================
// File: lib/telemetry/logger.ts
// Lightweight structured logger with batching, redaction & browser error capture
// ===============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerOptions {
  appVersion?: string
  environment?: string
  userIdProvider?: () => string | undefined
  endpointUrl?: string // e.g., '/api/telemetry/logs' (optional)
  enableConsole?: boolean
  captureGlobalErrors?: boolean
  batchMax?: number
  flushIntervalMs?: number
  redactKeys?: string[] // keys to scrub in context payloads
}

export interface LogEvent {
  level: LogLevel
  message: string
  ts: string
  ctx?: Record<string, unknown>
  err?: { name?: string; message?: string; stack?: string }
  app?: { version?: string; env?: string }
  user?: { id?: string }
}

const DEFAULTS: Required<
  Pick<
    LoggerOptions,
    'enableConsole' | 'batchMax' | 'flushIntervalMs' | 'redactKeys' | 'captureGlobalErrors'
  >
> = {
  enableConsole: true,
  batchMax: 20,
  flushIntervalMs: 3000,
  redactKeys: ['authorization', 'password', 'token', 'apiKey', 'secret'],
  captureGlobalErrors: true,
}

export class Logger {
  private static _instance: Logger | null = null
  static get instance() {
    if (!Logger._instance) {Logger._instance = new Logger()}
    return Logger._instance
  }

  private opts: LoggerOptions = { ...DEFAULTS }
  private queue: LogEvent[] = []
  private timer: number | null = null

  configure(opts: LoggerOptions) {
    this.opts = { ...DEFAULTS, ...opts }
    if (this.opts.captureGlobalErrors) {this.installGlobalHandlers()}
    this.ensureTimer()
  }

  private ensureTimer() {
    if (typeof window === 'undefined') {return}
    if (this.timer != null) {return}
    this.timer = window.setInterval(() => {
      this.flush().catch(() => void 0)
    }, this.opts.flushIntervalMs ?? DEFAULTS.flushIntervalMs)
  }

  private redact(obj?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!obj) {return obj}
    const keys = new Set((this.opts.redactKeys ?? DEFAULTS.redactKeys).map((k) => k.toLowerCase()))
    const walk = (v: unknown): unknown => {
      if (Array.isArray(v)) {return v.map(walk)}
      if (v && typeof v === 'object') {
        const out: Record<string, unknown> = {}
        for (const [k, val] of Object.entries(v)) {
          out[k] = keys.has(k.toLowerCase()) ? '[REDACTED]' : walk(val)
        }
        return out
      }
      return v
    }
    return walk(obj) as Record<string, unknown>
  }

  private baseEvent(level: LogLevel, message: string, ctx?: Record<string, unknown>, error?: unknown): LogEvent {
    const err = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : undefined
    return {
      level,
      message,
      ts: new Date().toISOString(),
      ctx: this.redact(ctx),
      err,
      app: { version: this.opts.appVersion, env: this.opts.environment },
      user: { id: this.opts.userIdProvider?.() },
    }
  }

  private consoleEmit(evt: LogEvent) {
    if (!this.opts.enableConsole) {return}
    const line = `[${evt.level.toUpperCase()}] ${evt.message}`
    const payload = { ts: evt.ts, ctx: evt.ctx, err: evt.err, user: evt.user }
    switch (evt.level) {
      case 'debug': console.debug?.(line, payload); break
      case 'info': console.info?.(line, payload); break
      case 'warn': console.warn?.(line, payload); break
      case 'error': console.error?.(line, payload); break
    }
  }

  private enqueue(evt: LogEvent) {
    this.queue.push(evt)
    if (this.queue.length >= (this.opts.batchMax ?? DEFAULTS.batchMax)) {
      this.flush().catch(() => void 0)
    }
    this.consoleEmit(evt)
  }

  debug(message: string, ctx?: Record<string, unknown>) { this.enqueue(this.baseEvent('debug', message, ctx)) }
  info(message: string, ctx?: Record<string, unknown>) { this.enqueue(this.baseEvent('info', message, ctx)) }
  warn(message: string, ctx?: Record<string, unknown>) { this.enqueue(this.baseEvent('warn', message, ctx)) }
  error(message: string, error?: unknown, ctx?: Record<string, unknown>) { this.enqueue(this.baseEvent('error', message, ctx, error)) }

  async flush(): Promise<void> {
    if (!this.queue.length) {return}
    const batch = this.queue.splice(0, this.queue.length)
    const endpoint = this.opts.endpointUrl

    if (!endpoint || typeof window === 'undefined') {return}

    try {
      const payload = JSON.stringify({ logs: batch })
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

  private installGlobalHandlers() {
    if (typeof window === 'undefined') {return}
    const anyWin = window as any
    if (anyWin.__porverseLoggerInstalled) {return}
    anyWin.__porverseLoggerInstalled = true

    window.addEventListener('error', (ev) => {
      const err = (ev as any)?.error instanceof Error ? (ev as any).error : new Error((ev as any)?.message || 'UnhandledError')
      this.error('window.error', err, {
        source: (ev as any)?.filename,
        lineno: (ev as any)?.lineno,
        colno: (ev as any)?.colno,
      })
    })

    window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
      const reason: unknown = ev?.reason
      const err = reason instanceof Error ? reason : new Error(typeof reason === 'string' ? reason : 'UnhandledRejection')
      this.error('window.unhandledrejection', err)
    })
  }
}

export const logger = Logger.instance
export function setupLogger(opts: LoggerOptions) { logger.configure(opts) }
