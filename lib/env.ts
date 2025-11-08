// lib/env.ts
/**
 * 🔐 PorVerse V2 - Environment Variable Management
 * Type-safe environment variable access with validation
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Validates and provides type-safe access to environment variables
 */

// ============================================================================
// ENVIRONMENT VARIABLE DEFINITIONS
// ============================================================================

/**
 * Required environment variables that must be present for the app to work
 */
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
] as const

/**
 * Optional environment variables that enhance functionality but aren't required
 */
const optionalEnvVars = [
  // AI Services
  'ANTHROPIC_API_KEY',
  'OPENAI_ORG_ID',
  
  // Payment services
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_MODE',
  
  // Email service
  'RESEND_API_KEY',
  'RESEND_DOMAIN',
  
  // Cloudflare
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ZONE_ID',
  'CLOUDFLARE_ACCOUNT_ID',
  
  // Digital Ocean
  'DO_API_TOKEN',
  'DO_SPACES_KEY',
  'DO_SPACES_SECRET',
  'DO_SPACES_ENDPOINT',
  'DO_SPACES_BUCKET',
  
  // Analytics & monitoring
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
  'SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'MIXPANEL_PROJECT_TOKEN',
  'GOOGLE_ANALYTICS_ID',
  
  // Security
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'WEBHOOK_SECRET',
  'SESSION_SECRET',
  'CSRF_SECRET',
  'SUPABASE_JWT_SECRET',
  'SUPABASE_DB_PASSWORD',
  
  // Feature flags
  'NEXT_PUBLIC_ENABLE_BIOMETRIC',
  'NEXT_PUBLIC_ENABLE_QUANTUM_VAULT',
  'NEXT_PUBLIC_ENABLE_PAYMENTS',
  'NEXT_PUBLIC_ENABLE_AI_GUIDANCE',
  'NEXT_PUBLIC_ENABLE_OFFLINE_MODE',
  
  // AI Configuration
  'AI_CACHE_DURATION',
  'AI_MAX_TOKENS',
  'AI_TEMPERATURE',
  
  // Rate limiting
  'RATE_LIMIT_REQUESTS_PER_MINUTE',
  'RATE_LIMIT_AI_REQUESTS_PER_HOUR',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  
  // Development
  'NEXT_PUBLIC_DEBUG_MODE',
  'NEXT_PUBLIC_VERBOSE_LOGGING',
  'NEXT_PUBLIC_API_URL',
] as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RequiredEnvVar = typeof requiredEnvVars[number]
type OptionalEnvVar = typeof optionalEnvVars[number]
type AllEnvVar = RequiredEnvVar | OptionalEnvVar

/**
 * Environment validation error
 */
export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvironmentError'
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate that all required environment variables are present
 * @throws {EnvironmentError} If any required variables are missing
 */
export function validateEnvironment(): void {
  const missingVars: string[] = []
  const invalidVars: { key: string; reason: string }[] = []

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    
    if (!value) {
      missingVars.push(envVar)
    } else if (value.trim() === '') {
      invalidVars.push({ key: envVar, reason: 'Empty string' })
    } else if (value.includes('your_') || value.includes('_here') || value.includes('placeholder')) {
      invalidVars.push({ key: envVar, reason: 'Placeholder value not replaced' })
    }
  }

  // Validate URL format for Supabase
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
    } catch {
      invalidVars.push({ 
        key: 'NEXT_PUBLIC_SUPABASE_URL', 
        reason: 'Invalid URL format' 
      })
    }
  }

  // Build error message if there are issues
  if (missingVars.length > 0 || invalidVars.length > 0) {
    let errorMessage = '❌ Environment Variable Validation Failed!\n\n'

    if (missingVars.length > 0) {
      errorMessage += '📋 Missing Required Variables:\n'
      missingVars.forEach(v => {
        errorMessage += `   - ${v}\n`
      })
      errorMessage += '\n'
    }

    if (invalidVars.length > 0) {
      errorMessage += '⚠️  Invalid Variables:\n'
      invalidVars.forEach(({ key, reason }) => {
        errorMessage += `   - ${key}: ${reason}\n`
      })
      errorMessage += '\n'
    }

    errorMessage += '📝 How to fix:\n'
    errorMessage += '   1. Check your .env.local file\n'
    errorMessage += '   2. Fill in all required values\n'
    errorMessage += '   3. Replace placeholder values\n'
    errorMessage += '   4. Restart your development server\n\n'
    errorMessage += '📚 Documentation: See .env.example for details\n'

    throw new EnvironmentError(errorMessage)
  }

  // Success message in development
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGGING === 'true') {
    console.log('✅ Environment variables validated successfully')
  }
}

