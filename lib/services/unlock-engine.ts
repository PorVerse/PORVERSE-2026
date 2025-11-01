// lib/services/unlock-engine.ts
/**
 * 🎯 PorVerse V2 - Unlock Engine Service
 * Sophisticated engine for managing portal unlock criteria and progression logic
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Intelligent portal unlocking based on progress, payment, and special criteria
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'
import type {
  Portal,
  UserPortalProgress,
  PortalSubscriptionTier,
  PortalUnlockResult,
  PaymentRequirement,
  SpecialUnlockCondition,
  ServiceResponse,
  Achievement,
  UserAchievement,
  BiometricReading,
  PortalUnlockCriteria,
  CulturalContext
} from '../../types/portal-management'

/**
 * Unlock engine configuration
 */
interface UnlockEngineConfig {
  supabaseUrl: string
  supabaseKey: string
  enablePaymentValidation: boolean
  enableBiometricValidation: boolean
  enableAchievementValidation: boolean
  unlockGracePeriodHours: number
  trialPeriodDays: number
}

/**
 * Unlock evaluation result with detailed reasoning
 */
interface UnlockEvaluation {
  canUnlock: boolean
  confidence: number
  missingCriteria: UnlockCriterion[]
  recommendedActions: RecommendedAction[]
  estimatedUnlockTime: number | null
  paymentRequired: PaymentRequirement | null
  specialConditions: SpecialUnlockCondition[]
}

/**
 * Individual unlock criterion
 */
interface UnlockCriterion {
  type: 'subscription' | 'progress' | 'achievement' | 'biometric' | 'time' | 'payment' | 'special'
  description: string
  currentValue: any
  requiredValue: any
  satisfied: boolean
  weight: number
}

/**
 * Recommended action to satisfy unlock criteria
 */
interface RecommendedAction {
  action: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedTimeHours: number
  url?: string
}

/**
 * Portal completion result with unlock consequences
 */
interface CompletionResult {
  portalId: string
  completed: boolean
  achievementsUnlocked: Achievement[]
  nextPortalsUnlocked: string[]
  tierProgressUpdate: TierProgressUpdate | null
  celebrationData: CelebrationData
}

/**
 * User tier progress update
 */
interface TierProgressUpdate {
  currentTier: PortalSubscriptionTier
  progressToNextTier: number
  nextTierBenefits: string[]
  upgradeRecommendation: boolean
}

/**
 * Celebration data for completion
 */
interface CelebrationData {
  title: string
  message: string
  rewards: string[]
  shareText: string
  nextSteps: string[]
}

/**
 * Unlock Engine Service Class
 * Manages complex portal unlock logic and progression validation
 */
export class UnlockEngine {
  private supabase: SupabaseClient<Database>
  private config: UnlockEngineConfig

  /**
   * Initialize Unlock Engine with configuration
   */
  constructor(config: UnlockEngineConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
  }

  // ============================================================================
  // UNLOCK EVALUATION & VALIDATION
  // ============================================================================

