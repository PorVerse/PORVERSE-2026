// lib/services/unlock-engine.ts
/**
 * 🎯 PorVerse V2 - Unlock Engine Service
 * Sophisticated engine for managing portal unlock criteria and progression logic
 *
 * @version 2.1.0-enterprise
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '../../types/database.types'
import type {
  Portal,
  UserPortalProgress,
  PortalSubscriptionTier,
  PaymentRequirement,
  ServiceResponse,
  Achievement,
  PortalUnlockCriteria,
  CulturalContext,
} from '../../types/portal-management'
import { isQueryError } from './supabase-helpers'

// ————————————————————————————————————————————————————————————————
// Type Aliases
// ————————————————————————————————————————————————————————————————
type Profile = Database['public']['Tables']['profiles']['Row']
type PortalSession = Database['public']['Tables']['portal_sessions']['Row']

interface SpecialCondition {
  type: 'biometric_baseline' | 'payment_verification' | 'cultural_assessment' | 'community_milestone'
  description?: string
}

interface UnlockCriteriaWithSpecial extends PortalUnlockCriteria {
  special_conditions?: SpecialCondition[]
}

interface CompletionData {
  portal_id?: string
  completion_time?: number
  quality_score?: number
  [key: string]: unknown
}

// ————————————————————————————————————————————————————————————————
// Config
// ————————————————————————————————————————————————————————————————
interface UnlockEngineConfig {
  supabaseUrl: string
  supabaseKey: string
  enablePaymentValidation: boolean
  enableBiometricValidation: boolean
  enableAchievementValidation: boolean
  unlockGracePeriodHours: number
  trialPeriodDays: number
}

// ————————————————————————————————————————————————————————————————
// Local types (engine-internal)
// ————————————————————————————————————————————————————————————————
interface UnlockEvaluation {
  canUnlock: boolean
  confidence: number
  missingCriteria: UnlockCriterion[]
  recommendedActions: RecommendedAction[]
  estimatedUnlockTime: number | null
  paymentRequired: PaymentRequirement | null
  specialConditions: SpecialUnlockCondition[]
}

interface UnlockCriterion {
  type: 'subscription' | 'progress' | 'achievement' | 'biometric' | 'time' | 'payment' | 'special'
  description: string
  currentValue: unknown
  requiredValue: unknown
  satisfied: boolean
  weight: number
}

interface RecommendedAction {
  action: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedTimeHours: number
  url?: string
}

interface CompletionResult {
  portalId: string
  completed: boolean
  achievementsUnlocked: Achievement[]
  nextPortalsUnlocked: string[]
  tierProgressUpdate: TierProgressUpdate | null
  celebrationData: CelebrationData
}

interface TierProgressUpdate {
  currentTier: PortalSubscriptionTier
  progressToNextTier: number
  nextTierBenefits: string[]
  upgradeRecommendation: boolean
}

interface CelebrationData {
  title: string
  message: string
  rewards: string[]
  shareText: string
  nextSteps: string[]
}

interface SpecialUnlockCondition {
  type: string
  description?: string
  [key: string]: unknown
}

// ————————————————————————————————————————————————————————————————
// Utils
// ————————————————————————————————————————————————————————————————
const toJson = (obj: unknown): Json => JSON.parse(JSON.stringify(obj ?? null))
const safeNumber = (v: unknown, def = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : def)
const tierOrder: Record<PortalSubscriptionTier | 'unknown', number> = { free: 0, basic: 1, premium: 2, quantum: 3, unknown: -1 }

// ————————————————————————————————————————————————————————————————
// Service
// ————————————————————————————————————————————————————————————————
export class UnlockEngine {
  private supabase: SupabaseClient<Database>
  private config: UnlockEngineConfig

  constructor(config: UnlockEngineConfig) {
    this.config = config
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey)
  }

  // ————————————————————————————————————————————————————————————————
  // UNLOCK EVALUATION & VALIDATION
  // ————————————————————————————————————————————————————————————————
  async evaluateUnlockCriteria(
    userId: string,
    portalId: string,
    culturalContext?: CulturalContext
  ): Promise<ServiceResponse<UnlockEvaluation>> {
    try {
      const startTime = Date.now()

      const portalResult = await this.supabase.from('portals').select('*').eq('id', portalId).single()
      if (isQueryError(portalResult) || !portalResult.data) {
        throw new Error(`Portal not found: ${isQueryError(portalResult) ? portalResult.error.message : ''}`)
      }
      const portal = portalResult.data

      const profileResult = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (isQueryError(profileResult)) {
        throw new Error(`User profile not found: ${profileResult.error.message}`)
      }
      const profile = profileResult.data

      const progressResult = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', userId)
      if (isQueryError(progressResult)) {
        throw new Error(`Failed to fetch user progress: ${progressResult.error.message}`)
      }
      const userProgress = progressResult.data

      const criteria: UnlockCriterion[] = []

      // 1) Subscription
      criteria.push(
        await this.evaluateSubscriptionCriterion(
          portal as unknown as Portal,
          profile.subscription_tier as PortalSubscriptionTier,
          profile.subscription_status as string
        )
      )

      // 2) Previous portal completion
      if (portal.required_previous_portal) {
        criteria.push(await this.evaluatePreviousPortalCriterion(portal.required_previous_portal, userProgress ?? []))
      }

      // 3) Achievements
      if (this.config.enableAchievementValidation) {
        criteria.push(
          ...(
            await this.evaluateAchievementCriteria(
              userId,
              (portal).unlock_criteria as PortalUnlockCriteria | null | undefined
            )
          )
        )
      }

      // 4) Biometric
      if (this.config.enableBiometricValidation) {
        criteria.push(
          ...(
            await this.evaluateBiometricCriteria(
              userId,
              (portal).unlock_criteria as PortalUnlockCriteria | null | undefined
            )
          )
        )
      }

      // 5) Special conditions
      criteria.push(
        ...(
          await this.evaluateSpecialConditions(
            userId,
            (portal).unlock_criteria as PortalUnlockCriteria | null | undefined,
            culturalContext
          )
        )
      )

      const satisfied = criteria.filter((c) => c.satisfied)
      const canUnlock = criteria.length === 0 ? true : satisfied.length === criteria.length
      const confidence = criteria.length === 0 ? 1 : satisfied.length / criteria.length

      const unsatisfied = criteria.filter((c) => !c.satisfied)
      const recommendedActions = await this.generateRecommendedActions(unsatisfied, portal, profile)
      const estimatedUnlockTime = this.estimateUnlockTime(unsatisfied, recommendedActions)

      const paymentRequired = criteria.find((c) => c.type === 'subscription' && !c.satisfied)
        ? await this.generatePaymentRequirement(portal, profile)
        : null

      const specialConditions: SpecialUnlockCondition[] =
        ((portal).unlock_criteria?.special_conditions as SpecialUnlockCondition[] | undefined) || []

      const evaluation: UnlockEvaluation = {
        canUnlock,
        confidence,
        missingCriteria: unsatisfied,
        recommendedActions,
        estimatedUnlockTime,
        paymentRequired,
        specialConditions,
      }

      return {
        success: true,
        data: evaluation,
        metadata: { execution_time_ms: Date.now() - startTime, cache_hit: false, data_freshness: 'fresh', api_version: '2.1.0-enterprise' },
      }
    } catch (error) {
      return { success: false, error: { code: 'UNLOCK_EVALUATION_ERROR', message: error instanceof Error ? error.message : 'Failed to evaluate unlock criteria', timestamp: new Date().toISOString() } }
    }
  }

  // ————————————————————————————————————————————————————————————————
  // COMPLETION PROCESSING
  // ————————————————————————————————————————————————————————————————
  async processPortalCompletion(
    userId: string,
    portalId: string,
    completionData: { qualityScore?: number; timeSpentMinutes?: number; achievementPoints: number; biometricImprovement?: number }
  ): Promise<ServiceResponse<CompletionResult>> {
    try {
      const startTime = Date.now()

      const { error: updateError } = await this.supabase
        .from('user_portal_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
          achievement_points: safeNumber(completionData.achievementPoints, 0),
          time_spent_minutes: (completionData.timeSpentMinutes ?? 0),
        })
        .eq('user_id', userId)
        .eq('portal_id', portalId)
      if (updateError) {
        throw new Error(`Failed to mark portal complete: ${updateError.message}`)
      }

      const achievementsUnlocked = await this.calculateAchievementsUnlocked(userId, portalId, completionData)
      const nextPortalsUnlocked = await this.findNextPortalsToUnlock(userId, portalId)
      const tierProgressUpdate = await this.updateTierProgress(userId, portalId)
      const celebrationData = await this.generateCelebrationData(userId, portalId, completionData, achievementsUnlocked)

      // Award achievements
      for (const a of achievementsUnlocked) {
        await this.awardAchievement(userId, (a as any).id as string)
      }
      // Auto-unlock next portals
      for (const pid of nextPortalsUnlocked) {await this.autoUnlockPortal(userId, pid)}

      const result: CompletionResult = {
        portalId,
        completed: true,
        achievementsUnlocked,
        nextPortalsUnlocked,
        tierProgressUpdate,
        celebrationData,
      }

      return { success: true, data: result, metadata: { execution_time_ms: Date.now() - startTime, cache_hit: false, data_freshness: 'fresh', api_version: '2.1.0-enterprise' } }
    } catch (error) {
      return { success: false, error: { code: 'COMPLETION_PROCESSING_ERROR', message: error instanceof Error ? error.message : 'Failed to process completion', timestamp: new Date().toISOString() } }
    }
  }

  // ————————————————————————————————————————————————————————————————
  // CRITERION EVALUATION METHODS
  // ————————————————————————————————————————————————————————————————
  private async evaluateSubscriptionCriterion(
    portal: Portal,
    userTier: PortalSubscriptionTier,
    subscriptionStatus: string
  ): Promise<UnlockCriterion> {
    const pTier = (portal.subscription_tier) || ('free' as PortalSubscriptionTier)
    const uTier = userTier || ('free' as PortalSubscriptionTier)
    const satisfied = tierOrder[pTier] <= tierOrder[uTier] && (subscriptionStatus === 'active' || pTier === 'free')

    return { type: 'subscription', description: `Requires ${pTier} subscription`, currentValue: uTier, requiredValue: pTier, satisfied, weight: 1.0 }
  }

  private async evaluatePreviousPortalCriterion(requiredPortalId: string, userProgress: UserPortalProgress[]): Promise<UnlockCriterion> {
    const prev = (userProgress || []).find((p) => p.portal_id === requiredPortalId)
    const satisfied = prev?.status === 'completed'

    const { data: reqPortal } = await this.supabase.from('portals').select('name').eq('id', requiredPortalId).single()
    return { type: 'progress', description: `Complete ${reqPortal?.name || 'previous portal'} first`, currentValue: prev?.status || 'not_started', requiredValue: 'completed', satisfied, weight: 1.0 }
  }

  private async evaluateAchievementCriteria(userId: string, unlockCriteria?: PortalUnlockCriteria | null): Promise<UnlockCriterion[]> {
    const criteria: UnlockCriterion[] = []
    const uc: Partial<PortalUnlockCriteria> = unlockCriteria ?? {}

    if (typeof uc.minimum_total_points === 'number') {
      const { data: rows } = await this.supabase.from('user_portal_progress').select('achievement_points').eq('user_id', userId)
      type ProgressRow = { achievement_points?: number; [key: string]: unknown }
      const total = (rows || []).reduce((s: number, r: ProgressRow) => s + safeNumber((r as Record<string, unknown>)['achievement_points'] as number, 0), 0)
      criteria.push({ type: 'achievement', description: `Earn ${uc.minimum_total_points} achievement points`, currentValue: total, requiredValue: uc.minimum_total_points, satisfied: total >= uc.minimum_total_points, weight: 0.8 })
    }

    if (typeof uc.minimum_streak_days === 'number') {
      const { data: sessions } = await this.supabase.from('portal_sessions').select('session_start').eq('user_id', userId).order('session_start', { ascending: false }).limit(60)
      const currentStreak = this.calculateCurrentStreak((sessions || []) as { session_start: string }[])
      criteria.push({ type: 'achievement', description: `Maintain ${uc.minimum_streak_days} day streak`, currentValue: currentStreak, requiredValue: uc.minimum_streak_days, satisfied: currentStreak >= uc.minimum_streak_days, weight: 0.6 })
    }

    return criteria
  }

  private async evaluateBiometricCriteria(userId: string, unlockCriteria?: PortalUnlockCriteria | null): Promise<UnlockCriterion[]> {
    const criteria: UnlockCriterion[] = []
    const uc: Partial<UnlockCriteriaWithSpecial> = unlockCriteria ?? {}
    const specials: SpecialCondition[] = Array.isArray(uc.special_conditions) ? uc.special_conditions : []
    const needsBaseline = specials.some((c) => c?.type === 'biometric_baseline')

    if (needsBaseline) {
      const { data: scans } = await this.supabase.from('biometric_scans').select('id').eq('user_id', userId).limit(1)
      const hasBaseline = (scans?.length || 0) > 0
      criteria.push({ type: 'biometric', description: 'Complete biometric baseline scan', currentValue: hasBaseline ? 'completed' : 'not_completed', requiredValue: 'completed', satisfied: hasBaseline, weight: 0.7 })
    }
    return criteria
  }

  private async evaluateSpecialConditions(
    _userId: string,
    unlockCriteria?: PortalUnlockCriteria | null,
    culturalContext?: CulturalContext
  ): Promise<UnlockCriterion[]> {
    const criteria: UnlockCriterion[] = []
    const uc: Partial<UnlockCriteriaWithSpecial> = unlockCriteria ?? {}
    const specials: SpecialCondition[] = Array.isArray(uc.special_conditions) ? uc.special_conditions : []

    for (const cond of specials) {
      switch (cond?.type) {
        case 'cultural_assessment': {
          const hasCultural = !!culturalContext
          criteria.push({ type: 'special', description: 'Complete cultural background assessment', currentValue: hasCultural ? 'completed' : 'not_completed', requiredValue: 'completed', satisfied: hasCultural, weight: 0.5 })
          break
        }
        case 'payment_verification': {
          if (this.config.enablePaymentValidation) {
            // In absence of a concrete API, rely on profile payment IDs
            criteria.push({ type: 'payment', description: 'Valid payment method required', currentValue: 'unknown', requiredValue: 'valid', satisfied: false, weight: 1.0 })
          }
          break
        }
        case 'community_milestone': {
          criteria.push({ type: 'special', description: cond?.description || 'Community milestone', currentValue: 'unknown', requiredValue: 'achieved', satisfied: false, weight: 0.3 })
          break
        }
      }
    }

    return criteria
  }

  // ————————————————————————————————————————————————————————————————
  // HELPERS
  // ————————————————————————————————————————————————————————————————
  private async generateRecommendedActions(unsatisfied: UnlockCriterion[], _portal: Portal, _profile: Profile): Promise<RecommendedAction[]> {
    const actions: RecommendedAction[] = []
    for (const c of unsatisfied) {
      switch (c.type) {
        case 'subscription':
          actions.push({ action: 'upgrade_subscription', description: `Upgrade to ${c.requiredValue as string} subscription`, priority: 'high', estimatedTimeHours: 0.1, url: '/subscription/upgrade' })
          break
        case 'progress':
          actions.push({ action: 'complete_previous_portal', description: 'Complete the required previous portal', priority: 'high', estimatedTimeHours: 24 })
          break
        case 'achievement': {
          const delta = safeNumber(c.requiredValue, 0) - safeNumber(c.currentValue, 0)
          actions.push({ action: 'earn_achievement_points', description: `Earn ${Math.max(0, delta)} more achievement points`, priority: 'medium', estimatedTimeHours: Math.max(0, delta) * 0.5 })
          break
        }
        case 'biometric':
          actions.push({ action: 'complete_biometric_scan', description: 'Complete your biometric baseline scan', priority: 'medium', estimatedTimeHours: 0.5, url: '/biometric/baseline' })
          break
        case 'special':
          actions.push({ action: 'complete_cultural_assessment', description: 'Complete cultural background assessment', priority: 'low', estimatedTimeHours: 0.3, url: '/profile/cultural' })
          break
      }
    }
    const order = { high: 3, medium: 2, low: 1 }
    return actions.sort((a, b) => order[b.priority] - order[a.priority])
  }

  private estimateUnlockTime(unsatisfied: UnlockCriterion[], actions: RecommendedAction[]): number | null {
    if (unsatisfied.length === 0) {return 0}
    const hasPayment = unsatisfied.some((c) => c.type === 'subscription' || c.type === 'payment')
    if (hasPayment && unsatisfied.length === 1) {return 0.1}
    return actions.reduce((s, a) => s + a.estimatedTimeHours, 0)
  }

  private async generatePaymentRequirement(portal: Portal, _profile: Profile): Promise<PaymentRequirement> {
    const pricingMap: Record<string, { monthly: number; yearly: number }> = {
      basic: { monthly: 9.99, yearly: 99.99 },
      premium: { monthly: 19.99, yearly: 199.99 },
      quantum: { monthly: 49.99, yearly: 499.99 },
    }
    const tier = (portal.subscription_tier) || 'free'
    const pricing = pricingMap[tier] || { monthly: 0, yearly: 0 }

    return {
      required: true,
      amount:        pricing.monthly,
      currency: 'USD',
      payment_type: 'subscription' as const,
      subscription_tier: tier
    }
  }

  private getTierBenefits(tier: PortalSubscriptionTier): string[] {
    const benefits: Record<PortalSubscriptionTier, string[]> = {
      free: [],
      basic: ['Access to P1-P3 portals', 'Basic AI guidance', 'Progress tracking'],
      premium: ['Access to P4-P5 portals', 'Advanced AI coaching', 'Biometric integration', 'Priority support'],
      quantum: ['Quantum Vault access', 'Future self conversations', 'Advanced analytics', 'Premium support'],
    }
    return benefits[tier] || []
  }

  private calculateCurrentStreak(sessions: { session_start: string }[]): number {
    if (!sessions || sessions.length === 0) {return 0}
    const dates = [...new Set(sessions.map((s) => new Date(s.session_start).toDateString()))]
    let streak = 0
    const cursor = new Date()
    while (dates.includes(cursor.toDateString())) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }

  private async calculateAchievementsUnlocked(_userId: string, _portalId: string, _completionData: CompletionData): Promise<Achievement[]> {
    const { data } = await this.supabase.from('achievements').select('*').eq('category', 'completion').eq('is_active', true).limit(1)
    return (data || []) as Achievement[]
  }

  private async findNextPortalsToUnlock(_userId: string, completedPortalId: string): Promise<string[]> {
    const { data } = await this.supabase.from('portals').select('id').eq('required_previous_portal', completedPortalId).eq('is_active', true)
    type PortalIdRow = { id: string }
    return (data || []).map((p: PortalIdRow) => p.id)
  }

  private async updateTierProgress(_userId: string, _completedPortalId: string): Promise<TierProgressUpdate | null> {
    // Placeholder until there is a concrete rule-set
    return null
  }

  private async generateCelebrationData(_userId: string, portalId: string, completionData: CompletionData, achievements: Achievement[]): Promise<CelebrationData> {
    const { data: portal } = await this.supabase.from('portals').select('name, category').eq('id', portalId).single()
    type PortalNameRow = { name?: string; category?: string }
    const portalRow = portal as PortalNameRow | null
    return {
      title: `${portalRow?.name ?? 'Portal'} Complete!`,
      message: `Congratulations! You've successfully completed the ${portalRow?.name ?? 'portal'}.`,
      rewards: [
        `${safeNumber(completionData['achievementPoints'] as number, 0)} achievement points`,
        ...achievements.map((a) => a.name),
      ],
      shareText: `I just completed the ${(portal as any)?.name ?? 'portal'} in PorVerse! 🎉`,
      nextSteps: ['Continue your spiritual journey', 'Explore newly unlocked portals', 'Review your progress insights'],
    }
  }

  private async awardAchievement(userId: string, achievementId: string): Promise<void> {
    await this.supabase
      .from('user_achievements')
      .upsert({ user_id: userId, achievement_id: achievementId, progress_value: 100, is_completed: true, completed_at: new Date().toISOString() })
  }

  private async autoUnlockPortal(userId: string, portalId: string): Promise<void> {
    const { count: stepsCount } = await this.supabase
      .from('portal_steps')
      .select('*', { count: 'exact', head: true })
      .eq('portal_id', portalId)
      .eq('is_active', true)

    await this.supabase
      .from('user_portal_progress')
      .upsert({
        user_id: userId,
        portal_id: portalId,
        current_step: 1,
        total_steps: stepsCount || 0,
        progress_percentage: 0,
        status: 'unlocked',
        session_count: 0,
        achievement_points: 0,
        streak_days: 0,
        time_spent_minutes: 0,
        metadata: toJson({ auto_unlocked: true, unlock_timestamp: new Date().toISOString() }),
      }, { onConflict: 'user_id,portal_id' })
  }
}

export function createUnlockEngine(overrides?: Partial<UnlockEngineConfig>): UnlockEngine {
  const config: UnlockEngineConfig = {
    supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    supabaseKey: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    enablePaymentValidation: true,
    enableBiometricValidation: true,
    enableAchievementValidation: true,
    unlockGracePeriodHours: 24,
    trialPeriodDays: 7,
    ...overrides,
  }
  return new UnlockEngine(config)
}

export default UnlockEngine
