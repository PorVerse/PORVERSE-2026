import * as Sentry from '@sentry/nextjs';

import { env } from '@/lib/env';

let isInitialized = false;

export function initializeSentry() {
  if (isInitialized || !env.analytics.sentry.enabled) {
    return;
  }

  Sentry.init({
    dsn: env.analytics.sentry.dsn,
    environment: env.app.env,
    tracesSampleRate: env.app.isProduction ? 0.1 : 1.0,
    debug: env.app.isDevelopment,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Remove problematic integrations that may not be available
    // These can be added back if needed with proper feature detection
  });

  isInitialized = true;
}
