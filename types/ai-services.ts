/**
 * 🤖 PorVerse V2 - AI Services Types
 * TypeScript type definitions for AI integration
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Types for OpenAI and Anthropic AI services
 */

import type { 
  Portal, 
  UserPortalProgress, 
  BiometricReading, 
  CulturalContext 
} from './portal-management'

// ============================================================================
// AI MODEL CONFIGURATION
// ============================================================================

/**
 * AI service provider
 */
export type AIProvider = 'openai' | 'anthropic'

/**
 * OpenAI models
 */
export type OpenAIModel = 
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4-turbo-preview'
  | 'gpt-3.5-turbo'

/**
 * Anthropic models
 */
export type AnthropicModel = 
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  // API Keys
  openAIKey: string
  anthropicKey: string
  
  // Model selection
  defaultModel: AIProvider
  fallbackModel?: AIProvider
  
  // Generation parameters
  maxTokens: number
  temperature: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  
  // Features
  enableCaching: boolean
  enableStreaming: boolean
  enableCrisisDetection: boolean
  culturalAdaptation: boolean
  
  // Performance
  timeoutMs: number
  maxRetries: number
  retryDelayMs: number
  
  // Cost management
  dailyCostLimit?: number
  monthlyCostLimit?: number
}

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

/**
 * Conversation types
 */
export type ConversationType = 
  | 'guidance'          // General portal guidance
  | 'reflection'        // Self-reflection exercise
  | 'planning'          // Goal setting and planning
  | 'crisis'            // Crisis support
  | 'quantum'           // Quantum vault exploration
  | 'coaching'          // Active coaching session
  | 'analysis'          // Data analysis and insights
  | 'celebration'       // Achievement celebration

/**
 * Conversation context
 */
export interface ConversationContext {
  user_id: string
  portal_id: string
  conversation_type: ConversationType
  
  // User data
  user_progress: UserPortalProgress
  cultural_context?: CulturalContext
  biometric_data?: BiometricReading[]
  
  // Conversation state
  current_step?: string
  conversation_history: ConversationMessage[]
  conversation_memory: ConversationMemory
  
  // Metadata
  session_id?: string
  started_at: string
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  
  // Metadata
  tokens?: number
  model?: string
  processing_time_ms?: number
  metadata?: MessageMetadata
}

/**
 * Message role
 */
export type MessageRole = 'system' | 'user' | 'assistant'

/**
 * Message metadata
 */
export interface MessageMetadata {
  biometric_reading_id?: string
  portal_step_id?: string
  crisis_detected?: boolean
  crisis_severity?: CrisisSeverity
  emotion_detected?: string
  confidence_score?: number
  cultural_adaptation_applied?: boolean
}

/**
 * Conversation memory
 */
export interface ConversationMemory {
  user_id: string
  
  // User preferences learned
  communication_preferences: CommunicationPreferences
  topics_of_interest: string[]
  sensitive_topics: string[]
  
  // Important facts
  key_facts: KeyFact[]
  goals: UserGoal[]
  challenges: UserChallenge[]
  
  // Relationship
  relationship_stage: 'new' | 'building' | 'established' | 'deep'
  trust_level: number  // 0-100
  engagement_level: number  // 0-100
  
  // Metadata
  last_updated: string
  conversation_count: number
}

/**
 * Communication preferences
 */
export interface CommunicationPreferences {
  tone_preference: 'supportive' | 'challenging' | 'neutral' | 'mixed'
  detail_level: 'concise' | 'moderate' | 'detailed'
  formality: 'casual' | 'semi-formal' | 'formal'
  response_speed: 'immediate' | 'thoughtful' | 'patient'
  use_humor: boolean
  use_metaphors: boolean
  use_examples: boolean
}

/**
 * Key fact about user
 */
export interface KeyFact {
  category: string
  fact: string
  importance: 'low' | 'medium' | 'high' | 'critical'
  mentioned_at: string
  confirmed: boolean
}

