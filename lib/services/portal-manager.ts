// lib/services/portal-manager.ts
/**
 * 🎯 PorVerse V2 - Portal Manager Service
 * Core service managing portal progression, unlocking, and state management
 *
 * @version 2.1.0-enterprise
 * @author PorVerse
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '../../types/database.types'
import type {
  UserPortalProgress,
  UserStepProgress,
  PortalProgressStatus,
  PortalSubscriptionTier,
  PortalUnlockResult,
  ServiceResponse,
  PortalSession,
  BiometricReading,
  OfflineOperation,
} from '../../types/portal-management'
import { isQueryError, isQuerySuccess } from './supabase-helpers'

// Local interfaces not exported from types
interface ProgressUpdateRequest {
  user_id: string
  portal_id: string
  progress_data?: Record<string, any>
  step_id?: string
  biometric_reading?: BiometricReading
}

interface UnlockCheckRequest {
  user_id: string
  portal_id: string
  subscription_tier?: PortalSubscriptionTier
  current_progress?: Record<string, UserPortalProgress>
}

// ————————————————————————————————————————————————————————————————
// Config
// ————————————————————————————————————————————————————————————————
interface PortalManagerConfig {
  supabaseUrl: string
  supabaseKey: string
  enableRealtime: boolean
  enableOfflineSync: boolean
  cacheTtlMinutes: number
  maxRetries: number
}

interface PortalAccessPermissions {
  canAccess: boolean
  requiresPayment: boolean
  requiredTier: PortalSubscriptionTier
  missingCriteria: string[]
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
export class PortalManager {
  private supabase: SupabaseClient<Database>
  private config: PortalManagerConfig
  private cache: Map<string, any> = new Map()
  private offlineQueue: OfflineOperation[] = []

  constructor(config: PortalManagerConfig) {
    this.config = config
    this.supabase = createClient<Database>(config.supabaseUrl, config.supabaseKey)

    if (config.enableRealtime) {this.setupRealtimeSubscriptions()}
    if (config.enableOfflineSync) {this.initializeOfflineSync()}
  }

  // ————————————————————————————————————————————————————————————————
  // PORTAL ACCESS & UNLOCKING
  // ————————————————————————————————————————————————————————————————
  async getUserPortalAccess(userId: string, forceRefresh: boolean = false): Promise<ServiceResponse<any[]>> {
    try {
      const startTime = Date.now()
      const cacheKey = `user_portals_${userId}`

      if (!forceRefresh && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.config.cacheTtlMinutes * 60 * 1000) {
          return {
            success: true,
            data: cached.data,
            metadata: { execution_time_ms: Date.now() - startTime, cache_hit: true, data_freshness: 'cached', api_version: '2.1.0-enterprise' },
          }
        }
      }

      const profileResult = await this.supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, quantum_vault_unlocked')
        .eq('id', userId)
        .single()

      if (isQueryError(profileResult)) {
        throw new Error(`Failed to fetch user profile: ${profileResult.error.message}`)
      }
      
      const profile = profileResult.data

      const portalsResult = await this.supabase
        .from('portals')
        .select('*')
        .eq('is_active', true)
        .order('order_index')

      if (isQueryError(portalsResult)) {
        throw new Error(`Failed to fetch portals: ${portalsResult.error.message}`)
      }
      
      const portals = portalsResult.data

      const progressResult = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', userId)

      if (isQueryError(progressResult)) {
        throw new Error(`Failed to fetch user progress: ${progressResult.error.message}`)
      }
      
      const userProgress = progressResult.data

      const progressMap: Map<string, UserPortalProgress> = new Map((userProgress ?? []).map((p: UserPortalProgress) => [p.portal_id, p]))

      const accessible: Array<{portal: Database['public']['Tables']['portals']['Row']; access: PortalAccessPermissions}> = []
      for (const portal of portals ?? []) {
        const access = await this.checkPortalAccess(
          userId,
          portal.id,
          (profile?.subscription_tier as PortalSubscriptionTier) || ('free' as PortalSubscriptionTier),
          progressMap
        )

        if (access.canAccess) {
          accessible.push({
            ...portal,
            user_progress: progressMap.get(portal.id) || null,
            access_status: this.getPortalAccessStatus(progressMap.get(portal.id) || null),
          })
        }
      }

      this.cache.set(cacheKey, { data: accessible, timestamp: Date.now() })

      return {
        success: true,
        data: accessible,
        metadata: { execution_time_ms: Date.now() - startTime, cache_hit: false, data_freshness: 'fresh', api_version: '2.1.0-enterprise' },
      }
    } catch (error) {
      return { success: false, error: { code: 'PORTAL_ACCESS_ERROR', message: error instanceof Error ? error.message : 'Unknown error occurred', timestamp: new Date().toISOString() } }
    }
  }

  private async checkPortalAccess(
    _userId: string,
    portalId: string,
    subscriptionTier: PortalSubscriptionTier,
    progressMap: Map<string, UserPortalProgress>
  ): Promise<PortalAccessPermissions> {
    try {
      const result = await this.supabase.from('portals').select('*').eq('id', portalId).single()
      
      if (isQueryError(result)) {
        return { canAccess: false, requiresPayment: false, requiredTier: 'free', missingCriteria: ['Portal not found'] }
      }
      
      const portal = result.data
      if (!portal) {
        return { canAccess: false, requiresPayment: false, requiredTier: 'free', missingCriteria: ['Portal not found'] }
      }

      const missingCriteria: string[] = []
      let requiresPayment = false

      const pTier = (portal.subscription_tier as PortalSubscriptionTier) || ('free' as PortalSubscriptionTier)
      const sTier = subscriptionTier || ('free' as PortalSubscriptionTier)
      if (tierOrder[pTier] > tierOrder[sTier]) {
        missingCriteria.push(`Requires ${pTier} subscription`)
        requiresPayment = true
      }

      if (portal.required_previous_portal) {
        const prev = progressMap.get(portal.required_previous_portal)
        if (prev?.status !== 'completed') {missingCriteria.push('Previous portal must be completed')}
      }

      if (portal.category === 'activation') {
        return { canAccess: true, requiresPayment: false, requiredTier: 'free', missingCriteria: [] }
      }

      return { canAccess: missingCriteria.length === 0, requiresPayment, requiredTier: pTier, missingCriteria }
    } catch {
      return { canAccess: false, requiresPayment: false, requiredTier: 'free', missingCriteria: ['Error checking access'] }
    }
  }

  async unlockPortal(request: UnlockCheckRequest): Promise<ServiceResponse<PortalUnlockResult>> {
    try {
      const startTime = Date.now()

      const progressMap = new Map<string, UserPortalProgress>(Object.entries(request.current_progress || {}) as any)

      const access = await this.checkPortalAccess(request.user_id, request.portal_id, request.subscription_tier || 'free', progressMap)

      if (!access.canAccess) {
        return {
          success: true,
          data: {
            success: false,
            portal_id: request.portal_id,
            unlocked: false,
            criteria_met: false,
            missing_criteria: access.missingCriteria.map((d) => ({
              description: d,
              type: 'subscription' as const,
              current_value: 0,
              required_value: 1,
              satisfied: false,
              weight: 1
            })),
            recommended_actions: [],
            estimated_unlock_time: null,
            payment_required: access.requiresPayment
              ? {
                  required: true,
                  amount: 0,
                  currency: 'USD',
                  payment_type: 'subscription' as const,
                  subscription_tier: access.requiredTier
                }
              : null,
            special_conditions: null,
            evaluated_at: new Date().toISOString()
          },
          metadata: { execution_time_ms: Date.now() - startTime, cache_hit: false, data_freshness: 'fresh', api_version: '2.1.0-enterprise' },
        }
      }

      // Ensure a progress row exists
      const { data: existingProgress } = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', request.user_id)
        .eq('portal_id', request.portal_id)
        .maybeSingle()

      if (!existingProgress) {
        const { count: stepsCount } = await this.supabase
          .from('portal_steps')
          .select('*', { count: 'exact', head: true })
          .eq('portal_id', request.portal_id)
          .eq('is_active', true)

        const { error: insertError } = await this.supabase.from('user_portal_progress').insert({
          user_id: request.user_id,
          portal_id: request.portal_id,
          current_step: 1,
          total_steps: stepsCount || 0,
          progress_percentage: 0,
          status: 'unlocked',
          session_count: 0,
          achievement_points: 0,
          streak_days: 0,
          time_spent_minutes: 0,
          metadata: toJson({}),
        })
        if (insertError) {throw new Error(`Failed to create progress record: ${insertError.message}`)}
      }

      this.cache.delete(`user_portals_${request.user_id}`)
      this.cache.delete(`portal_progress_${request.user_id}_${request.portal_id}`)

      return {
        success: true,
        data: {
          success: true,
          portal_id: request.portal_id,
          unlocked: true,
          criteria_met: true,
          missing_criteria: null,
          recommended_actions: null,
          estimated_unlock_time: null,
          payment_required: null,
          special_conditions: null,
          evaluated_at: new Date().toISOString()
        },
        metadata: { execution_time_ms: Date.now() - startTime, cache_hit: false, data_freshness: 'fresh', api_version: '2.1.0-enterprise' },
      }
    } catch (error) {
      return { success: false, error: { code: 'PORTAL_UNLOCK_ERROR', message: error instanceof Error ? error.message : 'Failed to unlock portal', timestamp: new Date().toISOString() } }
    }
  }

  // ————————————————————————————————————————————————————————————————
  // PROGRESS TRACKING & MANAGEMENT
  // ————————————————————————————————————————————————————————————————
  async getPortalProgress(userId: string, portalId: string): Promise<ServiceResponse<UserPortalProgress & { steps: UserStepProgress[] }>> {
    try {
      const startTime = Date.now()
      const cacheKey = `portal_progress_${userId}_${portalId}`

      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.config.cacheTtlMinutes * 60 * 1000) {
          return { success: true, data: cached.data, metadata: { execution_time_ms: Date.now() - startTime, cache_hit: true, data_freshness: 'cached', api_version: '2.1.0-enterprise' } }
        }
      }

      const progressResult = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('portal_id', portalId)
        .single()

      if (isQueryError(progressResult)) {
        throw new Error(`Failed to fetch portal progress: ${progressResult.error.message}`)
      }
      
      const progress = progressResult.data

      const stepProgressResult = await this.supabase
        .from('user_step_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('portal_id', portalId)
        .order('created_at')

      if (isQueryError(stepProgressResult)) {
        throw new Error(`Failed to fetch step progress: ${stepProgressResult.error.message}`)
      }
      
      const stepProgress = stepProgressResult.data

      const result = { ...progress, steps: (stepProgress ?? []) as UserStepProgress[] }
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })

      return { success: true, data: result, metadata: { execution_time_ms: Date.now() - startTime, cache_hit: false, data_freshness: 'fresh', api_version: '2.1.0-enterprise' } }
    } catch (error) {
      return { success: false, error: { code: 'PROGRESS_FETCH_ERROR', message: error instanceof Error ? error.message : 'Failed to fetch progress', timestamp: new Date().toISOString() } }
    }
  }

  async updateProgress(request: ProgressUpdateRequest): Promise<ServiceResponse<UserPortalProgress>> {
    try {
      const startTime = Date.now()

      const currentResult = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', request.user_id)
        .eq('portal_id', request.portal_id)
        .single()

      if (isQueryError(currentResult)) {
        throw new Error(`Failed to fetch current progress: ${currentResult.error.message}`)
      }
      
      const current = currentResult.data

      const newPct = this.calculateCompletionPercentage(current, request.progress_data ?? {})
      const newStatus = this.determineProgressStatus(current, newPct, request.progress_data ?? {})

      const updatedPayload = {
        progress_percentage: newPct,
        status: newStatus,
        last_activity_at: new Date().toISOString(),
        time_spent_minutes: safeNumber(current.time_spent_minutes, 0) + safeNumber((request.progress_data as Record<string, number> | undefined)?.['time_spent_minutes'], 0),
        session_count: safeNumber(current.session_count, 0) + (((request.progress_data as Record<string, boolean> | undefined)?.['new_session']) ? 1 : 0),
        metadata: toJson({ ...current.metadata, ...(request.progress_data ?? {}) }),
      }

      const updatedResult = await this.supabase
        .from('user_portal_progress')
        .update(updatedPayload)
        .eq('user_id', request.user_id)
        .eq('portal_id', request.portal_id)
        .select()
        .single()

      if (isQueryError(updatedResult)) {
        throw new Error(`Failed to update progress: ${updatedResult.error.message}`)
      }
      
      const updated = updatedResult.data
      if (request.step_id) {await this.updateStepProgress(request)}
      if (request.biometric_reading) {await this.storeBiometricReading(request.biometric_reading)}

      this.cache.delete(`portal_progress_${request.user_id}_${request.portal_id}`)
      this.cache.delete(`user_portals_${request.user_id}`)

      if (newStatus === 'completed') {await this.handlePortalCompletion(request.user_id, request.portal_id)}

      return { success: true, data: updated as UserPortalProgress, metadata: { execution_time_ms: Date.now() - startTime, cache_hit: false, data_freshness: 'fresh', api_version: '2.1.0-enterprise' } }
    } catch (error) {
      if (this.config.enableOfflineSync) {
        this.addToOfflineQueue({
          id: crypto.randomUUID(),
          user_id: request.user_id,
          operation_type: 'progress_update',
          portal_id: request.portal_id,
          step_id: request.step_id || null,
          data: request.progress_data || {},
          timestamp: new Date().toISOString(),
          retry_count: 0,
          max_retries: this.config.maxRetries,
          priority: 1,
          status: 'pending',
          last_error: null,
        })
      }

      return { success: false, error: { code: 'PROGRESS_UPDATE_ERROR', message: error instanceof Error ? error.message : 'Failed to update progress', timestamp: new Date().toISOString() } }
    }
  }

  // ————————————————————————————————————————————————————————————————
  // PORTAL SESSION MANAGEMENT
  // ————————————————————————————————————————————————————————————————
  async startPortalSession(userId: string, portalId: string): Promise<ServiceResponse<PortalSession>> {
    try {
      const insertPayload = { user_id: userId, portal_id: portalId, session_start: new Date().toISOString(), session_data: toJson({}) }
      const result = await this.supabase.from('portal_sessions').insert(insertPayload).select().single()
      
      if (isQueryError(result)) {
        throw new Error(`Failed to create session: ${result.error.message}`)
      }
      
      return { success: true, data: result.data as PortalSession }
    } catch (error) {
      return { success: false, error: { code: 'SESSION_START_ERROR', message: error instanceof Error ? error.message : 'Failed to start session', timestamp: new Date().toISOString() } }
    }
  }

  async endPortalSession(sessionId: string, sessionData: Partial<PortalSession>): Promise<ServiceResponse<PortalSession>> {
    try {
      const result = await this.supabase
        .from('portal_sessions')
        .update({
          session_end: new Date().toISOString(),
          duration_minutes: safeNumber((sessionData as Record<string, number>)['duration_minutes'], 0),
          session_data: toJson((sessionData as Record<string, unknown>)['session_data'] ?? {}),
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (isQueryError(result)) {
        throw new Error(`Failed to end session: ${result.error.message}`)
      }
      
      return { success: true, data: result.data as PortalSession }
    } catch (error) {
      return { success: false, error: { code: 'SESSION_END_ERROR', message: error instanceof Error ? error.message : 'Failed to end session', timestamp: new Date().toISOString() } }
    }
  }

  // ————————————————————————————————————————————————————————————————
  // HELPERS
  // ————————————————————————————————————————————————————————————————
  private calculateCompletionPercentage(current: UserPortalProgress, progressData: Record<string, any>): number {
    if (typeof (progressData as any).progress_percentage === 'number') {
      const v = (progressData as any).progress_percentage
      return Math.min(100, Math.max(0, v))
    }

    if (typeof (progressData as any).steps_completed === 'number' && typeof (current as any).total_steps === 'number') {
      const steps = Math.max(0, (progressData as any).steps_completed)
      const total = Math.max(1, safeNumber((current as any).total_steps, 1))
      return Math.round((steps / total) * 100)
    }

    return safeNumber((current as any).progress_percentage, 0)
  }

  private determineProgressStatus(current: UserPortalProgress, pct: number, progressData: Record<string, any>): PortalProgressStatus {
    if ((progressData as any).force_status) {return (progressData as any).force_status}
    if (pct >= 100) {return 'completed'}
    if (pct > 0) {return 'in_progress'}
    return (current as any).status
  }

  private getPortalAccessStatus(progress?: UserPortalProgress | null): string {
    if (!progress) {return 'locked'}
    return (progress as any).status || 'locked'
  }

  private async handlePortalCompletion(userId: string, portalId: string): Promise<void> {
    try {
      await this.supabase
        .from('user_portal_progress')
        .update({ completed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('portal_id', portalId)
      // TODO: achievements & next-portal unlock
    } catch (error) {
      console.error('Error handling portal completion:', error)
    }
  }

  private async updateStepProgress(request: ProgressUpdateRequest): Promise<void> {
    if (!request.step_id) {return}

    await this.supabase
      .from('user_step_progress')
      .upsert({
        user_id: request.user_id,
        portal_id: request.portal_id,
        step_id: request.step_id,
        status: (request.progress_data as any).step_status || 'in_progress',
        time_spent_minutes: safeNumber((request.progress_data as any).step_time_spent, 0),
        quality_score: (request as any).quality_score,
        data: toJson((request.progress_data as any).step_data || {}),
      }, { onConflict: 'user_id,portal_id,step_id' })
  }

  private async storeBiometricReading(reading: BiometricReading): Promise<void> {
    await this.supabase.from('biometric_scans').insert({
      user_id: reading.user_id,
      scan_type: reading.type,
      analysis_results: toJson({ values: reading.values }),
      confidence_score: (reading as any).confidence_score ?? 1,
      scan_data: toJson({ raw: reading }),
    })
  }

  private addToOfflineQueue(operation: OfflineOperation): void {
    this.offlineQueue.push(operation)
    if (typeof window !== 'undefined') {localStorage.setItem('porverse_offline_queue', JSON.stringify(this.offlineQueue))}
  }

  private setupRealtimeSubscriptions(): void {
    // TODO: Implement realtime subscriptions (channels on tables)
  }

  private initializeOfflineSync(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('porverse_offline_queue')
      if (stored) {this.offlineQueue = JSON.parse(stored)}
    }
  }

  async processOfflineQueue(): Promise<void> {
    const queue = [...this.offlineQueue]
    this.offlineQueue = []

    for (const operation of queue) {
      try {
        switch (operation.operation_type) {
          case 'progress_update':
            await this.updateProgress({
              user_id: operation.user_id,
              portal_id: operation.portal_id!,
              step_id: operation.step_id || undefined,
              progress_data: operation.data,
            } as any)
            break
        }
      } catch (error) {
        if (operation.retry_count < operation.max_retries) {
          this.offlineQueue.push({ ...operation, retry_count: operation.retry_count + 1, last_error: (error as Error).message, status: 'pending' })
        }
      }
    }

    if (typeof window !== 'undefined') {localStorage.setItem('porverse_offline_queue', JSON.stringify(this.offlineQueue))}
  }
}

export function createPortalManager(overrides?: Partial<PortalManagerConfig>): PortalManager {
  const config: PortalManagerConfig = {
    supabaseUrl: process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    supabaseKey: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    enableRealtime: true,
    enableOfflineSync: true,
    cacheTtlMinutes: 5,
    maxRetries: 3,
    ...overrides,
  }
  return new PortalManager(config)
}

let portalManagerInstance: PortalManager | null = null
export function getPortalManager(): PortalManager {
  if (!portalManagerInstance) {portalManagerInstance = createPortalManager()}
  return portalManagerInstance
}

export default PortalManager
