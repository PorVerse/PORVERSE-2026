// hooks/usePortalManagement.ts
/**
 * 🎯 PorVerse V2 - Portal Management Hooks
 * React hooks for portal operations, progress tracking, and state management
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Custom hooks for seamless portal integration in React components
 */

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { usePortalStore, usePortalActions, useOfflineSync } from '../stores/portal-store'
import type {
  Portal,
  UserPortalProgress,
  BiometricReading,
  PortalUnlockResult,
  PortalProgressStatus
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
    totalTimeSpent: Object.values(store.userProgress).reduce((sum, p) => sum + ((p as any).time_spent_minutes || 0), 0),
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
    isAccessible: progress?.status !== 'locked',
    completionPercentage: progress?.status === 'completed' ? 100 : ((progress?.current_step || 0) / (progress?.total_steps || 1)) * 100,
    isCompleted: progress?.status === 'completed',
    qualityScore: (progress as any)?.quality_score || 0,
    timeSpent: (progress as any)?.time_spent_minutes || 0,
    selectPortal,
    updateProgress
  }
}

/**
 * Hook for portal unlocking
 */
export const usePortalUnlock = () => {
  const actions = usePortalActions()
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const unlockPortal = useCallback(async (portalId: string): Promise<PortalUnlockResult | null> => {
    setUnlocking(true)
    setUnlockError(null)

    try {
      const result = await actions.unlockPortal(portalId)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlock portal'
      setUnlockError(message)
      return null
    } finally {
      setUnlocking(false)
    }
  }, [actions])

  const checkUnlockStatus = useCallback(async (portalId: string) => {
    // Simplified check
    return {
      canUnlock: true,
      missingCriteria: [] as string[]
    }
  }, [])

  return {
    unlockPortal,
    checkUnlockStatus,
    unlocking,
    unlockError
  }
}

/**
 * Hook for progress tracking
 */
export const useProgressTracking = (userId?: string) => {
  const actions = usePortalActions()
  const store = usePortalStore()

  const [progressSummary, setProgressSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProgressSummary = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const summary = {
        totalPortals: store.portals.length,
        completedPortals: Object.values(store.userProgress).filter(p => p.status === 'completed').length,
        inProgressPortals: Object.values(store.userProgress).filter(p => p.status === 'in_progress').length,
        totalTimeSpent: Object.values(store.userProgress).reduce((sum, p) => sum + ((p as any).time_spent_minutes || 0), 0),
        averageQualityScore: calculateAverageQuality(Object.values(store.userProgress))
      }

      setProgressSummary(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [userId, store])

  useEffect(() => {
    loadProgressSummary()
  }, [loadProgressSummary])

  return {
    progressSummary,
    isLoading,
    error,
    refresh: loadProgressSummary,
    trackProgress: actions.updateProgress
  }
}

/**
 * Hook for step completion tracking
 */
export const useStepCompletion = () => {
  const actions = usePortalActions()
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
      await actions.completeStep(portalId, stepId, stepData, qualityScore)
      setCompletionState({ completing: false, error: null })
      
    } catch (error) {
      setCompletionState({
        completing: false,
        error: error instanceof Error ? error.message : 'Step completion failed'
      })
      throw error
    }
  }, [actions])

  const startStepWithTracking = useCallback((stepId: string) => {
    console.log('Starting step:', stepId)
  }, [])

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
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionData, setSessionData] = useState<any>(null)

  const isActive = store.currentSession?.portal_id === portalId
  const sessionTime = store.sessionStartTime ? 
    Math.round((Date.now() - store.sessionStartTime) / 1000) : 0

  const startSession = useCallback(async (pId?: string) => {
    const id = pId || portalId
    if (!id) return
    
    setSessionActive(true)
    setSessionData({
      portalId: id,
      startTime: Date.now()
    })
  }, [portalId])

  const endSession = useCallback(async () => {
    setSessionActive(false)
    setSessionData(null)
  }, [])

  return {
    session: store.currentSession,
    isActive,
    sessionTime,
    sessionActive,
    sessionData,
    startSession,
    endSession
  }
}

/**
 * Hook for biometric reading integration
 */
export const useBiometricIntegration = () => {
  const actions = usePortalActions()
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const startBiometricScan = useCallback(async (
    type: 'face_emotion' | 'voice_tone' | 'heart_rate',
    onReading?: (reading: BiometricReading) => void
  ) => {
    setIsScanning(true)
    setScanError(null)

    try {
      // Simulate biometric scan
      await new Promise(resolve => setTimeout(resolve, 1500))

      const mockReading: BiometricReading = {
        type: type === 'voice_tone' ? 'face_emotion' : type, // Map voice_tone to valid type
        value: Math.random() * 100,
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        metadata: {}
      }

      actions.addBiometricReading(mockReading)
      
      if (onReading) {
        onReading(mockReading)
      }

      setIsScanning(false)

    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Scan failed')
      setIsScanning(false)
    }
  }, [actions])

  const getBiometricTrends = useCallback(async () => {
    return []
  }, [])

  return {
    isScanning,
    scanError,
    startScan: startBiometricScan,
    getBiometricTrends,
    addReading: actions.addBiometricReading,
    getTrends: getBiometricTrends
  }
}

