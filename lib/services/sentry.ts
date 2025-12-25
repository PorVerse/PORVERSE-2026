import * as Sentry from '@sentry/nextjs'
import { env, isDevelopment, isProduction } from '@/lib/env'

let isInitialized = false

export function initSentry() {
  // Skip dacă nu avem SENTRY_DSN sau dacă e deja inițializat
  if (isInitialized || !env.SENTRY_DSN) {
    return
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: isProduction() ? 0.1 : 1.0,
    debug: isDevelopment(),
    
    beforeSend(event) {
      // Nu trimite PII în producție
      if (isProduction()) {
        delete event.user
        delete event.request?.cookies
      }
      return event
    },
  })

  isInitialized = true
}

export { Sentry }