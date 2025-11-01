// types/portal-management.ts
/**
 * 🎯 PorVerse V2 - Portal Management Types
 * Comprehensive TypeScript types for portal-based spiritual operating system
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Core types for portal progression, user management, and spiritual guidance
 */

import type { Database } from './database.types'

// ============================================================================
// CORE PORTAL TYPES
// ============================================================================

/**
 * Portal subscription tiers defining access levels
 */
export type PortalSubscriptionTier = 'free' | 'basic' | 'premium' | 'quantum'

/**
 * Portal progression states
 */
export type PortalProgressStatus = 
  | 'locked'        // Portal not accessible yet
  | 'unlocked'      // Portal accessible but not started
  | 'in_progress'   // User actively working through portal
  | 'completed'     // Portal successfully finished
  | 'paused'        // User paused progress (can resume)
  | 'expired'       // Access expired (subscription ended)

/**
 * Step completion status types
 */
export type StepStatus = 
  | 'not_started'   // Step not yet attempted
  | 'in_progress'   // Step currently being worked on
  | 'completed'     // Step successfully completed
  | 'skipped'       // Step skipped (if optional)

/**
 * Portal difficulty levels for dynamic adjustment
 */
export type PortalDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master'

/**
 * Portal categories for organization and filtering
 */
export type PortalCategory = 
  | 'activation'    // P0 - Personal Activation
  | 'foundation'    // P1 - Foundation Portal
  | 'health'        // P2 - PorHealth Gateway
  | 'mind'          // P3 - PorMind Portal
  | 'flow'          // P4 - PorFlow Channel
  | 'well'          // P5 - PorWell Sanctuary
  | 'quantum'       // Quantum Vault

// ============================================================================
// PORTAL DATA STRUCTURES
// ============================================================================

/**
 * Core portal definition interface
 */
export interface Portal {
  id: string
  name: string
  description: string
  category: PortalCategory
  order_index: number
  subscription_tier: PortalSubscriptionTier
  difficulty_level: PortalDifficulty
  estimated_duration_days: number
  required_previous_portal?: string
  icon_name: string
  color_theme: string
  is_active: boolean
  unlock_criteria: PortalUnlockCriteria
  completion_criteria: PortalCompletionCriteria
  created_at: string
  updated_at: string
}

/**
 * Portal step definition interface
 */
