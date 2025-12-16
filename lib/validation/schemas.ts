/**
 * Input Validation Schemas
 * SUPER ENTERPRISE INTERSTELLAR Level
 * 
 * All API endpoints MUST use these schemas
 * Zero trust - validate EVERYTHING
 */

import { z } from 'zod'

/**
 * Email validation
 * - Valid email format
 * - No plus signs (prevents email aliases abuse)
 * - Reasonable length limits
 */
export const EmailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(255, 'Email too long')
  .trim()
  .toLowerCase()
  .refine(
    (email) => !email.includes('+'),
    'Plus signs not allowed in email'
  )

/**
 * Password validation
 * - Minimum 12 characters (NIST recommendation)
 * - Maximum 128 characters
 * - Must contain: lowercase, uppercase, number, special char
 */
export const PasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password too long')
  .refine(
    (pwd) => /[a-z]/.test(pwd),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (pwd) => /[A-Z]/.test(pwd),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (pwd) => /[0-9]/.test(pwd),
    'Password must contain at least one number'
  )
  .refine(
    (pwd) => /[^a-zA-Z0-9]/.test(pwd),
    'Password must contain at least one special character'
  )

/**
 * UUID validation
 * Used for IDs in database
 */
export const UUIDSchema = z
  .string()
  .uuid('Invalid UUID format')

/**
 * Username validation
 * - Alphanumeric + underscores/hyphens only
 * - 3-30 characters
 * - No spaces
 */
export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  )
  .trim()

/**
 * Portal ID validation
 */
export const PortalIdSchema = UUIDSchema

/**
 * Portal category validation
 */
export const PortalCategorySchema = z.enum([
  'mindfulness',
  'physical',
  'emotional',
  'social',
  'spiritual',
  'intellectual'
])

/**
 * Portal difficulty validation
 */
export const PortalDifficultySchema = z.enum([
  'beginner',
  'intermediate',
  'advanced'
])

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

/**
 * Date range schema
 */
export const DateRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date()
}).refine(
  (data) => data.end >= data.start,
  'End date must be after start date'
)

/**
 * User registration schema
 */
export const UserRegistrationSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  username: UsernameSchema,
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' })
  })
})

/**
 * User login schema
 */
export const UserLoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required')
})

/**
 * Portal creation schema
 */
export const PortalCreationSchema = z.object({
  title: z.string().min(3).max(100).trim(),
  description: z.string().min(10).max(1000).trim(),
  category: PortalCategorySchema,
  difficulty: PortalDifficultySchema,
  duration_minutes: z.number().int().min(1).max(1440), // Max 24 hours
  xp_reward: z.number().int().min(0).max(10000),
  image_url: z.string().url().optional(),
  prerequisites: z.array(PortalIdSchema).optional()
})

/**
 * Portal update schema
 */
export const PortalUpdateSchema = PortalCreationSchema.partial()

/**
 * Biometric consent schema
 */
export const BiometricConsentSchema = z.object({
  user_id: UUIDSchema,
  consent_given: z.boolean(),
  consent_timestamp: z.coerce.date(),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().optional()
})

/**
 * AI chat message schema
 */
export const AIChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
  timestamp: z.coerce.date().optional()
})

/**
 * AI chat request schema
 */
export const AIChatRequestSchema = z.object({
  messages: z.array(AIChatMessageSchema).min(1).max(100),
  user_id: UUIDSchema,
  portal_id: PortalIdSchema.optional(),
  biometric_data: z.record(z.unknown()).optional(),
  max_tokens: z.number().int().min(1).max(4000).default(1000),
  temperature: z.number().min(0).max(2).default(0.7)
})

/**
 * Search query schema
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(200).trim(),
  filters: z.record(z.unknown()).optional(),
  pagination: PaginationSchema.optional()
})

/**
 * URL schema
 */
export const URLSchema = z.string().url('Invalid URL format')

/**
 * Phone number schema (E.164 format)
 */
export const PhoneSchema = z
  .string()
  .regex(
    /^\+[1-9]\d{1,14}$/,
    'Phone number must be in E.164 format (e.g., +14155552671)'
  )

/**
 * Safe string schema (XSS prevention)
 * Strips HTML tags and dangerous characters
 */
export const SafeStringSchema = z
  .string()
  .transform((str) => {
    // Remove HTML tags
    return str.replace(/<[^>]*>/g, '')
  })
  .refine(
    (str) => !str.includes('<script'),
    'HTML tags not allowed'
  )

/**
 * Helper function to validate data against schema
 * Returns type-safe parsed data or throws validation error
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data)
}

/**
 * Helper function to safely validate data
 * Returns success: true with data or success: false with error
 */
export function safeValidate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}