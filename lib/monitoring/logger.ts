/**
 * Structured Logging Service
 * SUPER ENTERPRISE INTERSTELLAR Level
 * 
 * Features:
 * - Structured JSON logging
 * - Log levels (debug, info, warn, error)
 * - Context enrichment
 * - Sensitive data redaction
 * - Pretty printing in development
 * - Machine-parseable in production
 */

import pino from 'pino'

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Pino logger instance
 */
export const logger = pino({
  // Log level from environment
  level: process.env['LOG_LEVEL'] || 'info',

  // Base metadata (included in all logs)
  base: {
    service: 'porverse-api',
    version: process.env['APP_VERSION'] || '2.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  },

  // Redact sensitive fields (CRITICAL for security)
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'api_key',
      'secret',
      'authorization',
      'cookie',
      'session',
      'ssn',
      'credit_card',
      '*.password',
      '*.token',
      '*.apiKey',
      '*.api_key',
      '*.secret',
      'req.headers.authorization',
      'req.headers.cookie',
      'biometric_data',
      'encrypted_data'
    ],
    censor: '[REDACTED]',
    remove: false // Keep structure, just redact values
  },

  // Timestamp formatting
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // Pretty printing for development
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
      levelFirst: true
    }
  } : undefined,

  // Error serialization
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
})

/**
 * Create child logger with additional context
 * Use this to add persistent context to logs
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context)
}

/**
 * Logger interface for type safety
 */
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string | Error, meta?: Record<string, any>): void
  fatal(message: string | Error, meta?: Record<string, any>): void
}

/**
 * Structured logger class
 * Provides type-safe logging with context
 */
export class StructuredLogger implements Logger {
  private logger: pino.Logger

  constructor(context?: Record<string, any>) {
    this.logger = context ? createLogger(context) : logger
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(meta || {}, message)
  }

  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(meta || {}, message)
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(meta || {}, message)
  }

  error(message: string | Error, meta?: Record<string, any>): void {
    if (message instanceof Error) {
      this.logger.error({ err: message, ...meta }, message.message)
    } else {
      this.logger.error(meta || {}, message)
    }
  }

  fatal(message: string | Error, meta?: Record<string, any>): void {
    if (message instanceof Error) {
      this.logger.fatal({ err: message, ...meta }, message.message)
    } else {
      this.logger.fatal(meta || {}, message)
    }
  }

  /**
   * Add permanent context to logger
   */
  withContext(context: Record<string, any>): StructuredLogger {
    return new StructuredLogger({
      ...this.logger.bindings(),
      ...context
    })
  }
}

/**
 * Request logger middleware
 * Logs all HTTP requests with timing
 */
export function logRequest(
  request: Request,
  response: Response,
  duration: number
): void {
  const log = createLogger({
    component: 'http',
    method: request.method,
    url: request.url,
    status: response.status,
    duration_ms: duration
  })

  const level = response.status >= 500 ? 'error' :
                response.status >= 400 ? 'warn' : 'info'

  log[level](`${request.method} ${request.url} ${response.status} ${duration}ms`)
}

/**
 * Database query logger
 */
export function logQuery(
  query: string,
  params: unknown[],
  duration: number,
  rowCount?: number
): void {
  logger.debug({
    component: 'database',
    query,
    params,
    duration_ms: duration,
    row_count: rowCount
  }, 'Database query executed')
}

/**
 * AI API call logger
 */
export function logAICall(
  provider: 'openai' | 'anthropic',
  model: string,
  tokens: number,
  cost: number,
  duration: number
): void {
  logger.info({
    component: 'ai',
    provider,
    model,
    tokens,
    cost_usd: cost,
    duration_ms: duration
  }, `AI API call: ${provider}/${model}`)
}

/**
 * Biometric event logger
 */
export function logBiometric(
  userId: string,
  event: 'scan' | 'consent' | 'revoke',
  metadata?: Record<string, any>
): void {
  logger.info({
    component: 'biometric',
    user_id: userId,
    event,
    ...metadata
  }, `Biometric event: ${event}`)
}

/**
 * Portal event logger
 */
export function logPortalEvent(
  userId: string,
  portalId: string,
  event: 'unlock' | 'complete' | 'progress',
  metadata?: Record<string, any>
): void {
  logger.info({
    component: 'portal',
    user_id: userId,
    portal_id: portalId,
    event,
    ...metadata
  }, `Portal event: ${event}`)
}

/**
 * Security event logger
 * CRITICAL: All security events must be logged
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata: Record<string, any>
): void {
  const level = severity === 'critical' ? 'error' :
                severity === 'high' ? 'warn' : 'info'

  logger[level]({
    component: 'security',
    event,
    severity,
    ...metadata
  }, `Security event: ${event}`)
}

/**
 * Performance logger
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  const level = duration > 1000 ? 'warn' : 'debug'

  logger[level]({
    component: 'performance',
    operation,
    duration_ms: duration,
    ...metadata
  }, `Performance: ${operation} took ${duration}ms`)
}

/**
 * Cache event logger
 */
export function logCache(
  operation: 'hit' | 'miss' | 'set' | 'delete' | 'invalidate',
  key: string,
  metadata?: Record<string, any>
): void {
  logger.debug({
    component: 'cache',
    operation,
    key,
    ...metadata
  }, `Cache ${operation}: ${key}`)
}

/**
 * Audit logger (immutable logs for compliance)
 */
export function logAudit(
  userId: string,
  action: string,
  resource: string,
  result: 'success' | 'failure',
  metadata?: Record<string, any>
): void {
  logger.info({
    component: 'audit',
    user_id: userId,
    action,
    resource,
    result,
    ip_address: metadata?.['ip_address'],
    user_agent: metadata?.['user_agent'],
    ...metadata
  }, `Audit: ${action} on ${resource} - ${result}`)
}

/**
 * Example usage:
 * 
 * // Basic logging
 * logger.info('Application started')
 * logger.error(new Error('Something went wrong'))
 * 
 * // With context
 * const log = createLogger({ userId: '123', component: 'PortalManager' })
 * log.info('Portal unlocked', { portalId: 'abc' })
 * 
 * // Structured logger
 * const structuredLog = new StructuredLogger({ service: 'auth' })
 * structuredLog.info('User logged in', { userId: '123' })
 * 
 * // Specialized loggers
 * logAICall('openai', 'gpt-4', 500, 0.01, 1500)
 * logSecurityEvent('failed_login', 'medium', { userId: '123', attempts: 3 })
 * logAudit('user-123', 'DELETE', 'portal-456', 'success')
 */