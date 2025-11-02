// utils/portal-helpers.ts
/**
 * 🎯 PorVerse V2 - Portal Helper Utilities
 * Utility functions for portal operations and calculations
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Helper functions for portal management, progress calculation, and status checks
 */

import type {
  Portal,
  PortalStep,
  UserPortalProgress,
  PortalProgressStatus,
  PortalSubscriptionTier,
  PortalDifficulty,
  PortalCategory,
} from '@/types/portal-management'

// ============================================================================
// PORTAL LOOKUP & FILTERING
// ============================================================================

/**
 * Get portal by ID
 */
export function getPortalById(portals: Portal[], portalId: string): Portal | undefined {
  return portals.find(p => p.id === portalId)
}

/**
 * Get portal by code (e.g., 'p0', 'p1')
 */
export function getPortalByCode(portals: Portal[], code: string): Portal | undefined {
  return portals.find(p => p.portal_code === code)
}

/**
 * Get all portals in a specific category
 */
export function getPortalsByCategory(portals: Portal[], category: PortalCategory): Portal[] {
  return portals.filter(p => p.category === category)
}

/**
 * Get all portals with a specific difficulty level
 */
export function getPortalsByDifficulty(portals: Portal[], difficulty: PortalDifficulty): Portal[] {
  return portals.filter(p => p.difficulty_level === difficulty)
}

/**
 * Get portals sorted by order index
 */
export function getSortedPortals(portals: Portal[]): Portal[] {
  return [...portals].sort((a, b) => a.order_index - b.order_index)
}

// ============================================================================
// PORTAL NAVIGATION
// ============================================================================

/**
 * Get the next portal in sequence
 */
export function getNextPortal(portals: Portal[], currentPortalCode: string): Portal | null {
  const sortedPortals = getSortedPortals(portals)
  const currentIndex = sortedPortals.findIndex(p => p.portal_code === currentPortalCode)
  
  if (currentIndex === -1 || currentIndex === sortedPortals.length - 1) {
    return null
  }
  
  return sortedPortals[currentIndex + 1]
}

/**
 * Get the previous portal in sequence
 */
export function getPreviousPortal(portals: Portal[], currentPortalCode: string): Portal | null {
  const sortedPortals = getSortedPortals(portals)
  const currentIndex = sortedPortals.findIndex(p => p.portal_code === currentPortalCode)
  
  if (currentIndex <= 0) {
    return null
  }
  
  return sortedPortals[currentIndex - 1]
}

/**
 * Get first incomplete portal
 */
export function getFirstIncompletePortal(
  portals: Portal[],
  userProgress: Record<string, UserPortalProgress>
): Portal | null {
  const sortedPortals = getSortedPortals(portals)
  
  for (const portal of sortedPortals) {
    const progress = userProgress[portal.id]
    if (!progress || progress.status !== 'completed') {
      return portal
    }
  }
  
  return null
}

// ============================================================================
// PORTAL ACCESS & UNLOCK LOGIC
// ============================================================================

/**
 * Check if portal is accessible based on subscription tier and progress
 */
export function isPortalAccessible(
  portal: Portal,
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): boolean {
  // Check subscription tier requirement
  if (!hasRequiredSubscriptionTier(portal.subscription_tier, subscriptionTier)) {
    return false
  }

  // Check if previous portal is required and completed
  if (portal.required_previous_portal) {
    const previousProgress = userProgress[portal.required_previous_portal]
    if (!previousProgress || previousProgress.status !== 'completed') {
      return false
    }
  }

  return true
}

/**
 * Check if user has required subscription tier
 */
