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
  if (totalLessons === 0) return 0
  return Math.round((completedLessons / totalLessons) * 100)
}

/**
 * Check if portal is locked
 */
export function isPortalLocked(portal: Portal): boolean {
  return !portal.is_unlocked
}

/**
 * Check if portal is completed
 */
export function isPortalCompleted(portal: Portal): boolean {
  return portal.completion_percentage === 100
}

/**
 * Get portal category color
 */
export function getCategoryColor(category: PortalCategory): string {
  const colors: Record<PortalCategory, string> = {
    mindfulness: 'bg-purple-500',
    physical: 'bg-blue-500',
    emotional: 'bg-pink-500',
    social: 'bg-green-500',
    spiritual: 'bg-yellow-500',
    intellectual: 'bg-indigo-500'
  }
  return colors[category] || 'bg-gray-500'
}

/**
 * Get portal category icon
 */
export function getCategoryIcon(category: PortalCategory): string {
  const icons: Record<PortalCategory, string> = {
    mindfulness: '🧘',
    physical: '💪',
    emotional: '❤️',
    social: '👥',
    spiritual: '✨',
    intellectual: '🧠'
  }
  return icons[category] || '📚'
}

/**
 * Format portal duration (in minutes)
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
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
 * Sort portals by priority
 */
export function sortPortalsByPriority(portals: Portal[]): Portal[] {
  return [...portals].sort((a, b) => {
    // Unlocked first
    if (a.is_unlocked && !b.is_unlocked) return -1
    if (!a.is_unlocked && b.is_unlocked) return 1
    
    // Then by completion (incomplete first)
    if (a.completion_percentage < 100 && b.completion_percentage === 100) return -1
    if (a.completion_percentage === 100 && b.completion_percentage < 100) return 1
    
    // Then by progress (higher progress first)
    return b.completion_percentage - a.completion_percentage
  })
}

/**
 * Filter portals by category
 */
export function filterByCategory(
  portals: Portal[],
  category: PortalCategory | 'all'
): Portal[] {
  if (category === 'all') return portals
  return portals.filter(portal => portal.category === category)
}

/**
 * Get next unlockable portal
 */
export function getNextUnlockable(
  portals: Portal[],
  currentPortalId: string
): Portal | null {
  const lockedPortals = portals.filter(p => !p.is_unlocked && p.id !== currentPortalId)
  return lockedPortals.length > 0 ? lockedPortals[0] : null
}