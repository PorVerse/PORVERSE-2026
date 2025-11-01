// hooks/usePortalManagement.ts
/**
 * 🎯 PorVerse V2 - Portal Management Hooks
 * React hooks for portal operations, progress tracking, and state management
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Custom hooks for seamless portal integration in React components
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { usePortalStore, usePortalActions, useOfflineSync } from '../stores/portal-store'
import { createProgressTracker } from '../lib/services/progress-tracker'
import { createUnlockEngine } from '../lib/services/unlock-engine'
import type {
  Portal,
  UserPortalProgress,
  UserStepProgress,
  PortalSession,
  BiometricReading,
  PortalUnlockResult,
  PortalProgressStatus,
  ServiceResponse
} from '../types/portal-management'

// ============================================================================
// CORE PORTAL HOOKS
// ============================================================================

/**
 * Main portal management hook
 * Provides comprehensive portal state and actions
 */
export const usePortalManagement = (userId?: string) => {
  const store = usePortalStore()
  const actions = usePortalActions()
  const { isOffline, hasOfflineOperations } = useOfflineSync()

  // Initialize store when userId is available
  useEffect(() => {
    if (userId && userId !== store.userId) {
      actions.initialize(userId)
    }
  }, [userId, store.userId, actions])

  return {
    // State
    userId: store.userId,
    portals: store.portals,
    userProgress: store.userProgress,
    currentPortal: store.currentPortal,
    currentSession: store.currentSession,
    isLoading: store.isLoading,
    error: store.error,
    isOffline,
    hasOfflineOperations,
    lastSyncTime: store.lastSyncTime,

    // Actions
    loadPortals: actions.loadUserPortals,
    selectPortal: actions.selectPortal,
    unlockPortal: actions.unlockPortal,
    updateProgress: actions.updateProgress,
    startSession: actions.startPortalSession,
    endSession: actions.endPortalSession,

    // Computed values
    completedPortalsCount: Object.values(store.userProgress).filter(p => p.status === 'completed').length,
    totalTimeSpent: Object.values(store.userProgress).reduce((sum, p) => sum + p.time_spent_minutes, 0),
    averageQualityScore: calculateAverageQuality(Object.values(store.userProgress))
  }
}

/**
 * Hook for individual portal operations
 */
export const usePortal = (portalId: string) => {
  const store = usePortalStore()
  const actions = usePortalActions()
  
  const portal = store.portals.find(p => p.id === portalId)
  const progress = store.userProgress[portalId]
  const stepProgress = store.stepProgress[portalId] || []
  const isSelected = store.currentPortal?.id === portalId

  const selectPortal = useCallback(() => {
    if (portal) {
      actions.selectPortal(portal)
    }
  }, [portal, actions])

  const updateProgress = useCallback((progressData: Partial<UserPortalProgress>) => {
    return actions.updateProgress(portalId, progressData)
  }, [portalId, actions])

  return {
    portal,
    progress,
    stepProgress,
    isSelected,
    isAccessible: !!progress && progress.status !== 'locked',
    completionPercentage: progress?.completion_percentage || 0,
    timeSpent: progress?.time_spent_minutes || 0,
    qualityScore: progress?.quality_score,
    status: progress?.status || 'locked',
    
    // Actions
    select: selectPortal,
    updateProgress,
    unlock: () => actions.unlockPortal(portalId)
  }
}

/**
 * Hook for portal unlock functionality
 */