/**
 * Get environment variable with type safety
 */
export function getEnv(key: RequiredEnvVar): string
export function getEnv(key: OptionalEnvVar, defaultValue?: string): string | undefined
export function getEnv(key: AllEnvVar, defaultValue?: string): string | undefined {
  const value = process.env[key]
  
  // Required variable
  if (requiredEnvVars.includes(key as RequiredEnvVar)) {
    if (!value) {
      throw new EnvironmentError(
        `Required environment variable ${key} is not set. ` +
        `Please check your .env.local file.`
      )
    }
    return value
  }
  
  // Optional variable
  return value || defaultValue
}

/**
 * Check if an optional environment variable is available and valid
 */
export function hasEnv(key: OptionalEnvVar): boolean {
  const value = process.env[key]
  return !!value && value.trim() !== '' && !value.includes('placeholder')
}

/**
 * Get boolean environment variable
 */
export function getBooleanEnv(key: OptionalEnvVar, defaultValue = false): boolean {
  const value = process.env[key]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Get number environment variable
 */
export function getNumberEnv(key: OptionalEnvVar, defaultValue: number): number {
  const value = process.env[key]
  if (!value) return defaultValue
  const num = parseInt(value, 10)
  return isNaN(num) ? defaultValue : num
}

/**
 * Get float environment variable
 */
export function getFloatEnv(key: OptionalEnvVar, defaultValue: number): number {
  const value = process.env[key]
  if (!value) return defaultValue
  const num = parseFloat(value)
  return isNaN(num) ? defaultValue : num
}

// ============================================================================
// ENVIRONMENT CONFIGURATION OBJECT
// ============================================================================

/**
 * Type-safe environment configuration
 * All values are validated and ready to use
 */
export const env = {
  // ===== APPLICATION =====
  app: {
    url: getEnv(| 'NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    apiUrl: getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3000/api'),
    env: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },

  // ===== SUPABASE =====
  supabase: {
    url: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret: getEnv('SUPABASE_JWT_SECRET', ''),
    dbPassword: getEnv('SUPABASE_DB_PASSWORD', ''),
  },

  // ===== AI SERVICES =====
  ai: {
    openai: {
      apiKey: getEnv('OPENAI_API_KEY'),
      orgId: getEnv('OPENAI_ORG_ID', ''),
    },
    anthropic: {
      apiKey: getEnv('ANTHROPIC_API_KEY', ''),
      enabled: hasEnv('ANTHROPIC_API_KEY'),
    },
    config: {
      cacheDuration: getNumberEnv('AI_CACHE_DURATION', 3600),
      maxTokens: getNumberEnv('AI_MAX_TOKENS', 1500),
      temperature: getFloatEnv('AI_TEMPERATURE', 0.7),
    },
  },

  // ===== PAYMENT SERVICES =====
  stripe: {
    secretKey: getEnv('STRIPE_SECRET_KEY', ''),
    publishableKey: getEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', ''),
    webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET', ''),
    enabled: hasEnv('STRIPE_SECRET_KEY'),
  },

  paypal: {
    clientId: getEnv('PAYPAL_CLIENT_ID', ''),
    clientSecret: getEnv('PAYPAL_CLIENT_SECRET', ''),
    mode: (getEnv('PAYPAL_MODE', 'sandbox') as 'sandbox' | 'live'),
    enabled: hasEnv('PAYPAL_CLIENT_ID'),
  },

  // ===== EMAIL SERVICE =====
  email: {
    resend: {
      apiKey: getEnv('RESEND_API_KEY', ''),
      domain: getEnv('RESEND_DOMAIN', 'localhost'),
      enabled: hasEnv('RESEND_API_KEY'),
    },
  },

  // ===== CLOUDFLARE =====
  cloudflare: {
    apiToken: getEnv('CLOUDFLARE_API_TOKEN', ''),
    zoneId: getEnv('CLOUDFLARE_ZONE_ID', ''),
    accountId: getEnv('CLOUDFLARE_ACCOUNT_ID', ''),
    enabled: hasEnv('CLOUDFLARE_API_TOKEN'),
  },

  // ===== DIGITAL OCEAN =====
  digitalOcean: {
    apiToken: getEnv('DO_API_TOKEN', ''),
    spaces: {
      key: getEnv('DO_SPACES_KEY', ''),
      secret: getEnv('DO_SPACES_SECRET', ''),
      endpoint: getEnv('DO_SPACES_ENDPOINT', 'sfo3.digitaloceanspaces.com'),
      bucket: getEnv('DO_SPACES_BUCKET', 'porverse-storage'),
    },
    enabled: hasEnv('DO_API_TOKEN'),
  },

  // ===== ANALYTICS =====
  analytics: {
    posthog: {
      key: getEnv('NEXT_PUBLIC_POSTHOG_KEY', ''),
      host: getEnv('NEXT_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com'),
      enabled: hasEnv('NEXT_PUBLIC_POSTHOG_KEY'),
    },
    sentry: {
      dsn: getEnv('SENTRY_DSN', ''),
      authToken: getEnv('SENTRY_AUTH_TOKEN', ''),
      enabled: hasEnv('SENTRY_DSN'),
    },
    mixpanel: {
      projectToken: getEnv('MIXPANEL_PROJECT_TOKEN', ''),
      enabled: hasEnv('MIXPANEL_PROJECT_TOKEN'),
    },
    googleAnalytics: {
      id: getEnv('GOOGLE_ANALYTICS_ID', ''),
      enabled: hasEnv('GOOGLE_ANALYTICS_ID'),
    },
  },

  // ===== SECURITY =====
  security: {
    jwtSecret: getEnv('JWT_SECRET', 'change-this-in-production'),
    encryptionKey: getEnv('ENCRYPTION_KEY', ''),
    webhookSecret: getEnv('WEBHOOK_SECRET', ''),
    sessionSecret: getEnv('SESSION_SECRET', ''),
    csrfSecret: getEnv('CSRF_SECRET', ''),
  },

  // ===== FEATURE FLAGS =====
  features: {
    biometric: getBooleanEnv('NEXT_PUBLIC_ENABLE_BIOMETRIC', false),
    quantumVault: getBooleanEnv('NEXT_PUBLIC_ENABLE_QUANTUM_VAULT', false),
    payments: getBooleanEnv('NEXT_PUBLIC_ENABLE_PAYMENTS', false),
    aiGuidance: getBooleanEnv('NEXT_PUBLIC_ENABLE_AI_GUIDANCE', true),
    offlineMode: getBooleanEnv('NEXT_PUBLIC_ENABLE_OFFLINE_MODE', true),
  },

  // ===== RATE LIMITING =====
  rateLimit: {
    requestsPerMinute: getNumberEnv('RATE_LIMIT_REQUESTS_PER_MINUTE', 60),
    aiRequestsPerHour: getNumberEnv('RATE_LIMIT_AI_REQUESTS_PER_HOUR', 100),
    windowMs: getNumberEnv('RATE_LIMIT_WINDOW_MS', 900000),
    maxRequests: getNumberEnv('RATE_LIMIT_MAX_REQUESTS', 1000),
  },

  // ===== DEVELOPMENT =====
  dev: {
    debugMode: getBooleanEnv('NEXT_PUBLIC_DEBUG_MODE', false),
    verboseLogging: getBooleanEnv('NEXT_PUBLIC_VERBOSE_LOGGING', false),
  },
} as const

// ============================================================================
// VALIDATION ON MODULE LOAD
// ============================================================================

/**
 * Validate environment on module load (server-side only)
 */
if (typeof window === 'undefined') {
  try {
    validateEnvironment()
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error(error.message)
      process.exit(1)
    }
    throw error
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Print environment configuration (safe for logging)
 * Masks sensitive values
 */
export function printEnvironmentInfo(): void {
  if (typeof window !== 'undefined') {
    console.warn('printEnvironmentInfo() should only be called server-side')
    return
  }

  const maskValue = (value: string): string => {
    if (!value || value.length < 8) return '****'
    return value.slice(0, 4) + '****' + value.slice(-4)
  }

  console.log('\n📋 PorVerse V2 - Environment Configuration:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`🌍 Environment: ${env.app.env}`)
  console.log(`🔗 App URL: ${env.app.url}`)
  console.log(`\n🗄️  Supabase:`)
  console.log(`   URL: ${env.supabase.url}`)
  console.log(`   Anon Key: ${maskValue(env.supabase.anonKey)}`)
  console.log(`\n🤖 AI Services:`)
  console.log(`   OpenAI: ${maskValue(env.ai.openai.apiKey)}`)
  console.log(`   Anthropic: ${env.ai.anthropic.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`\n💳 Payments:`)
  console.log(`   Stripe: ${env.stripe.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`   PayPal: ${env.paypal.enabled ? `✅ Enabled (${env.paypal.mode})` : '❌ Disabled'}`)
  console.log(`\n📧 Email:`)
  console.log(`   Resend: ${env.email.resend.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`\n☁️  Cloud Services:`)
  console.log(`   Cloudflare: ${env.cloudflare.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`   Digital Ocean: ${env.digitalOcean.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`\n📊 Analytics:`)
  console.log(`   PostHog: ${env.analytics.posthog.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`   Sentry: ${env.analytics.sentry.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`   Mixpanel: ${env.analytics.mixpanel.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`   Google Analytics: ${env.analytics.googleAnalytics.enabled ? '✅ Enabled' : '❌ Disabled'}`)
  console.log(`\n🎯 Feature Flags:`)
  console.log(`   Biometric: ${env.features.biometric ? '✅' : '❌'}`)
  console.log(`   Quantum Vault: ${env.features.quantumVault ? '✅' : '❌'}`)
  console.log(`   Payments: ${env.features.payments ? '✅' : '❌'}`)
  console.log(`   AI Guidance: ${env.features.aiGuidance ? '✅' : '❌'}`)
  console.log(`   Offline Mode: ${env.features.offlineMode ? '✅' : '❌'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

/**
 * Check if all required services are configured
 */
export function checkServiceHealth(): {
  healthy: boolean
  services: Record<string, boolean>
  warnings: string[]
} {
  const services = {
    supabase: !!env.supabase.url && !!env.supabase.anonKey,
    openai: !!env.ai.openai.apiKey,
    anthropic: env.ai.anthropic.enabled,
    stripe: env.stripe.enabled,
    paypal: env.paypal.enabled,
    email: env.email.resend.enabled,
    cloudflare: env.cloudflare.enabled,
    digitalOcean: env.digitalOcean.enabled,
    posthog: env.analytics.posthog.enabled,
    sentry: env.analytics.sentry.enabled,
  }

  const requiredServices = ['supabase', 'openai']
  const healthy = requiredServices.every(service => services[service as keyof typeof services])

  const warnings: string[] = []
  if (!env.ai.anthropic.enabled) {
    warnings.push('Anthropic API not configured - AI features will be limited')
  }
  if (!env.stripe.enabled && !env.paypal.enabled) {
    warnings.push('No payment provider configured - payments disabled')
  }
  if (!env.email.resend.enabled) {
    warnings.push('Email service not configured - email features disabled')
  }

  return { healthy, services, warnings }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { RequiredEnvVar, OptionalEnvVar, AllEnvVar }

export default env