/**
 * User goal
 */
export interface UserGoal {
  id: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'completed' | 'abandoned'
  progress: number  // 0-100
  created_at: string
  target_date?: string
}

/**
 * User challenge
 */
export interface UserChallenge {
  id: string
  description: string
  category: string
  severity: 'minor' | 'moderate' | 'major'
  status: 'active' | 'resolved' | 'ongoing'
  first_mentioned: string
  last_discussed?: string
}

// ============================================================================
// AI GUIDANCE & RESPONSES
// ============================================================================

/**
 * AI guidance response
 */
export interface AIGuidance {
  message: string
  tone: GuidanceTone
  
  // Action items
  action_items: ActionItem[]
  next_steps: NextStep[]
  
  // Quality metrics
  confidence_score: number
  relevance_score: number
  
  // Adaptations
  culturally_adapted: boolean
  biometric_adapted: boolean
  
  // Crisis handling
  crisis_detected: boolean
  crisis_data?: CrisisDetection
  
  // Resources
  resource_recommendations: AIResource[]
  
  // Follow-up
  follow_up_recommended: boolean
  follow_up_timing?: string
}

/**
 * Guidance tone
 */
export type GuidanceTone = 
  | 'supportive'        // Encouraging and warm
  | 'challenging'       // Pushes user to grow
  | 'neutral'           // Objective and balanced
  | 'celebratory'       // Celebrating achievements
  | 'empathetic'        // Deep understanding
  | 'motivational'      // Inspiring action

/**
 * Action item
 */
export interface ActionItem {
  id: string
  action: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimated_time_minutes: number
  category: string
  due_date?: string
}

/**
 * Next step recommendation
 */
export interface NextStep {
  step: string
  reason: string
  benefits: string[]
  estimated_impact: 'low' | 'medium' | 'high'
}

/**
 * AI resource recommendation
 */
export interface AIResource {
  type: ResourceType
  title: string
  description: string
  url?: string
  duration?: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  relevance_score: number
  why_recommended: string
}

/**
 * Resource types
 */
export type ResourceType = 
  | 'meditation'
  | 'article'
  | 'video'
  | 'exercise'
  | 'reflection'
  | 'book'
  | 'podcast'
  | 'course'
  | 'tool'
  | 'community'

// ============================================================================
// CRISIS DETECTION
// ============================================================================

/**
 * Crisis detection result
 */
export interface CrisisDetection {
  detected: boolean
  severity: CrisisSeverity
  type: CrisisType
  
  // Indicators
  indicators: CrisisIndicator[]
  risk_factors: string[]
  protective_factors: string[]
  
  // Recommendations
  immediate_actions: string[]
  professional_help_recommended: boolean
  emergency_contact_needed: boolean
  
  // Resources
  crisis_hotlines: CrisisHotline[]
  professional_resources: ProfessionalResource[]
  self_help_resources: string[]
  
  // Follow-up
  follow_up_required: boolean
  follow_up_timing: string
  escalation_protocol: string[]
  
  // Metadata
  detected_at: string
  confidence: number
  context: string
}

/**
 * Crisis severity levels
 */
export type CrisisSeverity = 
  | 'low'           // Mild distress, manageable
  | 'medium'        // Moderate concern, monitoring needed
  | 'high'          // Significant risk, intervention recommended
  | 'critical'      // Immediate danger, emergency response

/**
 * Crisis types
 */
export type CrisisType = 
  | 'depression'
  | 'anxiety'
  | 'panic'
  | 'suicidal_ideation'
  | 'self_harm'
  | 'substance_abuse'
  | 'trauma'
  | 'psychosis'
  | 'eating_disorder'
  | 'other'

/**
 * Crisis indicator
 */
export interface CrisisIndicator {
  indicator: string
  severity: 'mild' | 'moderate' | 'severe'
  confidence: number
  context: string
}