export function hasRequiredSubscriptionTier(
  requiredTier: PortalSubscriptionTier,
  userTier: PortalSubscriptionTier
): boolean {
  const tierOrder: Record<PortalSubscriptionTier, number> = {
    free: 0,
    basic: 1,
    premium: 2,
    quantum: 3,
  }
  
  const requiredLevel = tierOrder[requiredTier] || 0
  const userLevel = tierOrder[userTier] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Get locked portals for a user
 */
export function getLockedPortals(
  portals: Portal[],
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): Portal[] {
  return portals.filter(portal => !isPortalAccessible(portal, userProgress, subscriptionTier))
}

/**
 * Get unlocked portals for a user
 */
export function getUnlockedPortals(
  portals: Portal[],
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): Portal[] {
  return portals.filter(portal => isPortalAccessible(portal, userProgress, subscriptionTier))
}

/**
 * Get reason why portal is locked
 */
export function getPortalLockReason(
  portal: Portal,
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): string | null {
  if (!hasRequiredSubscriptionTier(portal.subscription_tier, subscriptionTier)) {
    return `Requires ${portal.subscription_tier} subscription`
  }

  if (portal.required_previous_portal) {
    const previousProgress = userProgress[portal.required_previous_portal]
    if (!previousProgress || previousProgress.status !== 'completed') {
      return 'Complete the previous portal first'
    }
  }

  return null
}

// ============================================================================
// PROGRESS CALCULATIONS
// ============================================================================

/**
 * Calculate overall progress across all portals
 */
export function calculateOverallProgress(
  userProgress: Record<string, UserPortalProgress>
): number {
  const progressValues = Object.values(userProgress)
  
  if (progressValues.length === 0) {
    return 0
  }
  
  const totalProgress = progressValues.reduce(
    (sum, progress) => sum + progress.completion_percentage,
    0
  )
  
  return Math.round(totalProgress / progressValues.length)
}

/**
 * Calculate total time spent across all portals
 */
export function calculateTotalTimeSpent(
  userProgress: Record<string, UserPortalProgress>
): number {
  return Object.values(userProgress).reduce(
    (total, progress) => total + progress.time_spent_minutes,
    0
  )
}

/**
 * Calculate average quality score across completed portals
 */
export function calculateAverageQualityScore(
  userProgress: Record<string, UserPortalProgress>
): number {
  const completedPortals = Object.values(userProgress).filter(
    p => p.status === 'completed' && p.quality_score !== null
  )
  
  if (completedPortals.length === 0) {
    return 0
  }
  
  const totalScore = completedPortals.reduce(
    (sum, progress) => sum + (progress.quality_score || 0),
    0
  )
  
  return Math.round(totalScore / completedPortals.length)
}

/**
 * Get portal completion percentage for a specific portal
 */
export function getPortalCompletionPercentage(
  portalId: string,
  userProgress: Record<string, UserPortalProgress>
): number {
  const progress = userProgress[portalId]
  return progress?.completion_percentage || 0
}

/**
 * Check if portal is completed
 */
export function isPortalCompleted(
  portalId: string,
  userProgress: Record<string, UserPortalProgress>
): boolean {
  const progress = userProgress[portalId]
  return progress?.status === 'completed'
}

/**
 * Count completed portals
 */
export function countCompletedPortals(
  userProgress: Record<string, UserPortalProgress>
): number {
  return Object.values(userProgress).filter(p => p.status === 'completed').length
}

/**
 * Count portals in progress
 */
export function countPortalsInProgress(
  userProgress: Record<string, UserPortalProgress>
): number {
  return Object.values(userProgress).filter(p => p.status === 'in_progress').length
}

// ============================================================================
// STEP HELPERS
// ============================================================================

/**
 * Get current step for a portal
 */
export function getCurrentStep(
  steps: PortalStep[],
  progress: UserPortalProgress | null
): PortalStep | null {
  if (!progress) return steps[0] || null
  
  return steps.find(s => s.step_number === progress.current_step) || null
}

/**
 * Get next step in portal
 */
export function getNextStep(
  steps: PortalStep[],
  currentStepNumber: number
): PortalStep | null {
  const sortedSteps = [...steps].sort((a, b) => a.step_number - b.step_number)
  const nextStep = sortedSteps.find(s => s.step_number > currentStepNumber)
  return nextStep || null
}

/**
 * Calculate remaining steps
 */
export function getRemainingSteps(
  steps: PortalStep[],
  currentStepNumber: number
): number {
  return steps.filter(s => s.step_number > currentStepNumber).length
}

/**
 * Calculate estimated time remaining for portal
 */
export function getEstimatedTimeRemaining(
  steps: PortalStep[],
  currentStepNumber: number
): number {
  const remainingSteps = steps.filter(s => s.step_number > currentStepNumber)
  return remainingSteps.reduce((total, step) => total + step.estimated_duration_minutes, 0)
}

// ============================================================================
// STATUS & DISPLAY HELPERS
// ============================================================================

/**
 * Get portal status badge color
 */
export function getStatusBadgeColor(status: PortalProgressStatus): string {
  const colors: Record<PortalProgressStatus, string> = {
    locked: 'bg-gray-500',
    unlocked: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    completed: 'bg-green-500',
    paused: 'bg-purple-500',
    expired: 'bg-red-500',
  }
  return colors[status] || colors.locked
}

/**
 * Get portal status text color
 */
export function getStatusTextColor(status: PortalProgressStatus): string {
  const colors: Record<PortalProgressStatus, string> = {
    locked: 'text-gray-700',
    unlocked: 'text-blue-700',
    in_progress: 'text-yellow-700',
    completed: 'text-green-700',
    paused: 'text-purple-700',
    expired: 'text-red-700',
  }
  return colors[status] || colors.locked
}

/**
 * Get portal status display text
 */
export function getStatusDisplayText(status: PortalProgressStatus): string {
  const texts: Record<PortalProgressStatus, string> = {
    locked: 'Locked',
    unlocked: 'Unlocked',
    in_progress: 'In Progress',
    completed: 'Completed',
    paused: 'Paused',
    expired: 'Expired',
  }
  return texts[status] || 'Unknown'
}

/**
 * Get difficulty level emoji
 */
export function getDifficultyEmoji(difficulty: PortalDifficulty): string {
  const emojis: Record<PortalDifficulty, string> = {
    beginner: '⭐',
    intermediate: '⭐⭐',
    advanced: '⭐⭐⭐',
    expert: '⭐⭐⭐⭐',
    master: '⭐⭐⭐⭐⭐',
  }
  return emojis[difficulty] || '⭐'
}

/**
 * Get category emoji
 */
export function getCategoryEmoji(category: PortalCategory): string {
  const emojis: Record<PortalCategory, string> = {
    activation: '🔮',
    foundation: '🏗️',
    health: '🌱',
    mind: '🧠',
    flow: '🌊',
    well: '💧',
    quantum: '⚛️',
  }
  return emojis[category] || '🎯'
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format portal progress as percentage string
 */
export function formatProgressPercentage(progress: UserPortalProgress | null): string {
  if (!progress) return '0%'
  return `${progress.completion_percentage}%`
}

/**
 * Format time in minutes to readable string
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format portal title with emoji
 */
export function formatPortalTitle(portal: Portal): string {
  return `${portal.icon} ${portal.name}`
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate portal code format
 */
export function isValidPortalCode(code: string): boolean {
  return /^p[0-5]$/.test(code)
}

/**
 * Validate step number
 */
export function isValidStepNumber(stepNumber: number, totalSteps: number): boolean {
  return stepNumber >= 1 && stepNumber <= totalSteps
}

/**
 * Check if portal has required fields
 */
export function isValidPortal(portal: Partial<Portal>): portal is Portal {
  return !!(
    portal.id &&
    portal.name &&
    portal.portal_code &&
    portal.subscription_tier
  )
}

// ============================================================================
// RECOMMENDATION HELPERS
// ============================================================================

/**
 * Get recommended next portal based on progress
 */
export function getRecommendedPortal(
  portals: Portal[],
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): Portal | null {
  // First, try to find in-progress portal
  const inProgressPortal = portals.find(
    p => userProgress[p.id]?.status === 'in_progress'
  )
  if (inProgressPortal) return inProgressPortal

  // Next, find first accessible incomplete portal
  const sortedPortals = getSortedPortals(portals)
  for (const portal of sortedPortals) {
    if (isPortalAccessible(portal, userProgress, subscriptionTier)) {
      const progress = userProgress[portal.id]
      if (!progress || progress.status !== 'completed') {
        return portal
      }
    }
  }

  return null
}

/**
 * Get portals matching user's current skill level
 */
export function getPortalsForSkillLevel(
  portals: Portal[],
  completedPortalsCount: number
): Portal[] {
  let targetDifficulty: PortalDifficulty

  if (completedPortalsCount === 0) {
    targetDifficulty = 'beginner'
  } else if (completedPortalsCount <= 2) {
    targetDifficulty = 'intermediate'
  } else if (completedPortalsCount <= 4) {
    targetDifficulty = 'advanced'
  } else {
    targetDifficulty = 'expert'
  }

  return portals.filter(p => p.difficulty_level === targetDifficulty)
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export {
  // Lookup
  getPortalById,
  getPortalByCode,
  getPortalsByCategory,
  getPortalsByDifficulty,
  getSortedPortals,
  
  // Navigation
  getNextPortal,
  getPreviousPortal,
  getFirstIncompletePortal,
  
  // Access
  isPortalAccessible,
  hasRequiredSubscriptionTier,
  getLockedPortals,
  getUnlockedPortals,
  getPortalLockReason,
  
  // Progress
  calculateOverallProgress,
  calculateTotalTimeSpent,
  calculateAverageQualityScore,
  getPortalCompletionPercentage,
  isPortalCompleted,
  countCompletedPortals,
  countPortalsInProgress,
  
  // Steps
  getCurrentStep,
  getNextStep,
  getRemainingSteps,
  getEstimatedTimeRemaining,
  
  // Display
  getStatusBadgeColor,
  getStatusTextColor,
  getStatusDisplayText,
  getDifficultyEmoji,
  getCategoryEmoji,
  
  // Formatting
  formatProgressPercentage,
  formatMinutes,
  formatPortalTitle,
  
  // Validation
  isValidPortalCode,
  isValidStepNumber,
  isValidPortal,
  
  // Recommendations
  getRecommendedPortal,
  getPortalsForSkillLevel,
}