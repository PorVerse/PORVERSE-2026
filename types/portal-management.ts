/**
 * 🎯 PorVerse V2 - Portal Management Types
 * Comprehensive TypeScript type definitions for portal system
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Core types for portal-based spiritual operating system
 */

// ============================================================================
// ENUMS & LITERAL TYPES
// ============================================================================

/**
 * Portal progress status states
 */
export type PortalProgressStatus = 
  | 'locked'        // Portal not accessible yet
  | 'unlocked'      // Portal accessible but not started
  | 'in_progress'   // User actively working through portal
  | 'completed'     // Portal successfully finished
  | 'paused'        // User paused progress (can resume)
  | 'expired'       // Access expired (subscription ended)

/**
 * Portal subscription tiers
 */
export type PortalSubscriptionTier = 
  | 'free'          // Free tier (P0 only)
  | 'basic'         // Basic tier (P0-P3)
  | 'premium'       // Premium tier (P0-P5)
  | 'quantum'       // Quantum tier (All portals + Quantum Vault)

/**
 * Portal difficulty levels
 */
export type PortalDifficulty = 
  | 'beginner'      // Level 1-2
  | 'intermediate'  // Level 3
  | 'advanced'      // Level 4
  | 'expert'        // Level 5

/**
 * Portal categories
 */
export type PortalCategory = 
  | 'activation'    // Personal Activation (P0)
  | 'foundation'    // Foundation Portal (P1)
  | 'health'        // PorHealth Gateway (P2)
  | 'mind'          // PorMind Portal (P3)
  | 'flow'          // PorFlow Channel (P4)
  | 'well'          // PorWell Sanctuary (P5)
  | 'quantum'       // Quantum Vault

/**
 * Portal types
 */
export type PortalType = 
  | 'standard'      // Regular portal
  | 'quantum'       // Quantum Vault special portal
  | 'bonus'         // Bonus content portal
  | 'event'         // Time-limited event portal

/**
 * Step types
 */
export type StepType = 
  | 'scan'              // Biometric scan
  | 'questionnaire'     // Data collection form
  | 'action'            // Action item to complete
  | 'habit'             // Habit tracking
  | 'reflection'        // Reflection exercise
  | 'ai_conversation'   // AI coaching session
  | 'exercise'          // Physical or mental exercise
  | 'meditation'        // Meditation or mindfulness
  | 'video'             // Video content
  | 'reading'           // Reading material

/**
 * Analytics time periods
 */
export type AnalyticsTimePeriod = 
  | 'day' 
  | 'week' 
  | 'month' 
  | 'quarter' 
  | 'year' 
  | 'all_time'

// ============================================================================
// CORE PORTAL INTERFACES
// ============================================================================

/**
 * Portal definition
 */
export interface Portal {
  id: string
  name: string
  description: string
  long_description: string | null
  category: PortalCategory
  portal_type: PortalType
  
  // Progression
  order_index: number
  required_previous_portal: string | null
  estimated_duration_days: number
  difficulty_level: number
  
  // Access & Pricing
  subscription_tier: PortalSubscriptionTier
  is_active: boolean
  
  // Unlock & Completion Criteria
  unlock_criteria: PortalUnlockCriteria | null
  completion_criteria: PortalCompletionCriteria | null
  
  // UI & Experience
  color_scheme: PortalColorScheme | null
  icon_name: string | null
  background_animation: string | null
  
  // Features
  features: PortalFeatures | null
  ai_specialization: string | null
  recommended_session_duration: number | null
  max_daily_sessions: number
  
  // Gamification
  achievement_rewards: AchievementReward[] | null
  social_sharing_templates: SocialSharingTemplate[] | null
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Portal step definition
 */
export interface PortalStep {
  id: string
  portal_id: string
  step_number: number
  name: string
  description: string | null
  step_type: StepType
  
  // Data specifications
  required_data: StepDataSpecification | null
  output_data: StepDataSpecification | null
  
  // AI Integration
  ai_prompt_template: string | null
  ai_coaching_intensity: 'light' | 'moderate' | 'intensive'
  
  // Requirements
  is_required: boolean
  unlock_criteria: StepUnlockCriteria | null
  completion_criteria: StepCompletionCriteria | null
  prerequisite_steps: number[] | null
  
  // Estimates & Gamification
  estimated_duration_minutes: number | null
  gamification_points: number
  achievements: StepAchievement[] | null
  difficulty_modifier: number
  
  // Integration
  biometric_integration: boolean
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * User portal progress tracking
 */
export interface UserPortalProgress {
  id: string
  user_id: string
  portal_id: string
  