/**
 * Crisis hotline
 */
export interface CrisisHotline {
  name: string
  phone: string
  description: string
  availability: string
  languages: string[]
  country_code: string
}

/**
 * Professional resource
 */
export interface ProfessionalResource {
  type: 'therapist' | 'psychiatrist' | 'counselor' | 'support_group' | 'emergency'
  name: string
  description: string
  contact?: string
  url?: string
  location?: string
}

// ============================================================================
// PORTAL-SPECIFIC AI PERSONALITIES
// ============================================================================

/**
 * AI personality configuration
 */
export interface AIPersonality {
  portal_id: string
  portal_category: string
  
  // Personality traits
  name: string
  role: string
  expertise: string[]
  
  // Communication style
  tone: string
  communication_approach: string
  key_phrases: string[]
  
  // Specializations
  specialization_areas: string[]
  coaching_methodology: string
  
  // System prompt
  system_prompt: string
  
  // Behavioral guidelines
  do_emphasize: string[]
  do_avoid: string[]
}

/**
 * Portal personality definitions
 */
export type PortalPersonalityType = 
  | 'activation'    // P0 - Onboarding optimization
  | 'foundation'    // P1 - Habit formation coaching
  | 'health'        // P2 - Holistic health advisor
  | 'mind'          // P3 - Financial strategist
  | 'flow'          // P4 - Productivity coach
  | 'well'          // P5 - Mental health therapist
  | 'quantum'       // Quantum - Consciousness guide

// ============================================================================
// CULTURAL ADAPTATION
// ============================================================================

/**
 * Cultural adaptation config
 */
export interface CulturalAdaptationConfig {
  enabled: boolean
  
  // Adaptation levels
  language_adaptation: boolean
  communication_style_adaptation: boolean
  content_adaptation: boolean
  timing_adaptation: boolean
  
  // Cultural knowledge
  cultural_database: CulturalKnowledge[]
  
  // Validation
  sensitivity_check: boolean
  taboo_word_filtering: boolean
}

/**
 * Cultural knowledge entry
 */
export interface CulturalKnowledge {
  culture: string
  country_code: string
  
  // Communication
  communication_style: 'direct' | 'indirect' | 'high-context' | 'low-context'
  formality_level: 'casual' | 'semi-formal' | 'formal'
  
  // Values
  core_values: string[]
  family_structure: string
  work_ethic: string
  
  // Practices
  common_greetings: string[]
  appropriate_topics: string[]
  taboo_topics: string[]
  
  // Time & scheduling
  punctuality_expectations: string
  preferred_meeting_times: string[]
  important_holidays: string[]
  
  // Beliefs
  common_religious_beliefs: string[]
  spiritual_practices: string[]
  health_beliefs: string[]
}

/**
 * Adapted message
 */
export interface AdaptedMessage {
  original: string
  adapted: string
  adaptations_applied: string[]
  cultural_context_used: string[]
  confidence: number
}

// ============================================================================
// STREAMING RESPONSES
// ============================================================================

/**
 * Streaming configuration
 */
export interface StreamingConfig {
  enabled: boolean
  chunk_size: number
  buffer_size: number
  timeout_ms: number
}

/**
 * Stream event
 */
export interface StreamEvent {
  type: StreamEventType
  data: unknown
  timestamp: string
}

/**
 * Stream event types
 */
export type StreamEventType = 
  | 'start'
  | 'token'
  | 'chunk'
  | 'complete'
  | 'error'
  | 'interrupt'

/**
 * Streaming response handler
 */
export interface StreamingHandler {
  onToken: (token: string) => void
  onChunk: (chunk: string) => void
  onComplete: (fullText: string) => void
  onError: (error: Error) => void
  onInterrupt: () => void
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean
  ttl_seconds: number
  max_cache_size_mb: number
  cache_strategy: CacheStrategy
}

/**
 * Cache strategies
 */