  /**
   * Comprehensive evaluation of portal unlock criteria
   * @param userId - User identifier
   * @param portalId - Portal to evaluate for unlocking
   * @param culturalContext - User's cultural context for adaptation
   * @returns Detailed unlock evaluation
   */
  async evaluateUnlockCriteria(
    userId: string,
    portalId: string,
    culturalContext?: CulturalContext
  ): Promise<ServiceResponse<UnlockEvaluation>> {
    try {
      const startTime = Date.now()

      // Get portal with unlock criteria
      const { data: portal, error: portalError } = await this.supabase
        .from('portals')
        .select('*')
        .eq('id', portalId)
        .single()

      if (portalError || !portal) {
        throw new Error(`Portal not found: ${portalError?.message}`)
      }

      // Get user profile and subscription status
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw new Error(`User profile not found: ${profileError.message}`)
      }

      // Get user's portal progress
      const { data: userProgress, error: progressError } = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', userId)

      if (progressError) {
        throw new Error(`Failed to fetch user progress: ${progressError.message}`)
      }

      // Evaluate each criterion
      const criteria: UnlockCriterion[] = []
      
      // 1. Subscription tier requirement
      const subscriptionCriterion = await this.evaluateSubscriptionCriterion(
        portal,
        profile.subscription_tier,
        profile.subscription_status
      )
      criteria.push(subscriptionCriterion)

      // 2. Previous portal completion requirements
      if (portal.required_previous_portal) {
        const previousPortalCriterion = await this.evaluatePreviousPortalCriterion(
          portal.required_previous_portal,
          userProgress || []
        )
        criteria.push(previousPortalCriterion)
      }

      // 3. Achievement requirements
      if (this.config.enableAchievementValidation) {
        const achievementCriteria = await this.evaluateAchievementCriteria(
          userId,
          portal.unlock_criteria
        )
        criteria.push(...achievementCriteria)
      }

      // 4. Biometric baseline requirements
      if (this.config.enableBiometricValidation) {
        const biometricCriteria = await this.evaluateBiometricCriteria(
          userId,
          portal.unlock_criteria
        )
        criteria.push(...biometricCriteria)
      }

      // 5. Special conditions
      const specialCriteria = await this.evaluateSpecialConditions(
        userId,
        portal.unlock_criteria,
        culturalContext
      )
      criteria.push(...specialCriteria)

      // Calculate overall unlock status
      const satisfiedCriteria = criteria.filter(c => c.satisfied)
      const canUnlock = satisfiedCriteria.length === criteria.length
      const confidence = criteria.length > 0 ? satisfiedCriteria.length / criteria.length : 1

      // Generate recommended actions
      const recommendedActions = await this.generateRecommendedActions(
        criteria.filter(c => !c.satisfied),
        portal,
        profile
      )

      // Estimate unlock time
      const estimatedUnlockTime = this.estimateUnlockTime(
        criteria.filter(c => !c.satisfied),
        recommendedActions
      )

      // Check payment requirements
      const paymentRequired = subscriptionCriterion.satisfied ? null : 
        await this.generatePaymentRequirement(portal, profile)

      const evaluation: UnlockEvaluation = {
        canUnlock,
        confidence,
        missingCriteria: criteria.filter(c => !c.satisfied),
        recommendedActions,
        estimatedUnlockTime,
        paymentRequired,
        specialConditions: portal.unlock_criteria?.special_conditions || []
      }

      return {
        success: true,
        data: evaluation,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          cache_hit: false,
          data_freshness: 'fresh',
          api_version: '2.0.0'
        }
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNLOCK_EVALUATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to evaluate unlock criteria',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Process portal completion and trigger unlock consequences
   * @param userId - User identifier
   * @param portalId - Completed portal identifier
   * @param completionData - Completion metrics and data
   * @returns Completion result with unlock consequences
   */
  async processPortalCompletion(
    userId: string,
    portalId: string,
    completionData: {
      qualityScore: number
      timeSpentMinutes: number
      achievementPoints: number
      biometricImprovement?: number
    }
  ): Promise<ServiceResponse<CompletionResult>> {
    try {
      const startTime = Date.now()

      // Mark portal as completed
      const { error: updateError } = await this.supabase
        .from('user_portal_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_percentage: 100,
          quality_score: completionData.qualityScore,
          achievement_points: completionData.achievementPoints
        })
        .eq('user_id', userId)
        .eq('portal_id', portalId)

      if (updateError) {
        throw new Error(`Failed to mark portal complete: ${updateError.message}`)
      }

      // Calculate achievements unlocked
      const achievementsUnlocked = await this.calculateAchievementsUnlocked(
        userId,
        portalId,
        completionData
      )

      // Find next portals that can be unlocked
      const nextPortalsUnlocked = await this.findNextPortalsToUnlock(userId, portalId)

      // Update user tier progress
      const tierProgressUpdate = await this.updateTierProgress(userId, portalId)

      // Generate celebration data
      const celebrationData = await this.generateCelebrationData(
        userId,
        portalId,
        completionData,
        achievementsUnlocked
      )

      // Award achievements
      for (const achievement of achievementsUnlocked) {
        await this.awardAchievement(userId, achievement.id)
      }

      // Auto-unlock next portals if criteria met
      for (const nextPortalId of nextPortalsUnlocked) {
        await this.autoUnlockPortal(userId, nextPortalId)
      }

      const result: CompletionResult = {
        portalId,
        completed: true,
        achievementsUnlocked,
        nextPortalsUnlocked,
        tierProgressUpdate,
        celebrationData
      }

      return {
        success: true,
        data: result,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          cache_hit: false,
          data_freshness: 'fresh',
          api_version: '2.0.0'
        }
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPLETION_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process completion',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // ============================================================================
  // CRITERION EVALUATION METHODS
  // ============================================================================

  /**
   * Evaluate subscription tier requirement
   */
  private async evaluateSubscriptionCriterion(
    portal: Portal,
    userTier: PortalSubscriptionTier,
    subscriptionStatus: string
  ): Promise<UnlockCriterion> {
    const tierOrder = { free: 0, basic: 1, premium: 2, quantum: 3 }
    const requiredLevel = tierOrder[portal.subscription_tier]
    const currentLevel = tierOrder[userTier]

    const satisfied = currentLevel >= requiredLevel && 
                      (subscriptionStatus === 'active' || portal.subscription_tier === 'free')

    return {
      type: 'subscription',
      description: `Requires ${portal.subscription_tier} subscription`,
      currentValue: userTier,
      requiredValue: portal.subscription_tier,
      satisfied,
      weight: 1.0
    }
  }

  /**
   * Evaluate previous portal completion requirement
   */
  private async evaluatePreviousPortalCriterion(
    requiredPortalId: string,
    userProgress: UserPortalProgress[]
  ): Promise<UnlockCriterion> {
    const previousProgress = userProgress.find(p => p.portal_id === requiredPortalId)
    const satisfied = previousProgress?.status === 'completed'

    // Get portal name for description
    const { data: requiredPortal } = await this.supabase
      .from('portals')
      .select('name')
      .eq('id', requiredPortalId)
      .single()

    return {
      type: 'progress',
      description: `Complete ${requiredPortal?.name || 'previous portal'} first`,
      currentValue: previousProgress?.status || 'not_started',
      requiredValue: 'completed',
      satisfied,
      weight: 1.0
    }
  }

  /**
   * Evaluate achievement requirements
   */
  private async evaluateAchievementCriteria(
    userId: string,
    unlockCriteria: PortalUnlockCriteria
  ): Promise<UnlockCriterion[]> {
    const criteria: UnlockCriterion[] = []

    // Minimum total points requirement
    if (unlockCriteria.minimum_total_points) {
      const { data: userProgress } = await this.supabase
        .from('user_portal_progress')
        .select('achievement_points')
        .eq('user_id', userId)

      const totalPoints = userProgress?.reduce((sum, p) => sum + p.achievement_points, 0) || 0
      
      criteria.push({
        type: 'achievement',
        description: `Earn ${unlockCriteria.minimum_total_points} achievement points`,
        currentValue: totalPoints,
        requiredValue: unlockCriteria.minimum_total_points,
        satisfied: totalPoints >= unlockCriteria.minimum_total_points,
        weight: 0.8
      })
    }

    // Minimum streak requirement
    if (unlockCriteria.minimum_streak_days) {
      // Get current streak (simplified calculation)
      const { data: recentSessions } = await this.supabase
        .from('portal_sessions')
        .select('session_start')
        .eq('user_id', userId)
        .order('session_start', { ascending: false })
        .limit(30)

      const currentStreak = this.calculateCurrentStreak(recentSessions || [])

      criteria.push({
        type: 'achievement',
        description: `Maintain ${unlockCriteria.minimum_streak_days} day streak`,
        currentValue: currentStreak,
        requiredValue: unlockCriteria.minimum_streak_days,
        satisfied: currentStreak >= unlockCriteria.minimum_streak_days,
        weight: 0.6
      })
    }

    return criteria
  }

  /**
   * Evaluate biometric requirements
   */
  private async evaluateBiometricCriteria(
    userId: string,
    unlockCriteria: PortalUnlockCriteria
  ): Promise<UnlockCriterion[]> {
    const criteria: UnlockCriterion[] = []

    // Check if biometric baseline is required
    const hasBaselineCondition = unlockCriteria.special_conditions?.some(
      c => c.type === 'biometric_baseline'
    )

    if (hasBaselineCondition) {
      const { data: biometricScans } = await this.supabase
        .from('biometric_scans')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      const hasBaseline = (biometricScans?.length || 0) > 0

      criteria.push({
        type: 'biometric',
        description: 'Complete biometric baseline scan',
        currentValue: hasBaseline ? 'completed' : 'not_completed',
        requiredValue: 'completed',
        satisfied: hasBaseline,
        weight: 0.7
      })
    }

    return criteria
  }

  /**
   * Evaluate special unlock conditions
   */
  private async evaluateSpecialConditions(
    userId: string,
    unlockCriteria: PortalUnlockCriteria,
    culturalContext?: CulturalContext
  ): Promise<UnlockCriterion[]> {
    const criteria: UnlockCriterion[] = []

    if (!unlockCriteria.special_conditions) return criteria

    for (const condition of unlockCriteria.special_conditions) {
      switch (condition.type) {
        case 'cultural_assessment':
          const hasCulturalData = culturalContext !== undefined
          criteria.push({
            type: 'special',
            description: 'Complete cultural background assessment',
            currentValue: hasCulturalData ? 'completed' : 'not_completed',
            requiredValue: 'completed',
            satisfied: hasCulturalData,
            weight: 0.5
          })
          break

        case 'payment_verification':
          if (this.config.enablePaymentValidation) {
            const hasValidPayment = await this.validatePaymentMethod(userId)
            criteria.push({
              type: 'payment',
              description: 'Valid payment method required',
              currentValue: hasValidPayment ? 'valid' : 'invalid',
              requiredValue: 'valid',
              satisfied: hasValidPayment,
              weight: 1.0
            })
          }
          break

        case 'community_milestone':
          // TODO: Implement community milestone validation
          criteria.push({
            type: 'special',
            description: condition.description,
            currentValue: 'unknown',
            requiredValue: 'achieved',
            satisfied: false,
            weight: 0.3
          })
          break
      }
    }

    return criteria
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate recommended actions for unsatisfied criteria
   */
  private async generateRecommendedActions(
    unsatisfiedCriteria: UnlockCriterion[],
    portal: Portal,
    profile: any
  ): Promise<RecommendedAction[]> {
    const actions: RecommendedAction[] = []

    for (const criterion of unsatisfiedCriteria) {
      switch (criterion.type) {
        case 'subscription':
          actions.push({
            action: 'upgrade_subscription',
            description: `Upgrade to ${criterion.requiredValue} subscription`,
            priority: 'high',
            estimatedTimeHours: 0.1,
            url: '/subscription/upgrade'
          })
          break

        case 'progress':
          actions.push({
            action: 'complete_previous_portal',
            description: `Complete the required previous portal`,
            priority: 'high',
            estimatedTimeHours: 24
          })
          break

        case 'achievement':
          if (criterion.description.includes('points')) {
            const pointsNeeded = criterion.requiredValue - criterion.currentValue
            actions.push({
              action: 'earn_achievement_points',
              description: `Earn ${pointsNeeded} more achievement points`,
              priority: 'medium',
              estimatedTimeHours: pointsNeeded * 0.5
            })
          }
          break

        case 'biometric':
          actions.push({
            action: 'complete_biometric_scan',
            description: 'Complete your biometric baseline scan',
            priority: 'medium',
            estimatedTimeHours: 0.5,
            url: '/biometric/baseline'
          })
          break

        case 'special':
          if (criterion.description.includes('cultural')) {
            actions.push({
              action: 'complete_cultural_assessment',
              description: 'Complete cultural background assessment',
              priority: 'low',
              estimatedTimeHours: 0.3,
              url: '/profile/cultural'
            })
          }
          break
      }
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Estimate time to unlock based on missing criteria
   */
  private estimateUnlockTime(
    unsatisfiedCriteria: UnlockCriterion[],
    recommendedActions: RecommendedAction[]
  ): number | null {
    if (unsatisfiedCriteria.length === 0) return 0

    // If payment is required, it can be immediate
    const hasPaymentBarrier = unsatisfiedCriteria.some(c => c.type === 'subscription' || c.type === 'payment')
    if (hasPaymentBarrier && unsatisfiedCriteria.length === 1) return 0.1

    // Calculate based on action estimates
    const totalHours = recommendedActions.reduce((sum, action) => sum + action.estimatedTimeHours, 0)
    return totalHours
  }

  /**
   * Generate payment requirement details
   */
  private async generatePaymentRequirement(
    portal: Portal,
    profile: any
  ): Promise<PaymentRequirement> {
    // TODO: Fetch actual pricing from configuration
    const pricingMap = {
      basic: { monthly: 9.99, yearly: 99.99 },
      premium: { monthly: 19.99, yearly: 199.99 },
      quantum: { monthly: 49.99, yearly: 499.99 }
    }

    const pricing = pricingMap[portal.subscription_tier as keyof typeof pricingMap] || { monthly: 0, yearly: 0 }

    return {
      required_tier: portal.subscription_tier,
      price_monthly: pricing.monthly,
      price_yearly: pricing.yearly,
      currency: 'USD',
      benefits: this.getTierBenefits(portal.subscription_tier),
      trial_available: profile.subscription_status !== 'trial_used'
    }
  }

  /**
   * Get benefits for subscription tier
   */
  private getTierBenefits(tier: PortalSubscriptionTier): string[] {
    const benefits = {
      basic: ['Access to P1-P3 portals', 'Basic AI guidance', 'Progress tracking'],
      premium: ['Access to P4-P5 portals', 'Advanced AI coaching', 'Biometric integration', 'Priority support'],
      quantum: ['Quantum Vault access', 'Future self conversations', 'Advanced analytics', 'Premium support']
    }

    return benefits[tier as keyof typeof benefits] || []
  }

  /**
   * Calculate current streak from session data
   */
  private calculateCurrentStreak(sessions: { session_start: string }[]): number {
    if (sessions.length === 0) return 0

    const sessionDates = sessions.map(s => new Date(s.session_start).toDateString())
    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    let streak = 0
    let currentDate = new Date()

    for (const dateStr of uniqueDates) {
      const sessionDate = new Date(dateStr)
      const dayDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (dayDiff === streak) {
        streak++
      } else if (dayDiff > streak + 1) {
        break
      }
    }

    return streak
  }

  /**
   * Validate payment method for user
   */
  private async validatePaymentMethod(userId: string): Promise<boolean> {
    // TODO: Implement actual payment validation
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('stripe_customer_id, paypal_customer_id')
      .eq('id', userId)
      .single()

    return !!(profile?.stripe_customer_id || profile?.paypal_customer_id)
  }

  /**
   * Calculate achievements unlocked by completion
   */
  private async calculateAchievementsUnlocked(
    userId: string,
    portalId: string,
    completionData: any
  ): Promise<Achievement[]> {
    // TODO: Implement sophisticated achievement calculation
    const achievements: Achievement[] = []

    // Basic completion achievement
    const { data: completionAchievement } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('category', 'completion')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (completionAchievement) {
      achievements.push(completionAchievement as Achievement)
    }

    return achievements
  }

  /**
   * Find next portals that can be unlocked
   */
  private async findNextPortalsToUnlock(userId: string, completedPortalId: string): Promise<string[]> {
    const { data: nextPortals } = await this.supabase
      .from('portals')
      .select('id')
      .eq('required_previous_portal', completedPortalId)
      .eq('is_active', true)

    // TODO: Validate each portal's unlock criteria
    return nextPortals?.map(p => p.id) || []
  }

  /**
   * Update user tier progress
   */
  private async updateTierProgress(userId: string, completedPortalId: string): Promise<TierProgressUpdate | null> {
    // TODO: Implement tier progress calculation
    return null
  }

  /**
   * Generate celebration data for completion
   */
  private async generateCelebrationData(
    userId: string,
    portalId: string,
    completionData: any,
    achievements: Achievement[]
  ): Promise<CelebrationData> {
    const { data: portal } = await this.supabase
      .from('portals')
      .select('name, category')
      .eq('id', portalId)
      .single()

    return {
      title: `${portal?.name} Complete!`,
      message: `Congratulations! You've successfully completed the ${portal?.name} portal.`,
      rewards: [
        `${completionData.achievementPoints} achievement points`,
        ...achievements.map(a => a.name)
      ],
      shareText: `I just completed the ${portal?.name} portal in PorVerse! 🎉`,
      nextSteps: [
        'Continue your spiritual journey',
        'Explore newly unlocked portals',
        'Review your progress insights'
      ]
    }
  }

  /**
   * Award achievement to user
   */
  private async awardAchievement(userId: string, achievementId: string): Promise<void> {
    await this.supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        progress_value: 100,
        is_completed: true,
        completed_at: new Date().toISOString()
      })
  }

  /**
   * Auto-unlock portal for user
   */
  private async autoUnlockPortal(userId: string, portalId: string): Promise<void> {
    // Get portal steps count
    const { count: stepsCount } = await this.supabase
      .from('portal_steps')
      .select('*', { count: 'exact' })
      .eq('portal_id', portalId)
      .eq('is_active', true)

    // Create progress record
    await this.supabase
      .from('user_portal_progress')
      .upsert({
        user_id: userId,
        portal_id: portalId,
        current_step: 1,
        total_steps: stepsCount || 0,
        completion_percentage: 0,
        status: 'unlocked',
        difficulty_adjustment: 'intermediate',
        session_count: 0,
        achievement_points: 0,
        streak_days: 0,
        time_spent_minutes: 0,
        metadata: {
          auto_unlocked: true,
          unlock_timestamp: new Date().toISOString()
        }
      })
  }
}

/**
 * Create Unlock Engine instance
 */
export function createUnlockEngine(overrides?: Partial<UnlockEngineConfig>): UnlockEngine {
  const config: UnlockEngineConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    enablePaymentValidation: true,
    enableBiometricValidation: true,
    enableAchievementValidation: true,
    unlockGracePeriodHours: 24,
    trialPeriodDays: 7,
    ...overrides
  }

  return new UnlockEngine(config)
}

export default UnlockEngine