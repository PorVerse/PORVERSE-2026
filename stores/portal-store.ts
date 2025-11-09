// stores/portal-store.ts
/**
 * 🎯 PorVerse V2 - Portal State Management Store
 * Zustand store for managing portal state, progress, and real-time updates
 * 
 * @version 2.1.0-enterprise
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Portal,
  UserPortalProgress,
  UserStepProgress,
  PortalSession,
  Achievement,
  UserAchievement,
  PortalProgressStatus,
  PortalSubscriptionTier,
  BiometricReading,
  PortalUnlockResult,
  OfflineOperation,
  UnlockCriterion,
} from '../types/portal-management'
import { getPortalManager } from '../lib/services/portal-manager'
import { createProgressTracker } from '../lib/services/progress-tracker'
import { createUnlockEngine } from '../lib/services/unlock-engine'

// ————————————————————————————————————————————————————————————————
// Small utils
// ————————————————————————————————————————————————————————————————
const nowIso = () => new Date().toISOString()

// Fallback helper for building an UnlockCriterion when we only have a message
const criterionFromMessage = (message: string): UnlockCriterion => ({
  type: 'special' as UnlockCriterion['type'],
  description: message,
  currentValue: null,
  requiredValue: null,
  satisfied: false,
  weight: 1,
})

// Enforce required OfflineOperation fields
const makeOfflineOpBase = (partial: Partial<OfflineOperation>): OfflineOperation => ({
  id: crypto.randomUUID(),
  user_id: partial.user_id!,
  operation_type: partial.operation_type!,
  portal_id: partial.portal_id ?? '',
  step_id: partial.step_id ?? '',
  data: partial.data ?? {},
  timestamp: partial.timestamp ?? nowIso(),
  retry_count: partial.retry_count ?? 0,
  max_retries: partial.max_retries ?? 3,
  priority: partial.priority ?? 1,
  status: partial.status ?? 'queued',
  last_error: partial.last_error ?? null,
})

/**
 * Portal store state interface
 */
interface PortalState {
  // === USER STATE ===
  userId: string | null
  subscriptionTier: PortalSubscriptionTier
  quantumVaultUnlocked: boolean

  // === PORTAL DATA ===
  portals: Portal[]
  userProgress: Record<string, UserPortalProgress>
  stepProgress: Record<string, UserStepProgress[]>
  achievements: Achievement[]
  userAchievements: UserAchievement[]

  // === CURRENT SESSION ===
  currentPortal: Portal | null
  currentSession: PortalSession | null
  activeStepId: string | null

  // === UI STATE ===
  isLoading: boolean
  isOffline: boolean
  lastSyncTime: string | null
  error: string | null
  offlineQueue: OfflineOperation[]

  // === REAL-TIME DATA ===
  recentBiometricReadings: BiometricReading[]
  sessionStartTime: number | null
  stepStartTime: number | null

  // === CACHED DATA ===
  portalAnalytics: Record<string, any>
  progressInsights: Record<string, any>
}

/**
 * Portal store actions interface
 */
interface PortalActions {
  // === INITIALIZATION ===
  initialize: (userId: string) => Promise<void>
  reset: () => void
  setUserId: (userId: string | null) => void
  setSubscriptionTier: (tier: PortalSubscriptionTier) => void

  // === PORTAL MANAGEMENT ===
  loadUserPortals: (forceRefresh?: boolean) => Promise<void>
  unlockPortal: (portalId: string) => Promise<PortalUnlockResult>
  selectPortal: (portal: Portal) => void
  clearCurrentPortal: () => void

  // === PROGRESS TRACKING ===
  updateProgress: (
    portalId: string,
    progressData: Partial<UserPortalProgress>
  ) => Promise<void>
  completeStep: (
    portalId: string,
    stepId: string,
    stepData: any,
    qualityScore?: number
  ) => Promise<void>
  startStep: (stepId: string) => void
  pauseStep: () => void

  // === SESSION MANAGEMENT ===
  startPortalSession: (portalId: string) => Promise<void>
  endPortalSession: () => Promise<void>
  updateSessionData: (data: Partial<PortalSession>) => void

  // === BIOMETRIC INTEGRATION ===
  addBiometricReading: (reading: BiometricReading) => void
  getBiometricTrends: (portalId?: string) => BiometricReading[]

