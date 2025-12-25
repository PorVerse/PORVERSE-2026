/**
 * Environment Variables Validation
 * Validare strictă pentru environment variables în producție
 */

import { z } from 'zod'

// ============================================================================
// ENVIRONMENT SCHEMA
// ============================================================================

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Next.js
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Supabase (REQUIRED)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL'
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // AI Services
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  // Upstash Redis (REQUIRED pentru rate limiting în producție)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Security
  CSRF_SECRET: z.string().min(32, {
    message: 'CSRF_SECRET must be at least 32 characters in production'
  }).optional(),

  // Optional Services
  RESEND_API_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
})

// ============================================================================
// PRODUCTION REQUIREMENTS
// ============================================================================

const productionRequirements = z.object({
  CSRF_SECRET: z.string().min(32),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
})

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Parsed și validated environment variables
 */
export let env: z.infer<typeof envSchema> = process.env as z.infer<typeof envSchema>

/**
 * Validate environment variables
 */
export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    // Parse environment
    env = envSchema.parse(process.env)

    // Additional production checks
    if (isProduction) {
      const prodEnv = {
        CSRF_SECRET: process.env.CSRF_SECRET,
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      }

      productionRequirements.parse(prodEnv)

      if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
        console.warn('⚠️  WARNING: No AI API keys configured in production')
      }
    }

    console.log('✅ Environment variables validated successfully')
    return env

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })

      if (isProduction) {
        throw new Error('Invalid environment configuration. Check logs above.')
      } else {
        console.warn('⚠️  Some environment variables are missing or invalid')
        console.warn('⚠️  Application may not function correctly')
      }
    }
    throw error
  }
}

/**
 * Runtime environment check helper
 */
export function requireEnv(key: keyof typeof env): string {
  const value = env[key]
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`)
  }
  return value as string
}

/**
 * Get environment variable (backward compatibility)
 */
export function getEnv(key: string): string {
  return process.env[key] || ''
}

/**
 * Check if environment variable exists (backward compatibility)
 */
export function hasEnv(key: string): boolean {
  return key in process.env && !!process.env[key]
}

/**
 * Check dacă suntem în producție
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

/**
 * Check dacă suntem în development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

// ============================================================================
// AUTO-VALIDATE ON IMPORT (Server-side only)
// ============================================================================

if (typeof window === 'undefined') {
  // Skip validation during build phase
  const isBuildTime = process.argv.includes('build') || 
                      process.env.NEXT_PHASE === 'phase-production-build'
  
  if (!isBuildTime) {
    try {
      validateEnv()
    } catch (error) {
      console.error('Failed to validate environment on startup')
      if (process.env.NODE_ENV === 'production') {
        process.exit(1)
      }
    }
  } else {
    // Use raw process.env during build
    env = process.env as z.infer<typeof envSchema>
  }
}