  // Status & Progress
  status: PortalProgressStatus
  progress_percentage: number
  current_step: number
  total_steps: number
  
  // Timing
  unlocked_at: string | null
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
  time_spent_minutes: number
  
  // Quality & Performance
  completion_score: number | null
  session_count: number
  streak_days: number
  
  // Data & Insights
  completion_data: PortalCompletionData | null
  ai_insights: AIInsights | null
  quantum_vault_contribution: QuantumVaultData | null
  difficulty_adjustments: DifficultyAdjustment[] | null
  
  // Payment & Access
  payment_method: 'stripe' | 'paypal' | 'free' | 'trial' | null
  subscription_id: string | null
  unlock_reason: UnlockReason | null
  
  // Social
  social_sharing_data: SocialSharingData | null
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * User step progress tracking
 */
export interface UserStepProgress {
  id: string
  user_id: string
  portal_id: string
  step_id: string
  step_number: number
  
  // Status
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  
  // Progress
  progress_percentage: number
  attempts: number
  
  // Data
  step_data: Record<string, any> | null
  quality_score: number | null
  
  // Timing
  started_at: string | null
  completed_at: string | null
  time_spent_minutes: number
  
  // Metadata
  created_at: string
  updated_at: string
}

/**
 * Portal session tracking
 */
export interface PortalSession {
  id: string
  user_id: string
  portal_id: string
  
  // Session info
  session_start: string
  session_end: string | null
  duration_minutes: number | null
  
  // Progress
  steps_completed: number
  completion_status: 'in_progress' | 'completed' | 'interrupted'
  
  // Data
  session_data: SessionData | null
  
  // Metadata
  created_at: string
}

// ============================================================================
// ACHIEVEMENT SYSTEM
// ============================================================================

/**
 * Achievement definition
 */
export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  
  // Requirements
  requirement_type: string
  requirement_value: number
  
  // Rewards
  points: number
  badge_icon: string | null
  rarity: AchievementRarity
  
  // Visibility
  is_hidden: boolean
  is_active: boolean
  
  // Metadata
  created_at: string
}

/**
 * User achievement progress
 */
export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  
  // Progress
  progress_value: number
  is_completed: boolean
  completed_at: string | null
  
  // Display
  is_showcased: boolean
  
  // Metadata
  earned_at: string
  created_at: string
}

/**
 * Achievement categories
 */
export type AchievementCategory = 
  | 'progress'      // Portal completions, milestones
  | 'quality'       // High scores, excellence
  | 'consistency'   // Streaks, regular engagement
  | 'special'       // Hidden, unique patterns
  | 'social'        // Community, sharing

/**
 * Achievement rarity tiers
 */
export type AchievementRarity = 
  | 'common'        // Easy to achieve
  | 'rare'          // Moderate difficulty
  | 'epic'          // Hard to achieve
  | 'legendary'     // Very rare

// ============================================================================
// BIOMETRIC INTEGRATION
// ============================================================================

/**
 * Biometric reading data
 */
export interface BiometricReading {
  id: string
  user_id: string
  
  // Type & Context
  type: BiometricType
  portal_context: string | null
  session_id: string | null
  
  // Measurements
  values: BiometricValues
  confidence: number
  
  // Analysis
  emotional_state: string | null
  recommendations: string[] | null
  baseline_deviation: number | null
  
  // Environment
  environmental_factors: EnvironmentalFactors | null
  
  // Metadata
  created_at: string
}

/**
 * Biometric measurement types
 */
export type BiometricType = 
  | 'face_emotion'      // Facial expression analysis
  | 'eye_fatigue'       // Eye tracking and fatigue
  | 'voice_stress'      // Voice stress analysis
  | 'heart_rate'        // Heart rate (from wearables)
  | 'hrv'               // Heart rate variability
  | 'sleep_quality'     // Sleep analysis
  | 'activity_level'    // Physical activity

/**
 * Biometric measurement values
 */
export interface BiometricValues {
  overall: number           // 0-100 overall score
  fatigue?: number          // 0-1 scale
  stress?: number           // 0-1 scale
  focus?: number            // 0-1 scale
  energy?: number           // 0-1 scale
  mood?: {
    valence: number         // -1 to 1
    arousal: number         // 0 to 1
    dominance: number       // 0 to 1
  }
  emotions?: {
    happiness?: number
    sadness?: number
    anger?: number
    fear?: number
    surprise?: number
    disgust?: number
    neutral?: number
  }
}

/**
 * Environmental factors during measurement
 */
export interface EnvironmentalFactors {
  lighting_quality?: 'poor' | 'fair' | 'good' | 'excellent'
  noise_level?: 'quiet' | 'moderate' | 'noisy'
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night'
  location?: string
  device_quality?: 'low' | 'medium' | 'high'
}

// ============================================================================
// ANALYTICS & INSIGHTS
// ============================================================================

/**
 * Portal analytics data
 */
export interface PortalAnalytics {
  portal_id: string
  user_id: string
  
