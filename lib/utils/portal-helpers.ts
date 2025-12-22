/**
 * Portal Helpers - Utility functions for portal management
 * @module lib/utils/portal-helpers
 */

import type { Portal, PortalCategory } from '@/types'

/**
 * Calculate portal completion percentage
 */
export function calculatePortalProgress(
  completedLessons: number,
  totalLessons: number
): number {
  if (totalLessons === 0) {
    return 0
  }
  return Math.round((completedLessons / totalLessons) * 100)
}

/**
 * Check if portal is locked (based on user progress)
 * Note: Portal entity doesn't contain unlock state - use UserPortalProgress instead
 * @deprecated Use utils/portal-helpers.ts isPortalCompleted with UserPortalProgress
 */
export function isPortalLocked(progress: { status: string } | undefined): boolean {
  return !progress || progress.status === 'locked'
}

/**
 * Check if portal is completed (based on user progress)
 * Note: Portal entity doesn't contain completion state - use UserPortalProgress instead
 * @deprecated Use utils/portal-helpers.ts isPortalCompleted with UserPortalProgress
 */
export function isPortalCompleted(progress: { status: string } | undefined): boolean {
  return progress?.status === 'completed'
}

/**
 * Get portal category color
 */
export function getCategoryColor(category: PortalCategory): string {
  const colors: Record<PortalCategory, string> = {
    activation: 'bg-purple-500',
    foundation: 'bg-blue-500',
    health: 'bg-pink-500',
    mind: 'bg-green-500',
    flow: 'bg-yellow-500',
    well: 'bg-indigo-500',
    quantum: 'bg-violet-500'
  }
  return colors[category] || 'bg-gray-500'
}

/**
 * Get portal category icon
 */
export function getCategoryIcon(category: PortalCategory): string {
  const icons: Record<PortalCategory, string> = {
    activation: '⚡',
    foundation: '🏛️',
    health: '❤️',
    mind: '🧠',
    flow: '🌊',
    well: '🌟',
    quantum: '✨'
  }
  return icons[category] || '📚'
}

/**
 * Format portal duration (in minutes)
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {return `${minutes}m`}
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Calculate XP earned from portal
 */
export function calculateXP(
  baseXP: number,
  completionPercentage: number
): number {
  return Math.round((baseXP * completionPercentage) / 100)
}

/**
 * Get portal difficulty badge
 */
export function getDifficultyBadge(difficulty: 'beginner' | 'intermediate' | 'advanced'): {
  label: string
  color: string
} {
  const badges = {
    beginner: { label: 'Beginner', color: 'bg-green-100 text-green-800' },
    intermediate: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
    advanced: { label: 'Advanced', color: 'bg-red-100 text-red-800' }
  }
  return badges[difficulty] || badges.beginner
}

/**
 * Sort portals by order index and difficulty
 * Note: For sorting by user progress, use utils/portal-helpers.ts with UserPortalProgress
 */
export function sortPortalsByPriority(portals: Portal[]): Portal[] {
  return [...portals].sort((a, b) => {
    // Active portals first
    if (a.is_active && !b.is_active) {
      return -1
    }
    if (!a.is_active && b.is_active) {
      return 1
    }
    
    // Then by order index (lower first)
    if (a.order_index !== b.order_index) {
      return a.order_index - b.order_index
    }
    
    // Then by difficulty level (easier first)
    return a.difficulty_level - b.difficulty_level
  })
}

/**
 * Filter portals by category
 */
export function filterByCategory(
  portals: Portal[],
  category: PortalCategory | 'all'
): Portal[] {
  if (category === 'all') {return portals}
  return portals.filter(portal => portal.category === category)
}

/**
 * Get next portal in sequence based on order_index
 * Note: For checking unlock status, use UserPortalProgress data
 */
export function getNextPortalInSequence(
  portals: Portal[],
  currentPortalId: string
): Portal | null {
  const currentPortal = portals.find(p => p.id === currentPortalId)
  if (!currentPortal) {return null}
  
  const nextPortals = portals
    .filter(p => p.order_index > currentPortal.order_index && p.is_active)
    .sort((a, b) => a.order_index - b.order_index)
  
  return nextPortals[0] ?? null
}