/**
 * Hook for achievement tracking
 */
export const useAchievements = () => {
  const store = usePortalStore()

  const unlockedAchievements = store.userAchievements.filter(ua => ua.is_completed)
  const recentAchievements = unlockedAchievements
    .filter(ua => ua.unlocked_at)
    .slice(-5)

  const markAchievementSeen = useCallback((achievementId: string) => {
    if (store.markAchievementSeen) {
      store.markAchievementSeen(achievementId)
    }
  }, [store])

  return {
    achievements: store.achievements,
    userAchievements: store.userAchievements,
    unlockedAchievements,
    recentAchievements,
    unnotifiedAchievements: recentAchievements,
    totalPoints: unlockedAchievements.reduce((sum, ua) => {
      const achievement = store.achievements.find(a => a.id === ua.achievement_id)
      return sum + (achievement?.points || 0)
    }, 0),
    markSeen: markAchievementSeen
  }
}

/**
 * Hook for portal analytics and insights
 */
export const usePortalAnalytics = (portalId: string) => {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Simulate analytics loading
      await new Promise(resolve => setTimeout(resolve, 100))
      
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
    loading: isLoading,
    refresh: loadAnalytics
  }
}

/**
 * Hook for portal recommendations
 */
export const usePortalRecommendations = (userId?: string) => {
  const store = usePortalStore()
  const [recommendations, setRecommendations] = useState<Portal[]>([])
  const [loading, setLoading] = useState(false)

  const generateRecommendations = useCallback(() => {
    if (!userId) return

    setLoading(true)

    const inProgress = Object.values(store.userProgress).filter(p => p.status === 'in_progress')
    
    // Get portals for in-progress items
    const recs = inProgress
      .map(p => store.portals.find(portal => portal.id === p.portal_id))
      .filter(Boolean)
      .slice(0, 3) as Portal[]

    setRecommendations(recs)
    setLoading(false)
  }, [userId, store.userProgress, store.portals])

  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  return {
    recommendations,
    loading,
    refresh: generateRecommendations
  }
}

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
        portal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        portal.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(portal => (portal as any).category === filters.category)
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(portal => {
        const progress = store.userProgress[portal.id]
        return progress?.status === filters.status
      })
    }

    return filtered
  }, [store.portals, store.userProgress, searchQuery, filters])

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredPortals,
    results: filteredPortals,
    resultCount: filteredPortals.length,
    search: setSearchQuery
  }
}

/**
 * Hook for offline status monitoring
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingOperations, setPendingOperations] = useState(0)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const sync = useCallback(async () => {
    setIsSyncing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setPendingOperations(0)
    setIsSyncing(false)
  }, [])

  return {
    isOnline,
    isSyncing,
    pendingOperations,
    sync
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate average quality score from progress array
 */
function calculateAverageQuality(progressArray: UserPortalProgress[]): number {
  const withQuality = progressArray.filter(p => {
    const score = (p as any).quality_score
    return score !== null && score !== undefined
  })
  
  if (withQuality.length === 0) return 0
  
  return withQuality.reduce((sum, p) => sum + ((p as any).quality_score || 0), 0) / withQuality.length
}

/**
 * Format duration in human-readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`
  
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
  const category = (portal as any).category || 'activation'
  
  const themes: Record<string, { primary: string; secondary: string }> = {
    activation: { primary: '#8B5CF6', secondary: '#A78BFA' },
    foundation: { primary: '#10B981', secondary: '#34D399' },
    health: { primary: '#EF4444', secondary: '#F87171' },
    mind: { primary: '#F59E0B', secondary: '#FBD74C' },
    flow: { primary: '#3B82F6', secondary: '#60A5FA' },
    well: { primary: '#14B8A6', secondary: '#5EEAD4' },
    quantum: { primary: '#7C3AED', secondary: '#A855F7' }
  }
  
  return themes[category] || themes.activation
}

/**
 * Get progress status color
 */
export const getStatusColor = (status: PortalProgressStatus) => {
  const colors: Record<PortalProgressStatus, string> = {
    locked: '#6B7280',
    unlocked: '#3B82F6',
    in_progress: '#F59E0B',
    completed: '#10B981',
    paused: '#8B5CF6',
    expired: '#EF4444'
  }
  
  return colors[status] || colors.locked
}