export type CacheStrategy = 
  | 'lru'           // Least Recently Used
  | 'lfu'           // Least Frequently Used
  | 'fifo'          // First In First Out
  | 'ttl'           // Time To Live only

/**
 * Cached response
 */
export interface CachedResponse {
  prompt_hash: string
  response: string
  model: string
  tokens_used: number
  created_at: string
  expires_at: string
  hit_count: number
  last_accessed: string
}

/**
 * Cache stats
 */
export interface CacheStats {
  total_requests: number
  cache_hits: number
  cache_misses: number
  hit_rate: number
  total_tokens_saved: number
  total_cost_saved: number
  cache_size_mb: number
  oldest_entry: string
  newest_entry: string
}

// ============================================================================
// COST TRACKING
// ============================================================================

/**
 * AI cost tracking
 */
export interface AIUsageMetrics {
  user_id: string
  period_start: string
  period_end: string
  
  // Usage
  total_requests: number
  total_tokens: number
  input_tokens: number
  output_tokens: number
  
  // Costs
  total_cost: number
  openai_cost: number
  anthropic_cost: number
  
  // Breakdown
  cost_by_portal: Record<string, number>
  cost_by_conversation_type: Record<string, number>
  
  // Efficiency
  average_tokens_per_request: number
  cache_savings: number
  estimated_next_month_cost: number
}

/**
 * Cost limits
 */
export interface CostLimits {
  daily_limit: number
  weekly_limit: number
  monthly_limit: number
  per_user_daily_limit: number
  alert_threshold: number
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * AI performance metrics
 */
export interface AIPerformanceMetrics {
  // Response times
  average_response_time_ms: number
  p50_response_time_ms: number
  p95_response_time_ms: number
  p99_response_time_ms: number
  
  // Success rates
  success_rate: number
  error_rate: number
  timeout_rate: number
  
  // Quality
  average_confidence_score: number
  average_relevance_score: number
  user_satisfaction_score: number
  
  // Model performance
  openai_performance: ModelPerformance
  anthropic_performance: ModelPerformance
  
  // Period
  period_start: string
  period_end: string
}

/**
 * Model performance
 */
export interface ModelPerformance {
  model_name: string
  total_requests: number
  success_rate: number
  average_response_time_ms: number
  average_tokens: number
  average_cost: number
  error_types: Record<string, number>
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * AI service error
 */
export interface AIServiceError {
  code: AIErrorCode
  message: string
  provider: AIProvider
  model: string
  retry_after?: number
  details?: Record<string, unknown>
}

/**
 * AI error codes
 */
export type AIErrorCode = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_API_KEY'
  | 'MODEL_OVERLOADED'
  | 'CONTENT_FILTER_TRIGGERED'
  | 'CONTEXT_LENGTH_EXCEEDED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INSUFFICIENT_QUOTA'
  | 'INVALID_REQUEST'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * AI request
 */
export interface AIRequest {
  prompt: string
  context: ConversationContext
  options?: AIRequestOptions
}

/**
 * AI request options
 */
export interface AIRequestOptions {
  model?: string
  max_tokens?: number
  temperature?: number
  stream?: boolean
  cache?: boolean
  timeout_ms?: number
}

/**
 * AI response
 */
export interface AIResponse {
  content: string
  model: string
  tokens_used: number
  processing_time_ms: number
  confidence_score?: number
  metadata: AIResponseMetadata
}

/**
 * AI response metadata
 */
export interface AIResponseMetadata {
  request_id: string
  provider: AIProvider
  model: string
  cached: boolean
  cost: number
  timestamp: string
  culturally_adapted: boolean
  biometric_adapted: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Prompt template
 */
export interface PromptTemplate {
  id: string
  name: string
  template: string
  variables: string[]
  category: string
  use_case: string
}

/**
 * Prompt template with filled values
 */
export interface FilledPrompt {
  template_id: string
  prompt: string
  variables_used: Record<string, string>
}