export interface PortalStep {
  id: string
  portal_id: string
  step_number: number
  title: string
  description: string
  step_type: PortalStepType
  content: PortalStepContent
  estimated_duration_minutes: number
  is_required: boolean
  unlock_criteria?: StepUnlockCriteria
  completion_criteria: StepCompletionCriteria
  biometric_requirements?: BiometricRequirement[]
  is_active: boolean
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
  current_step: number
  total_steps: number
  completion_percentage: number
  status: PortalProgressStatus
  started_at?: string
  completed_at?: string
  last_activity_at: string
  time_spent_minutes: number
  quality_score?: number
  difficulty_adjustment: PortalDifficulty
  session_count: number
  achievement_points: number
  streak_days: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Individual step progress tracking
 */
export interface UserStepProgress {
  id: string
  user_id: string
  portal_id: string
  step_id: string
  status: StepStatus
  started_at?: string
  completed_at?: string
  time_spent_minutes: number
  quality_score?: number
  attempts_count: number
  data: Record<string, any>
  biometric_data?: BiometricReading[]
  ai_interaction_count: number
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// STEP TYPE DEFINITIONS
// ============================================================================

/**
 * Types of portal steps available
 */
export type PortalStepType = 
  | 'scan'              // Biometric scanning step
  | 'questionnaire'     // Multi-question assessment
  | 'action'            // Physical or digital action
  | 'habit'             // Habit tracking/formation
  | 'reflection'        // Self-reflection exercise
  | 'ai_conversation'   // AI-guided conversation
  | 'meditation'        // Guided meditation/mindfulness
  | 'challenge'         // Gamified challenge
  | 'assessment'        // Progress assessment
  | 'integration'       // Knowledge integration

/**
 * Step content structure (varies by type)
 */
export interface PortalStepContent {
  type: PortalStepType
  title: string
  description: string
  instructions: string[]
  resources?: StepResource[]
  configuration: Record<string, any>
}

/**
 * Step resource definition
 */
export interface StepResource {
  type: 'video' | 'audio' | 'text' | 'image' | 'link' | 'download'
  title: string
  url: string
  description?: string
  duration_seconds?: number
  file_size_mb?: number
}

// ============================================================================
// UNLOCK & COMPLETION CRITERIA
// ============================================================================

/**
 * Portal unlock criteria configuration
 */
export interface PortalUnlockCriteria {
  required_portals_completed: string[]
  subscription_tier_required: PortalSubscriptionTier
  minimum_total_points?: number
  minimum_streak_days?: number
  special_conditions?: SpecialUnlockCondition[]
  payment_required?: boolean
}

/**
 * Portal completion criteria configuration
 */
export interface PortalCompletionCriteria {
  required_steps_completion_percentage: number
  minimum_quality_score?: number
  minimum_time_spent_minutes?: number
  required_ai_interactions?: number
  required_biometric_improvements?: BiometricImprovement[]
  special_achievements?: string[]
}

/**
 * Step unlock criteria
 */
export interface StepUnlockCriteria {
  required_previous_steps: string[]
  minimum_portal_progress_percentage?: number
  required_achievements?: string[]
  time_gate_hours?: number
}

/**
 * Step completion criteria
 */
export interface StepCompletionCriteria {
  auto_complete_on_action?: boolean
  minimum_time_spent_minutes?: number
  required_data_fields?: string[]
  quality_threshold?: number
  biometric_improvement_required?: boolean
}

/**
 * Special unlock conditions for advanced features
 */
export interface SpecialUnlockCondition {
  type: 'biometric_baseline' | 'cultural_assessment' | 'payment_verification' | 'community_milestone'
  description: string
  criteria: Record<string, any>
}

// ============================================================================
// BIOMETRIC INTEGRATION TYPES
// ============================================================================

/**
 * Biometric requirements for steps
 */
export interface BiometricRequirement {
  type: BiometricType
  required: boolean
  quality_threshold: number
  frequency: 'once' | 'daily' | 'per_session'
}

/**
 * Supported biometric types
 */
export type BiometricType = 
  | 'face_emotion'      // Facial emotion analysis
  | 'face_micro'        // Micro-expression detection
  | 'voice_tone'        // Voice tone analysis
  | 'heart_rate'        // Heart rate variability
  | 'stress_level'      // Stress indicator
  | 'energy_level'      // Energy/vitality reading

/**
 * Biometric reading data structure
 */
export interface BiometricReading {
  id: string
  user_id: string
  type: BiometricType
  timestamp: string
  values: Record<string, number>
  confidence_score: number
  processing_duration_ms: number
  device_info?: Record<string, any>
}

/**
 * Required biometric improvements for completion
 */
export interface BiometricImprovement {
  metric: BiometricType
  baseline_value: number
  target_improvement_percentage: number
  measurement_window_days: number
}

// ============================================================================
// ACHIEVEMENT & GAMIFICATION TYPES
// ============================================================================

/**
 * Achievement definition
 */
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  points: number
  rarity: AchievementRarity
  unlock_criteria: AchievementCriteria
  is_hidden: boolean
  is_active: boolean
  created_at: string
}

/**
 * Achievement categories
 */
export type AchievementCategory = 
  | 'completion'        // Portal/step completion
  | 'streak'           // Consistency achievements
  | 'quality'          // High-quality performance
  | 'speed'            // Fast completion
  | 'improvement'      // Personal growth metrics
  | 'social'           // Community engagement
  | 'special'          // Special event achievements

/**
 * Achievement rarity levels
 */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/**
 * Achievement unlock criteria
 */
export interface AchievementCriteria {
  type: 'portal_completion' | 'streak' | 'points' | 'time' | 'quality' | 'biometric' | 'social'
  target_value: number
  additional_conditions?: Record<string, any>
}

/**
 * User achievement progress
 */
export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  progress_value: number
  is_completed: boolean
  completed_at?: string
  notified_at?: string
  created_at: string
}

// ============================================================================
// ANALYTICS & INSIGHTS TYPES
// ============================================================================

/**
 * Portal analytics data
 */
export interface PortalAnalytics {
  portal_id: string
  time_period: AnalyticsTimePeriod
  total_users: number
  completion_rate: number
  average_completion_time_days: number
  average_quality_score: number
  dropout_step_analysis: StepDropoutData[]
  user_satisfaction_score: number
  improvement_metrics: ImprovementMetric[]
  generated_at: string
}

/**
 * Analytics time periods
 */
export type AnalyticsTimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time'

/**
 * Step dropout analysis
 */
export interface StepDropoutData {
  step_id: string
  step_number: number
  dropout_rate: number
  average_time_before_dropout_minutes: number
  common_issues: string[]
}

/**
 * Improvement metrics tracking
 */
export interface ImprovementMetric {
  metric_name: string
  baseline_average: number
  current_average: number
  improvement_percentage: number
  statistical_significance: number
}