  // Metrics
  total_time_spent: number
  average_session_duration: number
  completion_rate: number
  quality_score_average: number
  
  // Patterns
  optimal_time_of_day: string | null
  engagement_trend: 'increasing' | 'stable' | 'decreasing'
  success_factors: string[] | null
  
  // Comparisons
  percentile_rank: number | null
  compared_to_average: number | null
  
  // Period
  period_start: string
  period_end: string
  
  // Metadata
  calculated_at: string
}

/**
 * Improvement metrics
 */
export interface ImprovementMetric {
  metric_name: string
  baseline_value: number
  current_value: number
  improvement_percentage: number
  trend: 'improving' | 'stable' | 'declining'
  confidence: number
  measurement_count: number
}

// ============================================================================
// UNLOCK SYSTEM
// ============================================================================

/**
 * Portal unlock result
 */
export interface PortalUnlockResult {
  success: boolean
  portal_id: string
  unlocked: boolean
  
  // Criteria evaluation
  criteria_met: boolean
  missing_criteria: UnlockCriterion[] | null
  
  // Actions needed
  recommended_actions: RecommendedAction[] | null
  estimated_unlock_time: number | null
  
  // Payment
  payment_required: PaymentRequirement | null
  
  // Special conditions
  special_conditions: SpecialUnlockCondition[] | null
  
  // Metadata
  evaluated_at: string
}

/**
 * Unlock criterion
 */
export interface UnlockCriterion {
  type: UnlockCriterionType
  description: string
  current_value: unknown
  required_value: unknown
  satisfied: boolean
  weight: number
}

/**
 * Unlock criterion types
 */
export type UnlockCriterionType = 
  | 'subscription'      // Subscription tier requirement
  | 'progress'          // Previous portal completion
  | 'achievement'       // Achievement points or badges
  | 'biometric'         // Biometric baseline completion
  | 'time'              // Time-based unlock
  | 'payment'           // One-time payment
  | 'special'           // Special conditions

/**
 * Recommended action for unlocking
 */
export interface RecommendedAction {
  action: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimated_time_hours: number
  url?: string
}

/**
 * Payment requirement
 */
export interface PaymentRequirement {
  required: boolean
  amount: number
  currency: string
  payment_type: 'subscription' | 'one_time'
  subscription_tier?: PortalSubscriptionTier
}

/**
 * Special unlock condition
 */
export interface SpecialUnlockCondition {
  type: string
  description: string
  met: boolean
  unlock_date?: string
}

/**
 * Unlock reason
 */
export type UnlockReason = 
  | 'payment'           // Paid subscription or one-time
  | 'trial'             // Trial period
  | 'admin'             // Admin granted access
  | 'achievement'       // Unlocked through achievements
  | 'referral'          // Referral reward
  | 'promo'             // Promotional access
  | 'completion'        // Auto-unlocked after previous portal

// ============================================================================
// CULTURAL CONTEXT
// ============================================================================

/**
 * User cultural context for AI adaptation
 */
export interface CulturalContext {
  user_id: string
  
  // Language & Location
  primary_language: string
  secondary_languages: string[]
  country_code: string
  timezone: string
  
  // Cultural Values
  cultural_values: CulturalValue[]
  communication_style: 'direct' | 'indirect' | 'formal' | 'informal'
  
  // Beliefs & Practices
  religious_preferences: string[] | null
  spiritual_practices: string[] | null
  cultural_traditions: string[] | null
  
  // Time & Scheduling
  preferred_time_of_day: string[] | null
  work_schedule: WorkSchedule | null
  holidays: string[] | null
  
  // Adaptation preferences
  adaptation_level: 'minimal' | 'moderate' | 'extensive'
}

/**
 * Cultural value
 */
export interface CulturalValue {
  category: string
  importance: 'low' | 'medium' | 'high'
  description?: string
}

/**
 * Work schedule
 */
export interface WorkSchedule {
  work_days: number[]           // 0-6 (Sunday-Saturday)
  start_time: string            // HH:mm format
  end_time: string              // HH:mm format
  break_times: string[] | null  // Break periods
}

// ============================================================================
// OFFLINE SYNC
// ============================================================================

/**
 * Offline operation queue item
 */
export interface OfflineOperation {
  id: string
  user_id: string
  
  // Operation details
  operation_type: OfflineOperationType
  portal_id: string | null
  step_id: string | null
  
