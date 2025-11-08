// lib/services/index.ts
/**
 * 🎯 PorVerse V2 - Services Index
 * Central export point for all portal management services
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Single import point for all core services
 */

// Core Services
export { PortalManager, createPortalManager, getPortalManager } from './portal-manager'
export { ProgressTracker, createProgressTracker } from './progress-tracker'
export { UnlockEngine, createUnlockEngine } from './unlock-engine'

// AI Services
export { AIServiceManager, createAIServiceManager } from '../ai/ai-service-manager'

// Store and Hooks
export { 
  usePortalStore,
  usePortalById,
  usePortalProgress,
  useStepProgress,
  useCompletedPortals,
  useUnlockedPortals,
  useSessionTime,
  useIsPortalAccessible,
  usePortalActions,
  useOfflineSync
} from '../../stores/portal-store'

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
  useOfflineStatus,
  formatDuration,
  getPortalTheme,
  getStatusColor
} from '../../hooks/usePortalManagement'

// Types
export type {
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
  PortalProgressStatus,
  PortalSubscriptionTier,
  PortalDifficulty,
  PortalCategory,
  CulturalContext,
  OfflineOperation
} from '../../types/portal-management'

/**
 * Initialize all portal services with default configuration
 * Call this once at app startup
 */
export function initializePortalServices(userId?: string) {
  // const portalManager = getPortalManager()
// const progressTracker = createProgressTracker()
// const unlockEngine = createUnlockEngine()
// const aiServiceManager = createAIServiceManager()

  return {
    portalManager,
    progressTracker,
    unlockEngine,
    aiServiceManager
  }
}

/**
 * Service health check
 * Verify all services are properly configured
 */
export async function checkServiceHealth() {
  const health = {
    portalManager: false,
    progressTracker: false,
    unlockEngine: false,
    aiServiceManager: false,
    database: false,
    ai: false
  }

  try {
    // Check Portal Manager
    const portalManager = getPortalManager()
    health.portalManager = true

    // Check Progress Tracker
    const progressTracker = createProgressTracker()
    health.progressTracker = true

    // Check Unlock Engine
    const unlockEngine = createUnlockEngine()
    health.unlockEngine = true

    // Check AI Service Manager
    const aiServiceManager = createAIServiceManager()
    health.aiServiceManager = true

    // TODO: Add actual health checks
    health.database = true
    health.ai = true

  } catch (error) {
    console.error('Service health check failed:', error)
  }

  return health
}

/**
 * Default service configuration
 */
export const DEFAULT_CONFIG = {
  portal: {
    cacheTtlMinutes: 5,
    maxRetries: 3,
    enableRealtime: true,
    enableOfflineSync: true
  },
  progress: {
    sessionTimeoutMinutes: 60,
    improvementWindowDays: 30,
    enableAnalytics: true,
    enableBiometricTracking: true
  },
  unlock: {
    unlockGracePeriodHours: 24,
    trialPeriodDays: 7,
    enablePaymentValidation: true,
    enableBiometricValidation: true,
    enableAchievementValidation: true
  },
  ai: {
    defaultModel: 'openai' as const,
    maxTokens: 1500,
    temperature: 0.7,
    enableCaching: true,
    enableCrisisDetection: true,
    culturalAdaptation: true
  }
}