  // === ACHIEVEMENTS ===
  loadAchievements: () => Promise<void>
  awardAchievement: (achievementId: string) => void
  markAchievementSeen: (achievementId: string) => void

  // === OFFLINE SUPPORT ===
  addToOfflineQueue: (operation: OfflineOperation) => void
  processOfflineQueue: () => Promise<void>
  setOfflineStatus: (isOffline: boolean) => void

  // === REAL-TIME UPDATES ===
  subscribeToRealtimeUpdates: () => void
  unsubscribeFromRealtimeUpdates: () => void

  // === ERROR HANDLING ===
  setError: (error: string | null) => void
  clearError: () => void
  setLoading: (loading: boolean) => void

  // === ANALYTICS & INSIGHTS ===
  loadPortalAnalytics: (portalId: string) => Promise<void>
  getProgressInsights: (userId: string) => Promise<any>
  
  // === CULTURAL ADAPTATION ===
  updateCulturalContext: (context: any) => void
}

/**
 * Combined portal store interface
 */
export type PortalStore = PortalState & PortalActions

/**
 * Create Portal Store with Zustand
 */
export const usePortalStore = create<PortalStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // ========================================================================
        // INITIAL STATE
        // ========================================================================
        userId: null,
        subscriptionTier: 'free',
        quantumVaultUnlocked: false,
        portals: [],
        userProgress: {},
        stepProgress: {},
        achievements: [],
        userAchievements: [],
        currentPortal: null,
        currentSession: null,
        activeStepId: null,
        isLoading: false,
        isOffline: false,
        lastSyncTime: null,
        error: null,
        offlineQueue: [],
        recentBiometricReadings: [],
        sessionStartTime: null,
        stepStartTime: null,
        portalAnalytics: {},
        progressInsights: {},

        // ========================================================================
        // INITIALIZATION ACTIONS
        // ========================================================================

        /**
         * Initialize store with user data
         */
        initialize: async (userId: string) => {
          set((state) => {
            state.userId = userId
            state.isLoading = true
            state.error = null
          })

          try {
            await get().loadUserPortals(true)
            await get().loadAchievements()
            get().subscribeToRealtimeUpdates()
            if (get().offlineQueue.length > 0) {
              await get().processOfflineQueue()
            }
            set((state) => {
              state.isLoading = false
              state.lastSyncTime = nowIso()
            })
          } catch (error) {
            set((state) => {
              state.isLoading = false
              state.error = error instanceof Error ? error.message : 'Initialization failed'
            })
          }
        },

        /** Reset store to initial state */
        reset: () => {
          set((state) => {
            state.userId = null
            state.subscriptionTier = 'free'
            state.quantumVaultUnlocked = false
            state.portals = []
            state.userProgress = {}
            state.stepProgress = {}
            state.achievements = []
            state.userAchievements = []
            state.currentPortal = null
            state.currentSession = null
            state.activeStepId = null
            state.isLoading = false
            state.error = null
            state.recentBiometricReadings = []
            state.sessionStartTime = null
            state.stepStartTime = null
            state.portalAnalytics = {}
            state.progressInsights = {}
          })
          get().unsubscribeFromRealtimeUpdates()
        },

        /** Set user ID */
        setUserId: (userId: string | null) => {
          set((state) => { state.userId = userId })
        },

        /** Set subscription tier */
        setSubscriptionTier: (tier: PortalSubscriptionTier) => {
          set((state) => { state.subscriptionTier = tier })
        },

        // ========================================================================
        // PORTAL MANAGEMENT ACTIONS
        // ========================================================================

        /** Load user's accessible portals */
        loadUserPortals: async (forceRefresh = false) => {
          const { userId } = get()
          if (!userId) return

          set((state) => { state.isLoading = true })

          try {
            const portalManager = getPortalManager()
            const response = await portalManager.getUserPortalAccess(userId, forceRefresh)

            if (response.success && response.data) {
              set((state) => {
                state.portals = response.data!
                response.data!.forEach((portal: any) => {
                  if (portal.user_progress) {
                    state.userProgress[portal.id] = portal.user_progress
                  }
                })
                state.isLoading = false
                state.error = null
                state.lastSyncTime = nowIso()
              })
            } else {
              throw new Error(response.error?.message || 'Failed to load portals')
            }
          } catch (error) {
            set((state) => {
              state.isLoading = false
              state.error = error instanceof Error ? error.message : 'Failed to load portals'
            })

            if (get().isOffline) {
              const { userId } = get()
              if (userId) {
                get().addToOfflineQueue(
                  makeOfflineOpBase({
                    user_id: userId,
                    operation_type: 'progress_update',
                    data: { operation: 'load_portals' },
                    priority: 2,
                  })
                )
              }
            }
          }
        },

        /** Unlock a portal */
        unlockPortal: async (portalId: string): Promise<PortalUnlockResult> => {
          const { userId, subscriptionTier, userProgress } = get()
          if (!userId) throw new Error('User not authenticated')

          try {
            const unlockEngine = createUnlockEngine()
            const response = await unlockEngine.evaluateUnlockCriteria(userId, portalId)

            if (response.success && response.data?.canUnlock) {
              const portalManager = getPortalManager()
              const unlockResponse = await portalManager.unlockPortal({
                user_id: userId,
                portal_id: portalId,
                subscription_tier: subscriptionTier,
                current_progress: userProgress,
              })

              if (unlockResponse.success && unlockResponse.data) {
                await get().loadUserPortals(true)
                return unlockResponse.data
              }
            }

            const missing = (response.data?.missingCriteria || []).map<UnlockCriterion>((c: any) => ({
              type: (c?.type ?? 'special') as UnlockCriterion['type'],
              description: c?.description ?? 'Requirement not met',
              currentValue: c?.currentValue ?? null,
              requiredValue: c?.requiredValue ?? null,
              satisfied: false,
              weight: typeof c?.weight === 'number' ? c.weight : 1,
            }))

            return { success: false, portal_id: portalId, unlocked: false, missing_criteria: missing }
          } catch (error) {
            return {
              success: false,
              portal_id: portalId,
              unlocked: false,
              missing_criteria: [criterionFromMessage(error instanceof Error ? error.message : 'Unlock failed')],
            }
          }
        },

        /** Select current portal */
        selectPortal: (portal: Portal) => {
          set((state) => { state.currentPortal = portal; state.error = null })
        },

        /** Clear current portal selection */
        clearCurrentPortal: () => {
          set((state) => { state.currentPortal = null; state.activeStepId = null })
        },

        // ========================================================================
        // PROGRESS TRACKING ACTIONS
        // ========================================================================

        /** Update portal progress */
        updateProgress: async (portalId: string, progressData: Partial<UserPortalProgress>) => {
          const { userId } = get()
          if (!userId) return

          // Optimistic
          set((state) => { if (state.userProgress[portalId]) Object.assign(state.userProgress[portalId], progressData) })

          try {
            const portalManager = getPortalManager()
            const response = await portalManager.updateProgress({ user_id: userId, portal_id: portalId, progress_data: progressData })

            if (response.success && response.data) {
              set((state) => { state.userProgress[portalId] = response.data!; state.lastSyncTime = nowIso() })
            }
          } catch (error) {
            set((state) => { state.error = error instanceof Error ? error.message : 'Failed to update progress' })

            get().addToOfflineQueue(
              makeOfflineOpBase({ user_id: userId!, operation_type: 'progress_update', portal_id: portalId, data: progressData, priority: 1 })
            )
          }
        },

        /** Complete a step */
        completeStep: async (portalId: string, stepId: string, stepData: any, qualityScore?: number) => {
          const { userId, stepStartTime } = get()
          if (!userId) return
          const timeSpent = stepStartTime ? Math.round((Date.now() - stepStartTime) / (1000 * 60)) : 0

          try {
            const progressTracker = createProgressTracker()
            const response = await progressTracker.trackStepCompletion(userId, portalId, stepId, timeSpent, qualityScore, stepData)

            if (response.success && response.data) {
              set((state) => {
                if (!state.stepProgress[portalId]) state.stepProgress[portalId] = []
                const idx = state.stepProgress[portalId].findIndex((s: UserStepProgress) => s.step_id === stepId)
                if (idx >= 0) state.stepProgress[portalId][idx] = response.data!
                else state.stepProgress[portalId].push(response.data!)
                state.activeStepId = null
                state.stepStartTime = null
                state.lastSyncTime = nowIso()
              })
              await get().loadUserPortals(true)
            } else {
              throw new Error(response.error?.message || 'Failed to complete step')
            }
          } catch (error) {
            set((state) => { state.error = error instanceof Error ? error.message : 'Failed to complete step' })

            get().addToOfflineQueue(
              makeOfflineOpBase({
                user_id: userId!,
                operation_type: 'step_completion',
                portal_id: portalId,
                step_id: stepId,
                data: { stepData, qualityScore, timeSpent },
                priority: 1,
              })
            )
          }
        },

        /** Start a step */
        startStep: (stepId: string) => {
          set((state) => { state.activeStepId = stepId; state.stepStartTime = Date.now(); state.error = null })
        },

        /** Pause current step */
        pauseStep: () => {
          set((state) => { state.activeStepId = null; state.stepStartTime = null })
        },

        // ========================================================================
        // SESSION MANAGEMENT ACTIONS
        // ========================================================================

        /** Start portal session */
        startPortalSession: async (portalId: string) => {
          const { userId } = get()
          if (!userId) return
          try {
            const progressTracker = createProgressTracker()
            const response = await progressTracker.startSession(userId, portalId)
            if (response.success && response.data) {
              set((state) => { state.currentSession = response.data!; state.sessionStartTime = Date.now(); state.error = null })
            }
          } catch (error) {
            set((state) => { state.error = error instanceof Error ? error.message : 'Failed to start session' })
          }
        },

        /** End portal session */
        endPortalSession: async () => {
          const { currentSession, sessionStartTime } = get()
          if (!currentSession) return
          try {
            const progressTracker = createProgressTracker()
            const response = await progressTracker.endSession()
            if (response.success) {
              set((state) => { state.currentSession = null; state.sessionStartTime = null; state.lastSyncTime = nowIso() })
            }
          } catch (error) {
            set((state) => { state.error = error instanceof Error ? error.message : 'Failed to end session' })
          }
        },

        /** Update session data */
        updateSessionData: (data: Partial<PortalSession>) => {
          set((state) => { if (state.currentSession) Object.assign(state.currentSession, data) })
        },

        // ========================================================================
        // BIOMETRIC INTEGRATION ACTIONS
        // ========================================================================

        /** Add biometric reading */
        addBiometricReading: (reading: BiometricReading) => {
          set((state) => {
            state.recentBiometricReadings.push(reading)
            if (state.recentBiometricReadings.length > 50) state.recentBiometricReadings = state.recentBiometricReadings.slice(-50)
            if (state.currentSession) state.currentSession.biometric_readings.push(reading)
          })
        },

        /** Get biometric trends */
        getBiometricTrends: (portalId?: string) => {
          const { recentBiometricReadings } = get()
          if (portalId) return recentBiometricReadings.filter((r: BiometricReading) => (r as any).portal_id === portalId)
          return recentBiometricReadings
        },

        // ========================================================================
        // ACHIEVEMENT ACTIONS
        // ========================================================================

        /** Load achievements */
        loadAchievements: async () => {
          const { userId } = get(); if (!userId) return
          try {
            // Placeholder until wired with API
            set((state) => { state.achievements = []; state.userAchievements = [] })
          } catch (error) {
            set((state) => { state.error = error instanceof Error ? error.message : 'Failed to load achievements' })
          }
        },

        /** Award achievement */
        awardAchievement: (achievementId: string) => {
          set((state) => {
            const achievement = state.achievements.find((a: Achievement) => a.id === achievementId)
            if (achievement) {
              state.userAchievements.push({
                id: crypto.randomUUID(),
                user_id: state.userId!,
                achievement_id: achievementId,
                progress_value: 100,
                is_completed: true,
                completed_at: nowIso(),
                created_at: nowIso(),
              } as UserAchievement)
            }
          })
        },

        /** Mark achievement as seen */
        markAchievementSeen: (achievementId: string) => {
          set((state) => {
            const userAchievement = state.userAchievements.find((ua: UserAchievement) => ua.achievement_id === achievementId)
            if (userAchievement) userAchievement.notified_at = nowIso()
          })
        },

        // ========================================================================
        // OFFLINE SUPPORT ACTIONS
        // ========================================================================

        /** Add operation to offline queue */
        addToOfflineQueue: (operation: OfflineOperation) => {
          set((state) => { state.offlineQueue.push(operation) })
        },

        /** Process offline queue */
        processOfflineQueue: async () => {
          const { offlineQueue } = get()
          if (offlineQueue.length === 0) return

          const processed: string[] = []
          for (const operation of offlineQueue) {
            try {
              switch (operation.operation_type) {
                case 'progress_update':
                  if (operation.portal_id) await get().updateProgress(operation.portal_id, operation.data as Partial<UserPortalProgress>)
                  break
                case 'step_completion':
                  if (operation.portal_id && operation.step_id) {
                    const d: any = operation.data || {}
                    await get().completeStep(operation.portal_id, operation.step_id, d.stepData, d.qualityScore)
                  }
                  break
              }
              processed.push(operation.id)
            } catch (e) {
              operation.retry_count += 1
              operation.last_error = e instanceof Error ? e.message : String(e)
              if (operation.retry_count >= operation.max_retries) processed.push(operation.id)
            }
          }
          set((state) => { state.offlineQueue = state.offlineQueue.filter((op: OfflineOperation) => !processed.includes(op.id)) })
        },

        /** Set offline status */
        setOfflineStatus: (isOffline: boolean) => {
          set((state) => { state.isOffline = isOffline })
          if (!isOffline) get().processOfflineQueue()
        },

        // ========================================================================
        // REAL-TIME UPDATES
        // ========================================================================
        subscribeToRealtimeUpdates: () => {
          // TODO: Implement Supabase realtime subscriptions
        },
        unsubscribeFromRealtimeUpdates: () => {
          // TODO: Implement unsubscription
        },

        // ========================================================================
        // ERROR HANDLING ACTIONS
        // ========================================================================
        setError: (error: string | null) => { set((state) => { state.error = error }) },
        clearError: () => { set((state) => { state.error = null }) },
        setLoading: (loading: boolean) => { set((state) => { state.isLoading = loading }) },

        // ========================================================================
        // ANALYTICS & INSIGHTS ACTIONS
        // ========================================================================
        loadPortalAnalytics: async (portalId: string) => {
          set((state) => { state.portalAnalytics[portalId] = { loading: false, data: null } })
        },
        getProgressInsights: async (_userId: string) => {
          return {}
        },
        updateCulturalContext: (_context: any) => {
          /* placeholder */
        },
      })),
      {
        name: 'porverse-portal-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          userId: state.userId,
          subscriptionTier: state.subscriptionTier,
          quantumVaultUnlocked: state.quantumVaultUnlocked,
          userProgress: state.userProgress,
          stepProgress: state.stepProgress,
          userAchievements: state.userAchievements,
          offlineQueue: state.offlineQueue,
          lastSyncTime: state.lastSyncTime,
        }),
      }
    )
  )
)

