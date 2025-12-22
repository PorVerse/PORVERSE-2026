/**
 * 📦 PorVerse V2 - Types Index
 * Central export point for all TypeScript types
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Single import point for all types across the application
 */

// ============================================================================
// PORTAL MANAGEMENT TYPES
// ============================================================================

export type {
  // Core Portal Types
  Portal,
  PortalStep,
  UserPortalProgress,
  UserStepProgress,
  PortalSession,
  
  // Achievement Types
  Achievement,
  UserAchievement,
  
  // Biometric Types
  BiometricReading,
  BiometricType,
  BiometricValues,
  EnvironmentalFactors,
  
  // Analytics Types
  PortalAnalytics,
  ImprovementMetric,
  
  // Unlock System Types
  PortalUnlockResult,
  UnlockCriterion,
  UnlockCriterionType,
  RecommendedAction,
  PaymentRequirement,
  SpecialUnlockCondition,
  UnlockReason,
  
  // Cultural Context
  CulturalContext,
  CulturalValue,
  WorkSchedule,
  
  // Offline Sync
  OfflineOperation,
  OfflineOperationType,
  
  // Service Response
  ServiceResponse,
  ServiceError,
  ResponseMetadata,
  
  // Enums & Literals
  PortalProgressStatus,
  PortalSubscriptionTier,
  PortalDifficulty,
  PortalCategory,
  PortalType,
  StepType,
  AnalyticsTimePeriod,
  AchievementCategory,
  AchievementRarity,
  
  // Nested Data Structures
  PortalUnlockCriteria,
  PortalCompletionCriteria,
  PortalColorScheme,
  PortalFeatures,
  AchievementReward,
  SocialSharingTemplate,
  StepDataSpecification,
  DataField,
  ValidationRule,
  StepUnlockCriteria,
  StepCompletionCriteria,
  StepAchievement,
  PortalCompletionData,
  AIInsights,
  QuantumVaultData,
  DifficultyAdjustment,
  SocialSharingData,
  SessionData,
  
  // Utility Types
  PaginatedResponse,
  SortOptions,
  FilterOptions,
  QueryOptions,
} from './portal-management'

// ============================================================================
// AI SERVICES TYPES
// ============================================================================

export type {
  // AI Configuration
  AIProvider,
  OpenAIModel,
  AnthropicModel,
  AIServiceConfig,
  
  // Conversation Management
  ConversationType,
  ConversationContext,
  ConversationMessage,
  MessageRole,
  MessageMetadata,
  ConversationMemory,
  CommunicationPreferences,
  KeyFact,
  UserGoal,
  UserChallenge,
  
  // AI Guidance
  AIGuidance,
  GuidanceTone,
  ActionItem,
  NextStep,
  AIResource,
  ResourceType,
  
  // Crisis Detection
  CrisisDetection,
  CrisisSeverity,
  CrisisType,
  CrisisIndicator,
  CrisisHotline,
  ProfessionalResource,
  
  // AI Personalities
  AIPersonality,
  PortalPersonalityType,
  
  // Cultural Adaptation
  CulturalAdaptationConfig,
  CulturalKnowledge,
  AdaptedMessage,
  
  // Streaming
  StreamingConfig,
  StreamEvent,
  StreamEventType,
  StreamingHandler,
  
  // Caching
  CacheConfig,
  CacheStrategy,
  CachedResponse,
  CacheStats,
  
  // Cost Tracking
  AIUsageMetrics,
  CostLimits,
  
  // Performance
  AIPerformanceMetrics,
  ModelPerformance,
  
  // Error Handling
  AIServiceError,
  AIErrorCode,
  
  // Request/Response
  AIRequest,
  AIRequestOptions,
  AIResponse,
  AIResponseMetadata,
  
  // Utilities
  PromptTemplate,
  FilledPrompt,
} from './ai-services'

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type {
  // Core Database Type
  Database,
  Json,
  
  // Helper Types
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from './database.types'

// ============================================================================
// COMMON UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * Extract keys of type T that have values of type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

/**
 * Pick keys by value type
 */
export type PickByValue<T, U> = Pick<T, KeysOfType<T, U>>

/**
 * Omit keys by value type
 */
export type OmitByValue<T, U> = Omit<T, KeysOfType<T, U>>

/**
 * Make specified keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Make specified keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

/**
 * Nullable type
 */
export type Nullable<T> = T | null

/**
 * Maybe type
 */
export type Maybe<T> = T | null | undefined

/**
 * Array or single item
 */
export type ArrayOrSingle<T> = T | T[]

/**
 * Promise or value
 */
export type Awaitable<T> = T | Promise<T>

/**
 * Function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any

/**
 * Async function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>

/**
 * Constructor type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = any> = new (...args: any[]) => T

/**
 * Abstract constructor type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AbstractConstructor<T = any> = abstract new (...args: any[]) => T

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never

/**
 * Extract promise resolution type
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : never

/**
 * Extract function return type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never

/**
 * Extract function parameters type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParametersOf<T> = T extends (...args: infer P) => any ? P : never

/**
 * Branded type for type safety
 */
export type Brand<T, B> = T & { __brand: B }

/**
 * Opaque type for nominal typing
 */
export type Opaque<T, K> = T & { __opaque__: K }

/**
 * JSON primitive types
 */
export type JSONPrimitive = string | number | boolean | null

/**
 * JSON value type
 */
export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue }

