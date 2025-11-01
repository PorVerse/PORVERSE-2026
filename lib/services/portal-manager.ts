// lib/services/portal-manager.ts
/**
 * 🎯 PorVerse V2 - Portal Manager Service
 * Core service managing portal progression, unlocking, and state management
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Central brain for portal-based spiritual operating system
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'
import type {
  Portal,
  PortalStep,
  UserPortalProgress,
  UserStepProgress,
  PortalProgressStatus,
  PortalSubscriptionTier,
  PortalUnlockResult,
  ServiceResponse,
  ProgressUpdateRequest,
  UnlockCheckRequest,
  PortalSession,
  BiometricReading,
  OfflineOperation,
  PortalDifficulty
} from '../../types/portal-management'

/**
 * Configuration for Portal Manager Service
 */
interface PortalManagerConfig {
  supabaseUrl: string
  supabaseKey: string
  enableRealtime: boolean
  enableOfflineSync: boolean
  cacheTtlMinutes: number
  maxRetries: number
}

/**
 * Portal access permissions based on subscription
 */
interface PortalAccessPermissions {
  canAccess: boolean
  requiresPayment: boolean
  requiredTier: PortalSubscriptionTier
  missingCriteria: string[]
}

/**
 * Portal Manager Service Class
 * Handles all portal-related operations including progression, unlocking, and state management
 */
export class PortalManager {
  private supabase: SupabaseClient<Database>
  private config: PortalManagerConfig
  private cache: Map<string, any> = new Map()
  private offlineQueue: OfflineOperation[] = []
  
  /**
   * Initialize Portal Manager with configuration
   */
  constructor(config: PortalManagerConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    
    if (config.enableRealtime) {
      this.setupRealtimeSubscriptions()
    }
    
    if (config.enableOfflineSync) {
      this.initializeOfflineSync()
    }
  }

  // ============================================================================
  // PORTAL ACCESS & UNLOCKING
  // ============================================================================

  /**
   * Get all portals accessible to a user based on their progress and subscription
   * @param userId - User identifier
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns Promise with user's accessible portals
   */
  async getUserPortalAccess(
    userId: string, 
    forceRefresh: boolean = false
  ): Promise<ServiceResponse<Portal[]>> {
    try {
      const startTime = Date.now()
      const cacheKey = `user_portals_${userId}`
      
      // Check cache first unless force refresh
      if (!forceRefresh && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.config.cacheTtlMinutes * 60 * 1000) {
          return {
            success: true,
            data: cached.data,
            metadata: {
              execution_time_ms: Date.now() - startTime,
              cache_hit: true,
              data_freshness: 'cached',
              api_version: '2.0.0'
            }
          }
        }
      }

      // Get user profile and subscription status
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, quantum_vault_unlocked')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`)
      }

      // Get all active portals with their unlock criteria
      const { data: portals, error: portalsError } = await this.supabase
        .from('portals')
        .select(`
          *,
          portal_steps!inner(count)
        `)
        .eq('is_active', true)
        .order('order_index')

      if (portalsError) {
        throw new Error(`Failed to fetch portals: ${portalsError.message}`)
      }

      // Get user's current progress for all portals
      const { data: userProgress, error: progressError } = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', userId)

      if (progressError) {
        throw new Error(`Failed to fetch user progress: ${progressError.message}`)
      }

      // Filter portals based on access permissions
      const accessiblePortals: Portal[] = []
      const progressMap = new Map(userProgress?.map(p => [p.portal_id, p]) || [])

