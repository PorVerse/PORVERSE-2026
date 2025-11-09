// utils/portal-helpers.ts
/**
 * 🎯 PorVerse V2 - Portal Helper Utilities (enterprise, hardened)
 * Utility functions for portal operations and calculations
 * - Compatible with current DB types (no `portal_code` or `icon` assumed)
 * - Defensive typing against nullable numeric fields
 * - Difficulty normalization (number <-> label)
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

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL GUARDS & NORMALIZERS
// ─────────────────────────────────────────────────────────────────────────────

/** Map textual difficulty to numeric level and back when needed. */
const DIFFICULTY_TO_NUM: Record<PortalDifficulty | 'master', number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  // Some code paths (old helpers) used `master`; ignore at runtime if not present in types
  master: 5,
}

const NUM_TO_DIFFICULTY: Record<number, PortalDifficulty> = {
  1: 'beginner',
  2: 'intermediate',
  3: 'advanced',
  4: 'expert',
}

function normalizeDifficultyInput(
  difficulty: number | PortalDifficulty
): number {
  if (typeof difficulty === 'number') return difficulty
  return DIFFICULTY_TO_NUM[difficulty] ?? 0
}

function safeNumber(n: number | null | undefined, fallback = 0): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

// Accessor for optional legacy fields (e.g., portal_code) without TS errors
function getLegacyField<T = unknown>(obj: unknown, key: string): T | undefined {
  if (obj && typeof obj === 'object' && key in (obj as any)) {
    return (obj as any)[key] as T
  }
  return undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTAL LOOKUP & FILTERING
// ─────────────────────────────────────────────────────────────────────────────

/** Get portal by ID */
export function getPortalById(portals: Portal[], portalId: string): Portal | undefined {
  return portals.find((p) => p.id === portalId)
}

/**
 * Get portal by code (tolerant):
 * - Uses optional `portal_code` if present in schema.
 * - Falls back to comparing with `id` if caller passes an id string as code.
 */
export function getPortalByCode(portals: Portal[], code: string): Portal | undefined {
  return portals.find((p) => getLegacyField<string>(p, 'portal_code') === code || p.id === code)
}

/** Get all portals in a specific category */
export function getPortalsByCategory(portals: Portal[], category: PortalCategory): Portal[] {
  return portals.filter((p) => p.category === category)
}

/** Get all portals with a specific difficulty level (numeric or label). */
export function getPortalsByDifficulty(
  portals: Portal[],
  difficulty: number | PortalDifficulty
): Portal[] {
  const target = normalizeDifficultyInput(difficulty)
  return portals.filter((p) => safeNumber(p.difficulty_level) === target)
}

/** Get portals sorted by order index */
export function getSortedPortals(portals: Portal[]): Portal[] {
  return [...portals].sort((a, b) => safeNumber(a.order_index) - safeNumber(b.order_index))
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTAL NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the next portal in sequence.
 * Accepts a legacy `currentPortalCode` which can be portal_code or id.
 */
export function getNextPortal(portals: Portal[], currentPortalCode: string): Portal | null {
  const sorted = getSortedPortals(portals)
  const idx = sorted.findIndex(
    (p) => getLegacyField<string>(p, 'portal_code') === currentPortalCode || p.id === currentPortalCode
  )
  if (idx === -1 || idx === sorted.length - 1) return null
  return sorted[idx + 1]
}

/** Get the previous portal in sequence. */
export function getPreviousPortal(portals: Portal[], currentPortalCode: string): Portal | null {
  const sorted = getSortedPortals(portals)
  const idx = sorted.findIndex(
    (p) => getLegacyField<string>(p, 'portal_code') === currentPortalCode || p.id === currentPortalCode
  )
  if (idx <= 0) return null
  return sorted[idx - 1]
}

/** Get first incomplete portal (based on status !== 'completed'). */
export function getFirstIncompletePortal(
  portals: Portal[],
  userProgress: Record<string, UserPortalProgress>
): Portal | null {
  const sorted = getSortedPortals(portals)
  for (const portal of sorted) {
    const progress = userProgress[portal.id]
    if (!progress || progress.status !== 'completed') {
      return portal
    }
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTAL ACCESS & UNLOCK LOGIC
// ─────────────────────────────────────────────────────────────────────────────

/** Check if user has required subscription tier */
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
  const requiredLevel = tierOrder[requiredTier] ?? 0
  const userLevel = tierOrder[userTier] ?? 0
  return userLevel >= requiredLevel
}

/** Check if portal is accessible based on subscription tier and previous portal completion */
export function isPortalAccessible(
  portal: Portal,
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): boolean {
  if (!hasRequiredSubscriptionTier(portal.subscription_tier as PortalSubscriptionTier, subscriptionTier)) {
    return false
  }
  if (portal.required_previous_portal) {
    const prev = userProgress[portal.required_previous_portal]
    if (!prev || prev.status !== 'completed') return false
  }
  return true
}

/** Get locked portals for a user */
export function getLockedPortals(
  portals: Portal[],
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): Portal[] {
  return portals.filter((p) => !isPortalAccessible(p, userProgress, subscriptionTier))
}

/** Get unlocked portals for a user */
export function getUnlockedPortals(
  portals: Portal[],
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): Portal[] {
  return portals.filter((p) => isPortalAccessible(p, userProgress, subscriptionTier))
}

/** Explain why a portal is locked */
export function getPortalLockReason(
  portal: Portal,
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): string | null {
  if (!hasRequiredSubscriptionTier(portal.subscription_tier as PortalSubscriptionTier, subscriptionTier)) {
    return `Requires ${String(portal.subscription_tier)} subscription`
  }
  if (portal.required_previous_portal) {
    const prev = userProgress[portal.required_previous_portal]
    if (!prev || prev.status !== 'completed') return 'Complete the previous portal first'
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS CALCULATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Calculate overall progress across all portals (average of completion_percentage). */
export function calculateOverallProgress(
  userProgress: Record<string, UserPortalProgress>
): number {
  const items = Object.values(userProgress)
  if (items.length === 0) return 0
  const total = items.reduce((sum, p) => sum + safeNumber(p.completion_percentage), 0)
  return Math.round(total / items.length)
}

/** Calculate total time spent across all portals (minutes). */
export function calculateTotalTimeSpent(
  userProgress: Record<string, UserPortalProgress>
): number {
  return Object.values(userProgress).reduce(
    (total, p) => total + safeNumber((p as any).time_spent_minutes),
    0
  )
}

/**
 * Calculate average quality score across completed portals (best-effort).
 * If schema lacks `quality_score` on progress, returns 0.
 */
export function calculateAverageQualityScore(
  userProgress: Record<string, UserPortalProgress>
): number {
  const completed = Object.values(userProgress).filter((p) => p.status === 'completed')
  const withQuality = completed
    .map((p) => (p as any).quality_score as number | null | undefined)
    .filter((q): q is number => typeof q === 'number' && Number.isFinite(q))
  if (withQuality.length === 0) return 0
  const total = withQuality.reduce((s, q) => s + q, 0)
  return Math.round(total / withQuality.length)
}

/** Get portal completion percentage for a specific portal */
export function getPortalCompletionPercentage(
  portalId: string,
  userProgress: Record<string, UserPortalProgress>
): number {
  const p = userProgress[portalId]
  return safeNumber(p?.completion_percentage)
}

/** Is portal completed? */
export function isPortalCompleted(
  portalId: string,
  userProgress: Record<string, UserPortalProgress>
): boolean {
  return userProgress[portalId]?.status === 'completed'
}

/** Count completed portals */
export function countCompletedPortals(userProgress: Record<string, UserPortalProgress>): number {
  return Object.values(userProgress).filter((p) => p.status === 'completed').length
}

/** Count portals in progress */
export function countPortalsInProgress(userProgress: Record<string, UserPortalProgress>): number {
  return Object.values(userProgress).filter((p) => p.status === 'in_progress').length
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Get current step for a portal */
export function getCurrentStep(
  steps: PortalStep[],
  progress: UserPortalProgress | null
): PortalStep | null {
  if (!progress) return steps[0] || null
  return steps.find((s) => s.step_number === progress.current_step) || null
}

/** Get next step in portal */
export function getNextStep(steps: PortalStep[], currentStepNumber: number): PortalStep | null {
  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number)
  const next = sorted.find((s) => s.step_number > currentStepNumber)
  return next || null
}

/** Calculate remaining steps */
export function getRemainingSteps(steps: PortalStep[], currentStepNumber: number): number {
  return steps.filter((s) => s.step_number > currentStepNumber).length
}

/** Calculate estimated time remaining for portal (minutes). */
export function getEstimatedTimeRemaining(steps: PortalStep[], currentStepNumber: number): number {
  const remaining = steps.filter((s) => s.step_number > currentStepNumber)
  return remaining.reduce((total, s) => total + safeNumber(s.estimated_duration_minutes), 0)
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS & DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Get portal status badge color */
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

/** Get portal status text color */
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

/** Get portal status display text */
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

/** Get difficulty level emoji (mapped from normalized numeric when needed). */
export function getDifficultyEmoji(difficulty: PortalDifficulty | number): string {
  const level = normalizeDifficultyInput(difficulty as any)
  const map: Record<number, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐' }
  return map[level] || '⭐'
}

/** Get category emoji */
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

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Format portal progress as percentage string */
export function formatProgressPercentage(progress: UserPortalProgress | null): string {
  return `${safeNumber(progress?.completion_percentage)}%`
}

/** Format minutes to `xh ym` */
export function formatMinutes(minutes: number): string {
  const m = safeNumber(minutes)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r === 0 ? `${h}h` : `${h}h ${r}m`
}

/** Format portal title with emoji derived from category (no `icon` assumed). */
export function formatPortalTitle(portal: Portal): string {
  const category = (portal.category as PortalCategory) ?? 'activation'
  return `${getCategoryEmoji(category)} ${portal.name}`
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Validate portal code format like `p0`..`p5` (legacy). */
export function isValidPortalCode(code: string): boolean {
  return /^p[0-9]+$/i.test(code)
}

/** Validate step number bounds */
export function isValidStepNumber(stepNumber: number, totalSteps: number): boolean {
  return stepNumber >= 1 && stepNumber <= totalSteps
}

/** Check if portal has required fields (relaxed – no `portal_code` required). */
export function isValidPortal(portal: Partial<Portal>): portal is Portal {
  return !!(portal && portal.id && portal.name && portal.subscription_tier)
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Get recommended next portal based on progress and accessibility. */
export function getRecommendedPortal(
  portals: Portal[],
  userProgress: Record<string, UserPortalProgress>,
  subscriptionTier: PortalSubscriptionTier
): Portal | null {
  const inProgress = portals.find((p) => userProgress[p.id]?.status === 'in_progress')
  if (inProgress) return inProgress

  const sorted = getSortedPortals(portals)
  for (const portal of sorted) {
    if (isPortalAccessible(portal, userProgress, subscriptionTier)) {
      const prog = userProgress[portal.id]
      if (!prog || prog.status !== 'completed') return portal
    }
  }
  return null
}

/** Get portals that match an inferred skill level based on completed count. */
export function getPortalsForSkillLevel(
  portals: Portal[],
  completedPortalsCount: number
): Portal[] {
  let target: number
  if (completedPortalsCount === 0) target = 1
  else if (completedPortalsCount <= 2) target = 2
  else if (completedPortalsCount <= 4) target = 3
  else target = 4

  return portals.filter((p) => safeNumber(p.difficulty_level) === target)
}

// Exports are inline with declarations above.