/**
 * JSON object type
 */
export type JSONObject = { [key: string]: JSONValue }

/**
 * JSON array type
 */
export type JSONArray = JSONValue[]

/**
 * Timestamp string in ISO 8601 format
 */
export type ISODateString = string

/**
 * UUID string
 */
export type UUID = string

/**
 * Email address string
 */
export type Email = string

/**
 * URL string
 */
export type URL = string

/**
 * Hexadecimal color string
 */
export type HexColor = string

/**
 * RGB color string
 */
export type RGBColor = string

/**
 * HSL color string
 */
export type HSLColor = string

/**
 * Currency code (ISO 4217)
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'RON' | 'JPY' | string

/**
 * Country code (ISO 3166-1 alpha-2)
 */
export type CountryCode = string

/**
 * Language code (ISO 639-1)
 */
export type LanguageCode = 'en' | 'ro' | 'de' | 'fr' | 'es' | 'it' | string

/**
 * Timezone string (IANA Time Zone Database)
 */
export type Timezone = string

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if value is defined (not null or undefined)
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined
}

/**
 * Check if value is null
 */
export const isNull = (value: unknown): value is null => {
  return value === null
}

/**
 * Check if value is undefined
 */
export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined
}

/**
 * Check if value is string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string'
}

/**
 * Check if value is number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Check if value is boolean
 */
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean'
}

/**
 * Check if value is object
 */
export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if value is array
 */
export const isArray = <T = unknown>(value: unknown): value is T[] => {
  return Array.isArray(value)
}

/**
 * Check if value is function
 */
export const isFunction = (value: unknown): value is AnyFunction => {
  return typeof value === 'function'
}

/**
 * Check if value is promise
 */
export const isPromise = <T = unknown>(value: unknown): value is Promise<T> => {
  return value instanceof Promise || (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  )
}

/**
 * Check if value is date
 */
export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * Check if value is error
 */
export const isError = (value: unknown): value is Error => {
  return value instanceof Error
}

// ============================================================================
// TYPE ASSERTIONS
// ============================================================================

/**
 * Assert value is defined, throw if not
 */
export const assertDefined = <T>(
  value: T | null | undefined,
  message = 'Value is null or undefined'
): asserts value is T => {
  if (!isDefined(value)) {
    throw new Error(message)
  }
}

/**
 * Assert value is string, throw if not
 */
export const assertString = (
  value: unknown,
  message = 'Value is not a string'
): asserts value is string => {
  if (!isString(value)) {
    throw new Error(message)
  }
}

/**
 * Assert value is number, throw if not
 */
export const assertNumber = (
  value: unknown,
  message = 'Value is not a number'
): asserts value is number => {
  if (!isNumber(value)) {
    throw new Error(message)
  }
}

/**
 * Assert value is object, throw if not
 */
export const assertObject = (
  value: unknown,
  message = 'Value is not an object'
): asserts value is object => {
  if (!isObject(value)) {
    throw new Error(message)
  }
}

/**
 * Assert value is array, throw if not
 */
export const assertArray = <T = unknown>(
  value: unknown,
  message = 'Value is not an array'
): asserts value is T[] => {
  if (!isArray(value)) {
    throw new Error(message)
  }
}

// ============================================================================
// EXPORTS FOR BACKWARDS COMPATIBILITY
// ============================================================================

// Re-export everything as a namespace for convenience
export * as PortalTypes from './portal-management'
export * as AITypes from './ai-services'
export * as DatabaseTypes from './database.types'