// ============================================================================
// SERVICE RESPONSE TYPES
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
 * Service error definition
 */
export interface ServiceError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  execution_time_ms: number
  cache_hit: boolean
  data_freshness: string
  api_version: string
}

// ============================================================================
// PORTAL MANAGEMENT SERVICE TYPES
// ============================================================================

/**
 * Portal unlock result
 */
export interface PortalUnlockResult {
  success: boolean
  portal_id: string
  unlocked: boolean
  missing_criteria?: string[]
  payment_required?: PaymentRequirement
  special_conditions?: SpecialUnlockCondition[]
}

/**
 * Payment requirement for premium portals
 */
export interface PaymentRequirement {
  required_tier: PortalSubscriptionTier
  price_monthly: number
  price_yearly: number
  currency: string
  benefits: string[]
  trial_available: boolean
}

/**
 * Portal session tracking
 */
export interface PortalSession {
  id: string
  user_id: string
  portal_id: string
  session_start: string
  session_end?: string
  duration_minutes?: number
  steps_completed: number
  quality_score?: number
  biometric_readings: BiometricReading[]
  ai_interactions: number
  session_data: Record<string, any>
}

/**
 * Progress update request
 */
export interface ProgressUpdateRequest {
  user_id: string
  portal_id: string
  step_id?: string
  progress_data: Record<string, any>
  biometric_reading?: BiometricReading
  quality_score?: number
  session_id?: string
}

/**
 * Unlock check request
 */
export interface UnlockCheckRequest {
  user_id: string
  portal_id: string
  subscription_tier: PortalSubscriptionTier
  current_progress: Record<string, UserPortalProgress>
}

// ============================================================================
// DIFFICULTY ADJUSTMENT TYPES
// ============================================================================

/**
 * Difficulty adjustment parameters
 */
export interface DifficultyAdjustment {
  user_id: string
  portal_id: string
  current_difficulty: PortalDifficulty
  suggested_difficulty: PortalDifficulty
  adjustment_reason: DifficultyAdjustmentReason
  confidence_score: number
  adjustment_data: Record<string, any>
}

/**
 * Reasons for difficulty adjustments
 */
export type DifficultyAdjustmentReason = 
  | 'performance_below_threshold'
  | 'performance_above_threshold'
  | 'biometric_stress_detected'
  | 'rapid_completion'
  | 'frequent_failures'
  | 'user_request'
  | 'ai_recommendation'

// ============================================================================
// OFFLINE SYNC TYPES
// ============================================================================

/**
 * Offline operation queue item
 */
export interface OfflineOperation {
  id: string
  user_id: string
  operation_type: OfflineOperationType
  portal_id?: string
  step_id?: string
  data: Record<string, any>
  timestamp: string
  retry_count: number
  max_retries: number
  priority: number
}

/**
 * Types of operations that can be queued for offline sync
 */
export type OfflineOperationType = 
  | 'progress_update'
  | 'step_completion'
  | 'biometric_reading'
  | 'achievement_unlock'
  | 'session_tracking'
  | 'ai_conversation'

// ============================================================================
// CULTURAL ADAPTATION TYPES
// ============================================================================

/**
 * Cultural context for portal customization
 */
export interface CulturalContext {
  user_id: string
  primary_language: string
  country_code: string
  cultural_values: CulturalValue[]
  religious_preferences?: string[]
  accessibility_needs?: AccessibilityNeed[]
  communication_style: CommunicationStyle
}

/**
 * Cultural values that affect portal presentation
 */
export interface CulturalValue {
  category: 'individualism' | 'collectivism' | 'hierarchy' | 'spirituality' | 'tradition'
  intensity: number // 1-10 scale
  influence_areas: string[]
}

/**
 * Communication style preferences
 */
export interface CommunicationStyle {
  directness: number        // 1-10 (direct vs indirect)
  formality: number         // 1-10 (casual vs formal)
  detail_preference: number // 1-10 (brief vs detailed)
  emotional_expression: number // 1-10 (reserved vs expressive)
}

/**
 * Accessibility requirements
 */
export interface AccessibilityNeed {
  type: 'visual' | 'auditory' | 'motor' | 'cognitive'
  severity: 'mild' | 'moderate' | 'severe'
  accommodations: string[]
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Database types (imported)
  Database,
  
  // Re-export all defined types for easy importing
  Portal,
  PortalStep,
  UserPortalProgress,
  UserStepProgress,
  PortalSession,
  Achievement,
  UserAchievement,
  BiometricReading,
  PortalAnalytics,
  ServiceResponse,
  PortalUnlockResult,
  DifficultyAdjustment,
  OfflineOperation,
  CulturalContext
}