  // Data
  data: Record<string, any>
  
  // Retry logic
  timestamp: string
  retry_count: number
  max_retries: number
  last_error: string | null
  
  // Priority
  priority: number  // Higher = more important
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

/**
 * Offline operation types
 */
export type OfflineOperationType = 
  | 'progress_update'
  | 'step_completion'
  | 'session_update'
  | 'biometric_upload'
  | 'achievement_claim'
  | 'conversation_sync'

// ============================================================================
// SERVICE RESPONSE PATTERN
// ============================================================================

/**
 * Standard service response wrapper
 */
export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: ServiceError
  metadata?: ResponseMetadata
}

/**
 * Service error details
 */
export interface ServiceError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  requestId?: string
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  execution_time_ms: number
  cache_hit?: boolean
  data_freshness?: 'fresh' | 'stale' | 'cached'
  api_version?: string
  rate_limit_remaining?: number
  rate_limit_reset?: string
}

// ============================================================================
// NESTED DATA STRUCTURES
// ============================================================================

/**
 * Portal unlock criteria
 */
export interface PortalUnlockCriteria {
  previous_portal_required: boolean
  minimum_total_points?: number
  minimum_streak_days?: number
  minimum_quality_score?: number
  biometric_baseline_required?: boolean
  special_requirements?: string[]
}

/**
 * Portal completion criteria
 */
export interface PortalCompletionCriteria {
  minimum_steps_completed: number
  minimum_quality_score?: number
  minimum_time_spent_minutes?: number
  required_step_ids?: string[]
  biometric_improvement_required?: boolean
}

/**
 * Portal color scheme
 */
export interface PortalColorScheme {
  primary: string
  secondary: string
  accent: string
  gradient: string[]
}

/**
 * Portal features
 */
export interface PortalFeatures {
  ai_coaching: boolean
  biometric_tracking: boolean
  habit_tracking: boolean
  meditation_guides: boolean
  community_features: boolean
  offline_mode: boolean
}

/**
 * Achievement reward
 */
export interface AchievementReward {
  achievement_id: string
  points: number
  badge_icon: string
  description: string
}

/**
 * Social sharing template
 */
export interface SocialSharingTemplate {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin'
  template: string
  image_url?: string
}

/**
 * Step data specification
 */
export interface StepDataSpecification {
  fields: DataField[]
  validation_rules?: ValidationRule[]
}

/**
 * Data field
 */
export interface DataField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required: boolean
  description?: string
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string
  rule: string
  value: unknown
  message: string
}

/**
 * Step unlock criteria
 */
export interface StepUnlockCriteria {
  prerequisite_steps_completed?: number[]
  minimum_quality_score?: number
  time_requirement?: number
}

/**
 * Step completion criteria
 */
export interface StepCompletionCriteria {
  required_data_fields: string[]
  minimum_quality_score?: number
  validation_rules?: ValidationRule[]
}

/**
 * Step achievement
 */
export interface StepAchievement {
  condition: string
  achievement_id: string
  points: number
}

/**
 * Portal completion data
 */
export interface PortalCompletionData {
  total_steps: number
  completed_steps: number
  quality_scores: number[]
  key_insights: string[]
  improvements_noted: string[]
  next_recommendations: string[]
}

/**
 * AI insights
 */
export interface AIInsights {
  personality_analysis?: string
  strength_areas?: string[]
  growth_opportunities?: string[]
  recommended_focus?: string[]
  predicted_success_rate?: number
}

/**
 * Quantum vault data contribution
 */
export interface QuantumVaultData {
  identity_markers: string[]
  consciousness_patterns: string[]
  timeline_data: Record<string, unknown>
  future_self_projection: Record<string, unknown>
}

/**
 * Difficulty adjustment
 */
export interface DifficultyAdjustment {
  timestamp: string
  previous_difficulty: PortalDifficulty
  new_difficulty: PortalDifficulty
  reason: string
  performance_metrics: Record<string, number>
}

/**
 * Social sharing data
 */
export interface SocialSharingData {
  shared_on: string[]
  share_count: number
  last_shared_at: string | null
}

/**
 * Session data
 */
export interface SessionData {
  steps_attempted: string[]
  steps_completed: string[]
  quality_scores: Record<string, number>
  biometric_readings: string[]
  notes: string | null
  interruption_reason: string | null
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

/**
 * Filter options
 */
export interface FilterOptions {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'
  value: unknown
}

/**
 * Query options
 */
export interface QueryOptions {
  sort?: SortOptions[]
  filters?: FilterOptions[]
  limit?: number
  offset?: number
  include?: string[]
  exclude?: string[]
}