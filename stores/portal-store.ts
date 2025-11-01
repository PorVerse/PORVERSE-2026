// stores/portal-store.ts
/**
 * 🎯 PorVerse V2 - Portal State Management Store
 * Zustand store for managing portal state, progress, and real-time updates
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Centralized state management for portal-based spiritual journey
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
  OfflineOperation
} from '../types/portal-management'
import { getPortalManager } from '../lib/services/portal-manager'
import { createProgressTracker } from '../lib/services/progress-tracker'
import { createUnlockEngine } from '../lib/services/unlock-engine'

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
type PortalStore = PortalState & PortalActions

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
            // Load user portals and progress
            await get().loadUserPortals(true)
            
            // Load achievements
            await get().loadAchievements()
            
            // Subscribe to real-time updates
            get().subscribeToRealtimeUpdates()
            
            // Process any offline queue
            if (get().offlineQueue.length > 0) {
              await get().processOfflineQueue()
            }

            set((state) => {
              state.isLoading = false
              state.lastSyncTime = new Date().toISOString()
            })

          } catch (error) {
            set((state) => {
              state.isLoading = false
              state.error = error instanceof Error ? error.message : 'Initialization failed'
            })
          }
        },

        /**
         * Reset store to initial state
         */
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

        /**
         * Set user ID
         */
        setUserId: (userId: string | null) => {
          set((state) => {
            state.userId = userId
          })
        },

        /**
         * Set subscription tier
         */
        setSubscriptionTier: (tier: PortalSubscriptionTier) => {
          set((state) => {
            state.subscriptionTier = tier
          })
        },

        // ========================================================================
        // PORTAL MANAGEMENT ACTIONS
        // ========================================================================

        /**
         * Load user's accessible portals
         */
        loadUserPortals: async (forceRefresh = false) => {
          const { userId } = get()
          if (!userId) return

          set((state) => {
            state.isLoading = true
          })

          try {
            const portalManager = getPortalManager()
            const response = await portalManager.getUserPortalAccess(userId, forceRefresh)

            if (response.success && response.data) {
              set((state) => {
                state.portals = response.data!
                
                // Update user progress mapping
                response.data!.forEach((portal: any) => {
                  if (portal.user_progress) {
                    state.userProgress[portal.id] = portal.user_progress
                  }
                })
                
                state.isLoading = false
                state.error = null
                state.lastSyncTime = new Date().toISOString()
              })
            } else {
              throw new Error(response.error?.message || 'Failed to load portals')
            }

          } catch (error) {
            set((state) => {
              state.isLoading = false
              state.error = error instanceof Error ? error.message : 'Failed to load portals'
            })

            // Add to offline queue if offline
            if (get().isOffline) {
              get().addToOfflineQueue({
                id: crypto.randomUUID(),
                user_id: userId,
                operation_type: 'progress_update',
                data: { operation: 'load_portals' },
                timestamp: new Date().toISOString(),
                retry_count: 0,
                max_retries: 3,
                priority: 2
              })
            }
          }
        },

        /**
         * Unlock a portal
         */
        unlockPortal: async (portalId: string): Promise<PortalUnlockResult> => {
          const { userId, subscriptionTier, userProgress } = get()
          if (!userId) {
            throw new Error('User not authenticated')
          }

          try {
            const unlockEngine = createUnlockEngine()
            const response = await unlockEngine.evaluateUnlockCriteria(userId, portalId)

            if (response.success && response.data?.canUnlock) {
              // Portal can be unlocked
              const portalManager = getPortalManager()
              const unlockResponse = await portalManager.unlockPortal({
                user_id: userId,
                portal_id: portalId,
                subscription_tier: subscriptionTier,
                current_progress: userProgress
              })

              if (unlockResponse.success) {
                // Refresh portal list
                await get().loadUserPortals(true)
                
                return unlockResponse.data!
              }
            }

            return {
              success: false,
              portal_id: portalId,
              unlocked: false,
              missing_criteria: response.data?.missingCriteria.map(c => c.description) || []
            }

          } catch (error) {
            return {
              success: false,
              portal_id: portalId,
              unlocked: false,
              missing_criteria: [error instanceof Error ? error.message : 'Unlock failed']
            }
          }
        },

        /**
         * Select current portal
         */
        selectPortal: (portal: Portal) => {
          set((state) => {
            state.currentPortal = portal
            state.error = null
          })
        },

        /**
         * Clear current portal selection
         */
        clearCurrentPortal: () => {
          set((state) => {
            state.currentPortal = null
            state.activeStepId = null
          })
        },

        // ========================================================================
        // PROGRESS TRACKING ACTIONS
        // ========================================================================

        /**
         * Update portal progress
         */
        updateProgress: async (portalId: string, progressData: Partial<UserPortalProgress>) => {
          const { userId } = get()
          if (!userId) return

          // Optimistic update
          set((state) => {
            if (state.userProgress[portalId]) {
              Object.assign(state.userProgress[portalId], progressData)
            }
          })

          try {
            const portalManager = getPortalManager()
            const response = await portalManager.updateProgress({
              user_id: userId,
              portal_id: portalId,
              progress_data: progressData
            })

            if (response.success && response.data) {
              set((state) => {
                state.userProgress[portalId] = response.data!
                state.lastSyncTime = new Date().toISOString()
              })
            }

          } catch (error) {
            // Revert optimistic update on error
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to update progress'
            })

            // Add to offline queue
            get().addToOfflineQueue({
              id: crypto.randomUUID(),
              user_id: userId,
              operation_type: 'progress_update',
              portal_id: portalId,
              data: progressData,
              timestamp: new Date().toISOString(),
              retry_count: 0,
              max_retries: 3,
              priority: 1
            })
          }
        },

        /**
         * Complete a step
         */
        completeStep: async (
          portalId: string,
          stepId: string,
          stepData: any,
          qualityScore?: number
        ) => {
          const { userId, stepStartTime } = get()
          if (!userId) return

          const timeSpent = stepStartTime ? Math.round((Date.now() - stepStartTime) / (1000 * 60)) : 0

          try {
            const progressTracker = createProgressTracker()
            const response = await progressTracker.trackStepCompletion(
              userId,
              portalId,
              stepId,
              timeSpent,
              qualityScore,
              stepData
            )

            if (response.success && response.data) {
              set((state) => {
                // Update step progress
                if (!state.stepProgress[portalId]) {
                  state.stepProgress[portalId] = []
                }
                
                const existingIndex = state.stepProgress[portalId].findIndex(s => s.step_id === stepId)
                if (existingIndex >= 0) {
                  state.stepProgress[portalId][existingIndex] = response.data!
                } else {
                  state.stepProgress[portalId].push(response.data!)
                }

                // Clear active step
                state.activeStepId = null
                state.stepStartTime = null
                state.lastSyncTime = new Date().toISOString()
              })

              // Update portal progress
              await get().loadUserPortals(true)

            } else {
              throw new Error(response.error?.message || 'Failed to complete step')
            }

          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to complete step'
            })

            // Add to offline queue
            get().addToOfflineQueue({
              id: crypto.randomUUID(),
              user_id: userId,
              operation_type: 'step_completion',
              portal_id: portalId,
              step_id: stepId,
              data: { stepData, qualityScore, timeSpent },
              timestamp: new Date().toISOString(),
              retry_count: 0,
              max_retries: 3,
              priority: 1
            })
          }
        },

        /**
         * Start a step
         */
        startStep: (stepId: string) => {
          set((state) => {
            state.activeStepId = stepId
            state.stepStartTime = Date.now()
            state.error = null
          })
        },

        /**
         * Pause current step
         */
        pauseStep: () => {
          set((state) => {
            state.activeStepId = null
            state.stepStartTime = null
          })
        },

        // ========================================================================
        // SESSION MANAGEMENT ACTIONS
        // ========================================================================

        /**
         * Start portal session
         */
        startPortalSession: async (portalId: string) => {
          const { userId } = get()
          if (!userId) return

          try {
            const progressTracker = createProgressTracker()
            const response = await progressTracker.startSession(userId, portalId)

            if (response.success && response.data) {
              set((state) => {
                state.currentSession = response.data!
                state.sessionStartTime = Date.now()
                state.error = null
              })
            }

          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to start session'
            })
          }
        },

        /**
         * End portal session
         */
        endPortalSession: async () => {
          const { currentSession, sessionStartTime } = get()
          if (!currentSession) return

          const duration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / (1000 * 60)) : 0

          try {
            const progressTracker = createProgressTracker()
            const response = await progressTracker.endSession()

            if (response.success) {
              set((state) => {
                state.currentSession = null
                state.sessionStartTime = null
                state.lastSyncTime = new Date().toISOString()
              })
            }

          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to end session'
            })
          }
        },

        /**
         * Update session data
         */
        updateSessionData: (data: Partial<PortalSession>) => {
          set((state) => {
            if (state.currentSession) {
              Object.assign(state.currentSession, data)
            }
          })
        },

        // ========================================================================
        // BIOMETRIC INTEGRATION ACTIONS
        // ========================================================================

        /**
         * Add biometric reading
         */
        addBiometricReading: (reading: BiometricReading) => {
          set((state) => {
            state.recentBiometricReadings.push(reading)
            
            // Keep only last 50 readings
            if (state.recentBiometricReadings.length > 50) {
              state.recentBiometricReadings = state.recentBiometricReadings.slice(-50)
            }

            // Update current session if active
            if (state.currentSession) {
              state.currentSession.biometric_readings.push(reading)
            }
          })
        },

        /**
         * Get biometric trends
         */
        getBiometricTrends: (portalId?: string) => {
          const { recentBiometricReadings } = get()
          
          if (portalId) {
            return recentBiometricReadings.filter(reading => 
              reading.id === portalId // Assuming portal context in reading
            )
          }
          
          return recentBiometricReadings
        },

        // ========================================================================
        // ACHIEVEMENT ACTIONS
        // ========================================================================

        /**
         * Load achievements
         */
        loadAchievements: async () => {
          const { userId } = get()
          if (!userId) return

          try {
            // TODO: Implement achievement loading
            set((state) => {
              state.achievements = []
              state.userAchievements = []
            })

          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to load achievements'
            })
          }
        },

        /**
         * Award achievement
         */
        awardAchievement: (achievementId: string) => {
          set((state) => {
            const achievement = state.achievements.find(a => a.id === achievementId)
            if (achievement) {
              state.userAchievements.push({
                id: crypto.randomUUID(),
                user_id: state.userId!,
                achievement_id: achievementId,
                progress_value: 100,
                is_completed: true,
                completed_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              })
            }
          })
        },

        /**
         * Mark achievement as seen
         */
        markAchievementSeen: (achievementId: string) => {
          set((state) => {
            const userAchievement = state.userAchievements.find(ua => ua.achievement_id === achievementId)
            if (userAchievement) {
              userAchievement.notified_at = new Date().toISOString()
            }
          })
        },

        // ========================================================================
        // OFFLINE SUPPORT ACTIONS
        // ========================================================================

        /**
         * Add operation to offline queue
         */
        addToOfflineQueue: (operation: OfflineOperation) => {
          set((state) => {
            state.offlineQueue.push(operation)
          })
        },

        /**
         * Process offline queue
         */
        processOfflineQueue: async () => {
          const { offlineQueue, userId } = get()
          if (!userId || offlineQueue.length === 0) return

          const processedOperations: string[] = []

          for (const operation of offlineQueue) {
            try {
              // Process based on operation type
              switch (operation.operation_type) {
                case 'progress_update':
                  if (operation.portal_id) {
                    await get().updateProgress(operation.portal_id, operation.data)
                  }
                  break
                  
                case 'step_completion':
                  if (operation.portal_id && operation.step_id) {
                    await get().completeStep(
                      operation.portal_id,
                      operation.step_id,
                      operation.data.stepData,
                      operation.data.qualityScore
                    )
                  }
                  break
              }

              processedOperations.push(operation.id)

            } catch (error) {
              // Increment retry count
              operation.retry_count++
              
              // Remove if max retries exceeded
              if (operation.retry_count >= operation.max_retries) {
                processedOperations.push(operation.id)
              }
            }
          }

          // Remove processed operations
          set((state) => {
            state.offlineQueue = state.offlineQueue.filter(
              op => !processedOperations.includes(op.id)
            )
          })
        },

        /**
         * Set offline status
         */
        setOfflineStatus: (isOffline: boolean) => {
          set((state) => {
            state.isOffline = isOffline
          })

          // Process queue when coming back online
          if (!isOffline) {
            get().processOfflineQueue()
          }
        },

        // ========================================================================
        // REAL-TIME UPDATES
        // ========================================================================

        /**
         * Subscribe to real-time updates
         */
        subscribeToRealtimeUpdates: () => {
          // TODO: Implement Supabase real-time subscriptions
        },

        /**
         * Unsubscribe from real-time updates
         */
        unsubscribeFromRealtimeUpdates: () => {
          // TODO: Implement unsubscription
        },

        // ========================================================================
        // ERROR HANDLING ACTIONS
        // ========================================================================

        /**
         * Set error message
         */
        setError: (error: string | null) => {
          set((state) => {
            state.error = error
          })
        },

        /**
         * Clear error
         */
        clearError: () => {
          set((state) => {
            state.error = null
          })
        },

        /**
         * Set loading state
         */
        setLoading: (loading: boolean) => {
          set((state) => {
            state.isLoading = loading
          })
        },

        // ========================================================================
        // ANALYTICS & INSIGHTS ACTIONS
        // ========================================================================

        /**
         * Load portal analytics
         */
        loadPortalAnalytics: async (portalId: string) => {
          // TODO: Implement analytics loading
          set((state) => {
            state.portalAnalytics[portalId] = {
              loading: false,
              data: null
            }
          })
        },

        /**
         * Get progress insights
         */
        getProgressInsights: async (userId: string) => {
          // TODO: Implement progress insights
          return {}
        },

        /**
         * Update cultural context
         */
        updateCulturalContext: (context: any) => {
          // TODO: Implement cultural context updates
        }
      })),
      {
        name: 'porverse-portal-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist only essential data
          userId: state.userId,
          subscriptionTier: state.subscriptionTier,
          quantumVaultUnlocked: state.quantumVaultUnlocked,
          userProgress: state.userProgress,
          stepProgress: state.stepProgress,
          userAchievements: state.userAchievements,
          offlineQueue: state.offlineQueue,
          lastSyncTime: state.lastSyncTime
        })
      }
    )
  )
)