// ============================================================================
// STORE SELECTORS
// ============================================================================

export const usePortalById = (portalId: string) =>
  usePortalStore((state) => state.portals.find((p: Portal) => p.id === portalId))

export const usePortalProgress = (portalId: string) =>
  usePortalStore((state) => state.userProgress[portalId])

export const useStepProgress = (portalId: string) =>
  usePortalStore((state) => state.stepProgress[portalId] || [])

export const useCompletedPortals = () =>
  usePortalStore((state) => Object.values(state.userProgress).filter((p: UserPortalProgress) => p.status === 'completed'))

export const useUnlockedPortals = () =>
  usePortalStore((state) => state.portals.filter((portal: Portal) => { const progress = state.userProgress[portal.id]; return !!progress && progress.status !== 'locked' }))

export const useSessionTime = () =>
  usePortalStore((state) => { if (!state.sessionStartTime) return 0; return Math.round((Date.now() - state.sessionStartTime) / 1000) })

export const useIsPortalAccessible = (portalId: string) =>
  usePortalStore((state) => { const portal = state.portals.find((p: Portal) => p.id === portalId); if (!portal) return false; const progress = state.userProgress[portalId]; return !!progress && progress.status !== 'locked' })

// ============================================================================
// STORE HOOKS
// ============================================================================

export const usePortalActions = () => {
  const store = usePortalStore()
  return {
    initialize: store.initialize,
    loadUserPortals: store.loadUserPortals,
    unlockPortal: store.unlockPortal,
    selectPortal: store.selectPortal,
    updateProgress: store.updateProgress,
    completeStep: store.completeStep,
    startPortalSession: store.startPortalSession,
    endPortalSession: store.endPortalSession,
    addBiometricReading: store.addBiometricReading,
  }
}

export const useOfflineSync = () => {
  const { offlineQueue, isOffline, processOfflineQueue, setOfflineStatus } = usePortalStore()
  return { offlineQueue, isOffline, processOfflineQueue, setOfflineStatus, hasOfflineOperations: offlineQueue.length > 0 }
}

export default usePortalStore