      for (const portal of portals) {
        const access = await this.checkPortalAccess(
          userId,
          portal.id,
          profile.subscription_tier,
          progressMap
        )

        if (access.canAccess) {
          accessiblePortals.push({
            ...portal,
            // Add computed fields
            user_progress: progressMap.get(portal.id),
            access_status: this.getPortalAccessStatus(portal, progressMap.get(portal.id))
          } as Portal)
        }
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: accessiblePortals,
        timestamp: Date.now()
      })

      return {
        success: true,
        data: accessiblePortals,
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
          code: 'PORTAL_ACCESS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Check if user can access a specific portal
   * @param userId - User identifier
   * @param portalId - Portal to check access for
   * @param subscriptionTier - User's current subscription tier
   * @param progressMap - Map of user's portal progress
   * @returns Portal access permissions
   */
  private async checkPortalAccess(
    userId: string,
    portalId: string,
    subscriptionTier: PortalSubscriptionTier,
    progressMap: Map<string, UserPortalProgress>
  ): Promise<PortalAccessPermissions> {
    try {
      // Get portal details with unlock criteria
      const { data: portal, error } = await this.supabase
        .from('portals')
        .select('*')
        .eq('id', portalId)
        .single()

      if (error || !portal) {
        return {
          canAccess: false,
          requiresPayment: false,
          requiredTier: 'free',
          missingCriteria: ['Portal not found']
        }
      }

      const missingCriteria: string[] = []
      let requiresPayment = false

      // Check subscription tier requirement
      const tierOrder = { free: 0, basic: 1, premium: 2, quantum: 3 }
      if (tierOrder[portal.subscription_tier] > tierOrder[subscriptionTier]) {
        missingCriteria.push(`Requires ${portal.subscription_tier} subscription`)
        requiresPayment = true
      }

      // Check required previous portal completion
      if (portal.required_previous_portal) {
        const previousProgress = progressMap.get(portal.required_previous_portal)
        if (!previousProgress || previousProgress.status !== 'completed') {
          missingCriteria.push('Previous portal must be completed')
        }
      }

      // P0 (Personal Activation) is always accessible to authenticated users
      if (portal.category === 'activation') {
        return {
          canAccess: true,
          requiresPayment: false,
          requiredTier: 'free',
          missingCriteria: []
        }
      }

      return {
        canAccess: missingCriteria.length === 0,
        requiresPayment,
        requiredTier: portal.subscription_tier,
        missingCriteria
      }

    } catch (error) {
      return {
        canAccess: false,
        requiresPayment: false,
        requiredTier: 'free',
        missingCriteria: ['Error checking access']
      }
    }
  }

  /**
   * Attempt to unlock a portal for a user
   * @param request - Unlock check request with user and portal details
   * @returns Portal unlock result
   */
  async unlockPortal(request: UnlockCheckRequest): Promise<ServiceResponse<PortalUnlockResult>> {
    try {
      const startTime = Date.now()
      
      // Check current access permissions
      const progressMap = new Map(
        Object.entries(request.current_progress).map(([id, progress]) => [id, progress])
      )
      
      const access = await this.checkPortalAccess(
        request.user_id,
        request.portal_id,
        request.subscription_tier,
        progressMap
      )

      if (!access.canAccess) {
        return {
          success: true,
          data: {
            success: false,
            portal_id: request.portal_id,
            unlocked: false,
            missing_criteria: access.missingCriteria,
            payment_required: access.requiresPayment ? {
              required_tier: access.requiredTier,
              price_monthly: 0, // To be fetched from pricing config
              price_yearly: 0,  // To be fetched from pricing config
              currency: 'USD',
              benefits: [],
              trial_available: true
            } : undefined
          },
          metadata: {
            execution_time_ms: Date.now() - startTime,
            cache_hit: false,
            data_freshness: 'fresh',
            api_version: '2.0.0'
          }
        }
      }

      // Portal can be unlocked - create initial progress record
      const { data: existingProgress } = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', request.user_id)
        .eq('portal_id', request.portal_id)
        .single()

      if (!existingProgress) {
        // Get portal steps count for total_steps
        const { count: stepsCount } = await this.supabase
          .from('portal_steps')
          .select('*', { count: 'exact' })
          .eq('portal_id', request.portal_id)
          .eq('is_active', true)

        // Create new progress record
        const { error: insertError } = await this.supabase
          .from('user_portal_progress')
          .insert({
            user_id: request.user_id,
            portal_id: request.portal_id,
            current_step: 1,
            total_steps: stepsCount || 0,
            completion_percentage: 0,
            status: 'unlocked',
            difficulty_adjustment: 'intermediate',
            session_count: 0,
            achievement_points: 0,
            streak_days: 0,
            time_spent_minutes: 0,
            metadata: {}
          })

        if (insertError) {
          throw new Error(`Failed to create progress record: ${insertError.message}`)
        }
      }

      // Clear relevant caches
      this.cache.delete(`user_portals_${request.user_id}`)
      this.cache.delete(`portal_progress_${request.user_id}_${request.portal_id}`)

      return {
        success: true,
        data: {
          success: true,
          portal_id: request.portal_id,
          unlocked: true
        },
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
          code: 'PORTAL_UNLOCK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to unlock portal',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // ============================================================================
  // PROGRESS TRACKING & MANAGEMENT
  // ============================================================================

  /**
   * Get detailed progress for a specific portal
   * @param userId - User identifier
   * @param portalId - Portal identifier
   * @returns Portal progress with step details
   */
  async getPortalProgress(
    userId: string, 
    portalId: string
  ): Promise<ServiceResponse<UserPortalProgress & { steps: UserStepProgress[] }>> {
    try {
      const startTime = Date.now()
      const cacheKey = `portal_progress_${userId}_${portalId}`
      
      // Check cache
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.config.cacheTtlMinutes * 60 * 1000) {
          return {
            success: true,
            data: cached.data,
            metadata: {
              execution_time_ms: Date.now() - startTime,
              cache_hit: true,
              data_freshness: 'cached',
              api_version: '2.0.0'
            }
          }
        }
      }

      // Get portal progress
      const { data: progress, error: progressError } = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('portal_id', portalId)
        .single()

      if (progressError) {
        throw new Error(`Failed to fetch portal progress: ${progressError.message}`)
      }

      // Get step progress
      const { data: stepProgress, error: stepError } = await this.supabase
        .from('user_step_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('portal_id', portalId)
        .order('created_at')

      if (stepError) {
        throw new Error(`Failed to fetch step progress: ${stepError.message}`)
      }

      const result = {
        ...progress,
        steps: stepProgress || []
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

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
          code: 'PROGRESS_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch progress',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Update user progress for a portal step
   * @param request - Progress update request
   * @returns Updated progress data
   */
  async updateProgress(request: ProgressUpdateRequest): Promise<ServiceResponse<UserPortalProgress>> {
    try {
      const startTime = Date.now()

      // Start transaction for atomic updates
      const { data: currentProgress, error: fetchError } = await this.supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', request.user_id)
        .eq('portal_id', request.portal_id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch current progress: ${fetchError.message}`)
      }

      // Calculate new completion percentage
      const newCompletionPercentage = this.calculateCompletionPercentage(
        currentProgress,
        request.progress_data
      )

      // Determine new status
      const newStatus = this.determineProgressStatus(
        currentProgress,
        newCompletionPercentage,
        request.progress_data
      )

      // Update portal progress
      const { data: updatedProgress, error: updateError } = await this.supabase
        .from('user_portal_progress')
        .update({
          completion_percentage: newCompletionPercentage,
          status: newStatus,
          last_activity_at: new Date().toISOString(),
          time_spent_minutes: currentProgress.time_spent_minutes + (request.progress_data.time_spent_minutes || 0),
          session_count: currentProgress.session_count + (request.progress_data.new_session ? 1 : 0),
          metadata: {
            ...currentProgress.metadata,
            ...request.progress_data
          }
        })
        .eq('user_id', request.user_id)
        .eq('portal_id', request.portal_id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update progress: ${updateError.message}`)
      }

      // Update step progress if step_id provided
      if (request.step_id) {
        await this.updateStepProgress(request)
      }

      // Store biometric reading if provided
      if (request.biometric_reading) {
        await this.storeBiometricReading(request.biometric_reading)
      }

      // Clear relevant caches
      this.cache.delete(`portal_progress_${request.user_id}_${request.portal_id}`)
      this.cache.delete(`user_portals_${request.user_id}`)

      // Check for achievements and unlock next portal if completed
      if (newStatus === 'completed') {
        await this.handlePortalCompletion(request.user_id, request.portal_id)
      }

      return {
        success: true,
        data: updatedProgress,
        metadata: {
          execution_time_ms: Date.now() - startTime,
          cache_hit: false,
          data_freshness: 'fresh',
          api_version: '2.0.0'
        }
      }

    } catch (error) {
      // Add to offline queue if in offline mode
      if (this.config.enableOfflineSync) {
        this.addToOfflineQueue({
          id: crypto.randomUUID(),
          user_id: request.user_id,
          operation_type: 'progress_update',
          portal_id: request.portal_id,
          step_id: request.step_id,
          data: request.progress_data,
          timestamp: new Date().toISOString(),
          retry_count: 0,
          max_retries: this.config.maxRetries,
          priority: 1
        })
      }

      return {
        success: false,
        error: {
          code: 'PROGRESS_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update progress',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // ============================================================================
  // PORTAL SESSION MANAGEMENT
  // ============================================================================

  /**
   * Start a new portal session
   * @param userId - User identifier
   * @param portalId - Portal identifier
   * @returns Session tracking data
   */
  async startPortalSession(userId: string, portalId: string): Promise<ServiceResponse<PortalSession>> {
    try {
      const session: PortalSession = {
        id: crypto.randomUUID(),
        user_id: userId,
        portal_id: portalId,
        session_start: new Date().toISOString(),
        steps_completed: 0,
        biometric_readings: [],
        ai_interactions: 0,
        session_data: {}
      }

      // Store session in database
      const { data, error } = await this.supabase
        .from('portal_sessions')
        .insert(session)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`)
      }

      return {
        success: true,
        data: data as PortalSession
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SESSION_START_ERROR',
          message: error instanceof Error ? error.message : 'Failed to start session',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * End a portal session
   * @param sessionId - Session identifier
   * @param sessionData - Final session data
   * @returns Updated session data
   */
  async endPortalSession(
    sessionId: string, 
    sessionData: Partial<PortalSession>
  ): Promise<ServiceResponse<PortalSession>> {
    try {
      const { data, error } = await this.supabase
        .from('portal_sessions')
        .update({
          session_end: new Date().toISOString(),
          duration_minutes: sessionData.duration_minutes,
          steps_completed: sessionData.steps_completed,
          quality_score: sessionData.quality_score,
          session_data: sessionData.session_data
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to end session: ${error.message}`)
      }

      return {
        success: true,
        data: data as PortalSession
      }

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SESSION_END_ERROR',
          message: error instanceof Error ? error.message : 'Failed to end session',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate completion percentage based on progress data
   */
  private calculateCompletionPercentage(
    currentProgress: UserPortalProgress,
    progressData: Record<string, any>
  ): number {
    if (progressData.completion_percentage !== undefined) {
      return Math.min(100, Math.max(0, progressData.completion_percentage))
    }

    // Calculate based on steps completed
    if (progressData.steps_completed !== undefined) {
      return Math.round((progressData.steps_completed / currentProgress.total_steps) * 100)
    }

    return currentProgress.completion_percentage
  }

  /**
   * Determine new progress status based on completion
   */
  private determineProgressStatus(
    currentProgress: UserPortalProgress,
    completionPercentage: number,
    progressData: Record<string, any>
  ): PortalProgressStatus {
    if (progressData.force_status) {
      return progressData.force_status
    }

    if (completionPercentage >= 100) {
      return 'completed'
    }

    if (completionPercentage > 0) {
      return 'in_progress'
    }

    return currentProgress.status
  }

  /**
   * Get portal access status for UI display
   */
  private getPortalAccessStatus(portal: Portal, progress?: UserPortalProgress): string {
    if (!progress) return 'locked'
    return progress.status
  }

  /**
   * Handle portal completion logic
   */
  private async handlePortalCompletion(userId: string, portalId: string): Promise<void> {
    try {
      // Update completion timestamp
      await this.supabase
        .from('user_portal_progress')
        .update({
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('portal_id', portalId)

      // Check for achievements
      // TODO: Implement achievement checking logic

      // Check if next portal should be unlocked
      // TODO: Implement next portal unlocking logic

    } catch (error) {
      console.error('Error handling portal completion:', error)
    }
  }

  /**
   * Update individual step progress
   */
  private async updateStepProgress(request: ProgressUpdateRequest): Promise<void> {
    if (!request.step_id) return

    // Upsert step progress
    await this.supabase
      .from('user_step_progress')
      .upsert({
        user_id: request.user_id,
        portal_id: request.portal_id,
        step_id: request.step_id,
        status: request.progress_data.step_status || 'in_progress',
        time_spent_minutes: request.progress_data.step_time_spent || 0,
        quality_score: request.quality_score,
        data: request.progress_data.step_data || {},
        ai_interaction_count: request.progress_data.ai_interactions || 0
      })
  }

  /**
   * Store biometric reading
   */
  private async storeBiometricReading(reading: BiometricReading): Promise<void> {
    await this.supabase
      .from('biometric_scans')
      .insert({
        user_id: reading.user_id,
        scan_type: reading.type,
        emotion_data: { values: reading.values },
        confidence_scores: { overall: reading.confidence_score },
        privacy_level: 'private'
      })
  }

  /**
   * Add operation to offline queue
   */
  private addToOfflineQueue(operation: OfflineOperation): void {
    this.offlineQueue.push(operation)
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('porverse_offline_queue', JSON.stringify(this.offlineQueue))
    }
  }

  /**
   * Setup realtime subscriptions for progress updates
   */
  private setupRealtimeSubscriptions(): void {
    // TODO: Implement realtime subscriptions
  }

  /**
   * Initialize offline sync capabilities
   */
  private initializeOfflineSync(): void {
    // Load offline queue from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('porverse_offline_queue')
      if (stored) {
        this.offlineQueue = JSON.parse(stored)
      }
    }
  }

  /**
   * Process offline queue when online
   */
  async processOfflineQueue(): Promise<void> {
    const queue = [...this.offlineQueue]
    this.offlineQueue = []

    for (const operation of queue) {
      try {
        // Process each operation based on type
        switch (operation.operation_type) {
          case 'progress_update':
            await this.updateProgress({
              user_id: operation.user_id,
              portal_id: operation.portal_id!,
              step_id: operation.step_id,
              progress_data: operation.data
            })
            break
          // Add other operation types as needed
        }
      } catch (error) {
        // Re-queue failed operations with incremented retry count
        if (operation.retry_count < operation.max_retries) {
          this.offlineQueue.push({
            ...operation,
            retry_count: operation.retry_count + 1
          })
        }
      }
    }

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('porverse_offline_queue', JSON.stringify(this.offlineQueue))
    }
  }
}

/**
 * Create Portal Manager instance with default configuration
 */
export function createPortalManager(overrides?: Partial<PortalManagerConfig>): PortalManager {
  const config: PortalManagerConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    enableRealtime: true,
    enableOfflineSync: true,
    cacheTtlMinutes: 5,
    maxRetries: 3,
    ...overrides
  }

  return new PortalManager(config)
}

/**
 * Singleton Portal Manager instance
 */
let portalManagerInstance: PortalManager | null = null

export function getPortalManager(): PortalManager {
  if (!portalManagerInstance) {
    portalManagerInstance = createPortalManager()
  }
  return portalManagerInstance
}

export default PortalManager