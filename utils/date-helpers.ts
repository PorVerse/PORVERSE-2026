// utils/date-helpers.ts
/**
 * 📅 PorVerse V2 - Date Helper Utilities
 * Utilities for date formatting, calculation, and display
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 * @description Helper functions for date and time operations
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type DateInput = string | Date | number

export interface DateRange {
  start: Date
  end: Date
}

export interface DurationObject {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// ============================================================================
// DATE PARSING & NORMALIZATION
// ============================================================================

/**
 * Parse various date formats to Date object
 */
export function parseDate(input: DateInput): Date {
  if (input instanceof Date) {
    return input
  }
  
  if (typeof input === 'string') {
    return new Date(input)
  }
  
  if (typeof input === 'number') {
    return new Date(input)
  }
  
  throw new Error(`Invalid date input: ${input}`)
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(date: any): boolean {
  if (date instanceof Date) {
    return !isNaN(date.getTime())
  }
  
  try {
    const parsed = parseDate(date)
    return !isNaN(parsed.getTime())
  } catch {
    return false
  }
}

/**
 * Get current date/time
 */
export function now(): Date {
  return new Date()
}

/**
 * Get today's date at midnight
 */
export function today(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date to readable string (e.g., "January 15, 2024")
 */
export function formatDate(date: DateInput, locale = 'en-US'): string {
  const d = parseDate(date)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Format date to short string (e.g., "Jan 15, 2024")
 */
export function formatDateShort(date: DateInput, locale = 'en-US'): string {
  const d = parseDate(date)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/**
 * Format date to numeric string (e.g., "01/15/2024")
 */
export function formatDateNumeric(date: DateInput, locale = 'en-US'): string {
  const d = parseDate(date)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * Format time (e.g., "3:45 PM")
 */
export function formatTime(date: DateInput, locale = 'en-US'): string {
  const d = parseDate(date)
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/**
 * Format date and time (e.g., "January 15, 2024 at 3:45 PM")
 */
export function formatDateTime(date: DateInput, locale = 'en-US'): string {
  const d = parseDate(date)
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/**
 * Format date to ISO string (e.g., "2024-01-15T15:45:00.000Z")
 */
export function formatISO(date: DateInput): string {
  const d = parseDate(date)
  return d.toISOString()
}

// ============================================================================
// RELATIVE TIME FORMATTING
// ============================================================================

/**
 * Format date as relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: DateInput, baseDate: DateInput = now()): string {
  const d = parseDate(date)
  const base = parseDate(baseDate)
  const diffMs = d.getTime() - base.getTime()
  const diffSec = Math.floor(Math.abs(diffMs) / 1000)
  const isFuture = diffMs > 0

  // Less than a minute
  if (diffSec < 60) {
    return isFuture ? 'in a few seconds' : 'just now'
  }

  // Minutes
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    const text = diffMin === 1 ? 'minute' : 'minutes'
    return isFuture ? `in ${diffMin} ${text}` : `${diffMin} ${text} ago`
  }

  // Hours
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    const text = diffHours === 1 ? 'hour' : 'hours'
    return isFuture ? `in ${diffHours} ${text}` : `${diffHours} ${text} ago`
  }

  // Days
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) {
    const text = diffDays === 1 ? 'day' : 'days'
    return isFuture ? `in ${diffDays} ${text}` : `${diffDays} ${text} ago`
  }

  // Weeks
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) {
    const text = diffWeeks === 1 ? 'week' : 'weeks'
    return isFuture ? `in ${diffWeeks} ${text}` : `${diffWeeks} ${text} ago`
  }

  // Months
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) {
    const text = diffMonths === 1 ? 'month' : 'months'
    return isFuture ? `in ${diffMonths} ${text}` : `${diffMonths} ${text} ago`
  }

  // Years
  const diffYears = Math.floor(diffDays / 365)
  const text = diffYears === 1 ? 'year' : 'years'
  return isFuture ? `in ${diffYears} ${text}` : `${diffYears} ${text} ago`
}

/**
 * Format date as time ago (e.g., "2 hours ago")
 * Alias for formatRelativeTime with past dates
 */
export function formatTimeAgo(date: DateInput): string {
  return formatRelativeTime(date)
}

/**
 * Format date as time until (e.g., "in 3 days")
 * Alias for formatRelativeTime with future dates
 */
export function formatTimeUntil(date: DateInput): string {
  return formatRelativeTime(date)
}

// ============================================================================
// DURATION CALCULATIONS
// ============================================================================

/**
 * Calculate duration between two dates in milliseconds
 */
export function calculateDurationMs(start: DateInput, end: DateInput): number {
  const startDate = parseDate(start)
  const endDate = parseDate(end)
  return endDate.getTime() - startDate.getTime()
}

/**
 * Calculate duration between two dates in seconds
 */
export function calculateDurationSeconds(start: DateInput, end: DateInput): number {
  return Math.floor(calculateDurationMs(start, end) / 1000)
}

/**
 * Calculate duration between two dates in minutes
 */
export function calculateDurationMinutes(start: DateInput, end: DateInput): number {
  return Math.floor(calculateDurationMs(start, end) / 60000)
}

/**
 * Calculate duration between two dates in hours
 */
export function calculateDurationHours(start: DateInput, end: DateInput): number {
  return Math.floor(calculateDurationMs(start, end) / 3600000)
}

/**
 * Calculate duration between two dates in days
 */
export function calculateDurationDays(start: DateInput, end: DateInput): number {
  return Math.floor(calculateDurationMs(start, end) / 86400000)
}

/**
 * Calculate duration as object with days, hours, minutes, seconds
 */
export function calculateDuration(start: DateInput, end: DateInput): DurationObject {
  let totalSeconds = Math.abs(calculateDurationSeconds(start, end))
  
  const days = Math.floor(totalSeconds / 86400)
  totalSeconds %= 86400
  
  const hours = Math.floor(totalSeconds / 3600)
  totalSeconds %= 3600
  
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  return { days, hours, minutes, seconds }
}

// ============================================================================
// DURATION FORMATTING
// ============================================================================

/**
 * Format minutes to readable string (e.g., "2h 30m")
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format hours to readable string (e.g., "2d 5h")
 */
export function formatHours(hours: number): string {
  if (hours < 24) {
    return `${hours}h`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  if (remainingHours === 0) {
    return `${days}d`
  }
  
  return `${days}d ${remainingHours}h`
}

/**
 * Format duration object to readable string
 */
export function formatDuration(duration: DurationObject): string {
  const parts: string[] = []
  
  if (duration.days > 0) {
    parts.push(`${duration.days}d`)
  }
  if (duration.hours > 0) {
    parts.push(`${duration.hours}h`)
  }
  if (duration.minutes > 0) {
    parts.push(`${duration.minutes}m`)
  }
  if (duration.seconds > 0 && parts.length === 0) {
    parts.push(`${duration.seconds}s`)
  }
  
  return parts.join(' ') || '0s'
}

/**
 * Format seconds to readable string (e.g., "2m 30s")
 */
export function formatSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const duration = {
    days: 0,
    hours: 0,
    minutes: Math.floor(seconds / 60),
    seconds: seconds % 60,
  }
  
  return formatDuration(duration)
}

// ============================================================================
// DATE MANIPULATION
// ============================================================================

/**
 * Add days to a date
 */
export function addDays(date: DateInput, days: number): Date {
  const d = parseDate(date)
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Add hours to a date
 */
export function addHours(date: DateInput, hours: number): Date {
  const d = parseDate(date)
  const result = new Date(d)
  result.setHours(result.getHours() + hours)
  return result
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: DateInput, minutes: number): Date {
  const d = parseDate(date)
  const result = new Date(d)
  result.setMinutes(result.getMinutes() + minutes)
  return result
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: DateInput, days: number): Date {
  return addDays(date, -days)
}

/**
 * Subtract hours from a date
 */
export function subtractHours(date: DateInput, hours: number): Date {
  return addHours(date, -hours)
}

/**
 * Subtract minutes from a date
 */
export function subtractMinutes(date: DateInput, minutes: number): Date {
  return addMinutes(date, -minutes)
}

/**
 * Get start of day (midnight)
 */
export function startOfDay(date: DateInput): Date {
  const d = parseDate(date)
  const result = new Date(d)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get end of day (23:59:59.999)
 */
export function endOfDay(date: DateInput): Date {
  const d = parseDate(date)
  const result = new Date(d)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get start of week (Monday 00:00)
 */
export function startOfWeek(date: DateInput): Date {
  const d = parseDate(date)
  const result = new Date(d)
  const day = result.getDay()
  const diff = result.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  result.setDate(diff)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get end of week (Sunday 23:59:59.999)
 */
export function endOfWeek(date: DateInput): Date {
  const start = startOfWeek(date)
  return endOfDay(addDays(start, 6))
}

/**
 * Get start of month
 */
export function startOfMonth(date: DateInput): Date {
  const d = parseDate(date)
  const result = new Date(d)
  result.setDate(1)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get end of month
 */
export function endOfMonth(date: DateInput): Date {
  const d = parseDate(date)
  const result = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  result.setHours(23, 59, 59, 999)
  return result
}

// ============================================================================
// DATE COMPARISON
// ============================================================================

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: DateInput, date2: DateInput): boolean {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Check if date is today
 */
export function isToday(date: DateInput): boolean {
  return isSameDay(date, now())
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: DateInput): boolean {
  return isSameDay(date, subtractDays(now(), 1))
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: DateInput): boolean {
  return isSameDay(date, addDays(now(), 1))
}

/**
 * Check if date is in the past
 */
export function isPast(date: DateInput): boolean {
  return parseDate(date).getTime() < now().getTime()
}

/**
 * Check if date is in the future
 */
export function isFuture(date: DateInput): boolean {
  return parseDate(date).getTime() > now().getTime()
}

/**
 * Check if date is between two dates
 */
export function isBetween(date: DateInput, start: DateInput, end: DateInput): boolean {
  const d = parseDate(date).getTime()
  const s = parseDate(start).getTime()
  const e = parseDate(end).getTime()
  return d >= s && d <= e
}

// ============================================================================
// STREAK CALCULATIONS
// ============================================================================

/**
 * Calculate current streak from array of dates
 */
export function calculateStreak(dates: DateInput[]): number {
  if (dates.length === 0) return 0
  
  // Sort dates in descending order (newest first)
  const sortedDates = dates
    .map(d => startOfDay(d))
    .sort((a, b) => b.getTime() - a.getTime())
  
  // Check if most recent date is today or yesterday
  const mostRecent = sortedDates[0]
  const todayStart = startOfDay(now())
  const yesterdayStart = subtractDays(todayStart, 1)
  
  if (!isSameDay(mostRecent, todayStart) && !isSameDay(mostRecent, yesterdayStart)) {
    return 0 // Streak is broken
  }
  
  // Count consecutive days
  let streak = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i]
    const previousDate = sortedDates[i - 1]
    const daysDiff = calculateDurationDays(currentDate, previousDate)
    
    if (daysDiff === 1) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

/**
 * Get date range for last N days
 */
export function getLastNDays(days: number): DateRange {
  const end = endOfDay(now())
  const start = startOfDay(subtractDays(now(), days - 1))
  return { start, end }
}

/**
 * Get date range for this week
 */
export function getThisWeek(): DateRange {
  return {
    start: startOfWeek(now()),
    end: endOfWeek(now()),
  }
}

/**
 * Get date range for this month
 */
export function getThisMonth(): DateRange {
  return {
    start: startOfMonth(now()),
    end: endOfMonth(now()),
  }
}

// ============================================================================
// EXPORT ALL
// ============================================================================

// Exports are already inline with function declarations above