// ============================================================================
// STORE SELECTORS
// ============================================================================

/**
 * Selector for getting portal by ID
 */
export const usePortalById = (portalId: string) =>
  usePortalStore((state) => state.portals.find(p => p.id === portalId))

/**
 * Selector for getting user progress for a portal
 */
export const usePortalProgress = (portalId: string) =>
  usePortalStore((state) => state.userProgress[portalId])

/**
 * Selector for getting step progress for a portal
 */
export const useStepProgress = (portalId: string) =>
  usePortalStore((state) => state.stepProgress[portalId] || [])

/**
 * Selector for getting completed portals
 */
export const useCompletedPortals = () =>
  usePortalStore((state) => 
    Object.values(state.userProgress).filter(p => p.status === 'completed')
  )

/**
 * Selector for getting unlocked portals
 */
export const useUnlockedPortals = () =>
  usePortalStore((state) => 
    state.portals.filter(portal => {
      const progress = state.userProgress[portal.id]
      return progress && progress.status !== 'locked'
    })
  )

/**
 * Selector for getting current session time
 */
export const useSessionTime = () =>
  usePortalStore((state) => {
    if (!state.sessionStartTime) return 0
    return Math.round((Date.now() - state.sessionStartTime) / 1000) // seconds
  })

/**
 * Selector for checking if portal is accessible
 */
export const useIsPortalAccessible = (portalId: string) =>
  usePortalStore((state) => {
    const portal = state.portals.find(p => p.id === portalId)
    if (!portal) return false
    
    const progress = state.userProgress[portalId]
    return progress && progress.status !== 'locked'
  })

// ============================================================================
// STORE HOOKS
// ============================================================================

/**
 * Hook for portal actions
 */
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
    addBiometricReading: store.addBiometricReading
  }
}

/**
 * Hook for offline capabilities
 */
export const useOfflineSync = () => {
  const { offlineQueue, isOffline, processOfflineQueue, setOfflineStatus } = usePortalStore()
  
  return {
    offlineQueue,
    isOffline,
    processOfflineQueue,
    setOfflineStatus,
    hasOfflineOperations: offlineQueue.length > 0
  }
}

export default usePortalStore