export const usePortalUnlock = () => {
  const [unlockStatus, setUnlockStatus] = useState<{
    [portalId: string]: {
      loading: boolean
      result: PortalUnlockResult | null
      error: string | null
    }
  }>({})

  const { unlockPortal } = usePortalActions()

  const unlock = useCallback(async (portalId: string): Promise<PortalUnlockResult> => {
    setUnlockStatus(prev => ({
      ...prev,
      [portalId]: { loading: true, result: null, error: null }
    }))

    try {
      const result = await unlockPortal(portalId)
      
      setUnlockStatus(prev => ({
        ...prev,
        [portalId]: { loading: false, result, error: null }
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unlock failed'
      
      setUnlockStatus(prev => ({
        ...prev,
        [portalId]: { 
          loading: false, 
          result: null, 
          error: errorMessage 
        }
      }))

      throw error
    }
  }, [unlockPortal])

  const getUnlockStatus = useCallback((portalId: string) => {
    return unlockStatus[portalId] || { loading: false, result: null, error: null }
  }, [unlockStatus])

  return {
    unlock,
    getUnlockStatus,
    isUnlocking: (portalId: string) => unlockStatus[portalId]?.loading || false
  }
}

// ============================================================================
// PROGRESS TRACKING HOOKS
// ============================================================================

/**
 * Hook for progress tracking and analytics
 */
export const useProgressTracking = (userId?: string) => {
  const [progressSummary, setProgressSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProgressSummary = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const progressTracker = createProgressTracker()
      const response = await progressTracker.getProgressSummary(userId, true)

      if (response.success) {
        setProgressSummary(response.data)
      } else {
        setError(response.error?.message || 'Failed to load progress summary')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProgressSummary()
  }, [loadProgressSummary])

  return {
    progressSummary,
    isLoading,
    error,
    refresh: loadProgressSummary
  }
}

/**
 * Hook for step completion tracking
 */
export const useStepCompletion = () => {
  const { completeStep, startStep } = usePortalActions()
  const store = usePortalStore()

  const [completionState, setCompletionState] = useState<{
    completing: boolean
    error: string | null
  }>({ completing: false, error: null })

  const completeStepWithTracking = useCallback(async (
    portalId: string,
    stepId: string,
    stepData: any,
    qualityScore?: number
  ) => {
    setCompletionState({ completing: true, error: null })

    try {
      await completeStep(portalId, stepId, stepData, qualityScore)
      setCompletionState({ completing: false, error: null })
      
    } catch (error) {
      setCompletionState({
        completing: false,
        error: error instanceof Error ? error.message : 'Step completion failed'
      })
      throw error
    }
  }, [completeStep])

  const startStepWithTracking = useCallback((stepId: string) => {
    startStep(stepId)
  }, [startStep])

  return {
    completeStep: completeStepWithTracking,
    startStep: startStepWithTracking,
    activeStepId: store.activeStepId,
    stepStartTime: store.stepStartTime,
    isCompleting: completionState.completing,
    error: completionState.error
  }
}

/**
 * Hook for portal session management
 */
export const usePortalSession = (portalId?: string) => {
  const store = usePortalStore()
  const actions = usePortalActions()

  const isActive = store.currentSession?.portal_id === portalId
  const sessionTime = store.sessionStartTime ? 
    Math.round((Date.now() - store.sessionStartTime) / 1000) : 0

  const startSession = useCallback(async () => {
    if (portalId) {
      await actions.startSession(portalId)
    }
  }, [portalId, actions])

  const endSession = useCallback(async () => {
    await actions.endSession()
  }, [actions])

  return {
    session: store.currentSession,
    isActive,
    sessionTime,
    startSession,
    endSession
  }
}

// ============================================================================
// BIOMETRIC INTEGRATION HOOKS
// ============================================================================

/**
 * Hook for biometric reading integration
 */
export const useBiometricIntegration = () => {
  const { addBiometricReading, getBiometricTrends } = usePortalActions()
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const startBiometricScan = useCallback(async (
    type: 'face_emotion' | 'voice_tone' | 'heart_rate',
    onReading?: (reading: BiometricReading) => void
  ) => {
    setIsScanning(true)
    setScanError(null)

    try {
      // TODO: Implement actual biometric scanning
      // This would integrate with MediaPipe or other biometric libraries
      
      // Simulated biometric reading for now
      const mockReading: BiometricReading = {
        id: crypto.randomUUID(),
        user_id: 'current-user',
        type,
        timestamp: new Date().toISOString(),
        values: { overall: Math.random() * 100 },
        confidence_score: 0.85,
        processing_duration_ms: 1500
      }

      setTimeout(() => {
        addBiometricReading(mockReading)
        onReading?.(mockReading)
        setIsScanning(false)
      }, 1500)

    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Scan failed')
      setIsScanning(false)
    }
  }, [addBiometricReading])

  return {
    isScanning,
    scanError,
    startScan: startBiometricScan,
    getTrends: getBiometricTrends
  }
}

// ============================================================================
// ACHIEVEMENT HOOKS
// ============================================================================

/**
 * Hook for achievement tracking
 */
export const useAchievements = () => {
  const store = usePortalStore()

  const unlockedAchievements = store.userAchievements.filter(ua => ua.is_completed)
  const recentAchievements = unlockedAchievements
    .filter(ua => !ua.notified_at)
    .slice(-5)

  const markAchievementSeen = useCallback((achievementId: string) => {
    store.markAchievementSeen(achievementId)
  }, [store])

  return {
    achievements: store.achievements,
    userAchievements: store.userAchievements,
    unlockedAchievements,
    recentAchievements,
    totalPoints: unlockedAchievements.reduce((sum, ua) => {
      const achievement = store.achievements.find(a => a.id === ua.achievement_id)
      return sum + (achievement?.points || 0)
    }, 0),
    markSeen: markAchievementSeen
  }
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

/**
 * Hook for portal analytics and insights
 */
export const usePortalAnalytics = (portalId: string) => {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // TODO: Implement analytics loading
      setAnalytics({
        completionRate: 85,
        averageTime: 45,
        qualityScore: 78,
        improvementTrend: 12
      })
      
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [portalId])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  return {
    analytics,
    isLoading,
    refresh: loadAnalytics
  }
}

/**
 * Hook for portal recommendations
 */
export const usePortalRecommendations = (userId?: string) => {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const store = usePortalStore()

  const generateRecommendations = useCallback(() => {
    if (!userId) return

    const inProgress = Object.values(store.userProgress).filter(p => p.status === 'in_progress')
    const completed = Object.values(store.userProgress).filter(p => p.status === 'completed')

    const recs = [
      ...inProgress.map(p => ({
        portalId: p.portal_id,
        type: 'continue',
        priority: 'high',
        reason: 'Complete your current progress'
      })),
      // Add more sophisticated recommendation logic here
    ]

    setRecommendations(recs.slice(0, 3))
  }, [userId, store.userProgress])

  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  return {
    recommendations,
    refresh: generateRecommendations
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for portal search and filtering
 */
export const usePortalSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{
    category?: string
    status?: PortalProgressStatus
    difficulty?: string
  }>({})

  const store = usePortalStore()

  const filteredPortals = useMemo(() => {
    let filtered = store.portals

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(portal =>
        portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        portal.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(portal => portal.category === filters.category)
    }

    if (filters.status) {
      filtered = filtered.filter(portal => {
        const progress = store.userProgress[portal.id]
        return progress?.status === filters.status
      })
    }

    if (filters.difficulty) {
      filtered = filtered.filter(portal => portal.difficulty_level === filters.difficulty)
    }

    return filtered
  }, [store.portals, store.userProgress, searchQuery, filters])

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredPortals,
    resultCount: filteredPortals.length
  }
}

/**
 * Hook for offline synchronization status
 */
export const useOfflineStatus = () => {
  const { isOffline, hasOfflineOperations, processOfflineQueue, setOfflineStatus } = useOfflineSync()
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false)
    const handleOffline = () => setOfflineStatus(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOfflineStatus])

  const syncNow = useCallback(async () => {
    if (isOffline || !hasOfflineOperations) return

    setSyncStatus('syncing')
    
    try {
      await processOfflineQueue()
      setSyncStatus('idle')
    } catch (error) {
      setSyncStatus('error')
      console.error('Sync failed:', error)
    }
  }, [isOffline, hasOfflineOperations, processOfflineQueue])

  return {
    isOffline,
    hasOfflineOperations,
    syncStatus,
    syncNow,
    canSync: !isOffline && hasOfflineOperations
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate average quality score from progress array
 */
function calculateAverageQuality(progressArray: UserPortalProgress[]): number {
  const withQuality = progressArray.filter(p => p.quality_score !== null && p.quality_score !== undefined)
  if (withQuality.length === 0) return 0
  
  return withQuality.reduce((sum, p) => sum + (p.quality_score || 0), 0) / withQuality.length
}

/**
 * Format time duration for display
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

/**
 * Get portal color theme
 */
export const getPortalTheme = (portal: Portal) => {
  const themes = {
    activation: { primary: '#8B5CF6', secondary: '#A78BFA' },
    foundation: { primary: '#10B981', secondary: '#34D399' },
    health: { primary: '#EF4444', secondary: '#F87171' },
    mind: { primary: '#F59E0B', secondary: '#FBD74C' },
    flow: { primary: '#3B82F6', secondary: '#60A5FA' },
    well: { primary: '#14B8A6', secondary: '#5EEAD4' },
    quantum: { primary: '#7C3AED', secondary: '#A855F7' }
  }
  
  return themes[portal.category] || themes.activation
}

/**
 * Get progress status color
 */
export const getStatusColor = (status: PortalProgressStatus) => {
  const colors = {
    locked: '#6B7280',
    unlocked: '#3B82F6',
    in_progress: '#F59E0B',
    completed: '#10B981',
    paused: '#8B5CF6',
    expired: '#EF4444'
  }
  
  return colors[status] || colors.locked
}

export {
  usePortalManagement,
  usePortal,
  usePortalUnlock,
  useProgressTracking,
  useStepCompletion,
  usePortalSession,
  useBiometricIntegration,
  useAchievements,
  usePortalAnalytics,
  usePortalRecommendations,
  usePortalSearch,
  useOfflineStatus
}