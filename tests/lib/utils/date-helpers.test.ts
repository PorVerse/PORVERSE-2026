/**
 * Unit Tests for Date Helpers
 * Target Coverage: >90%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeTime,
  isToday,
  isPast,
  isFuture,
  addDays,
  daysBetween
} from '@/lib/utils/date-helpers'

describe('date-helpers', () => {
  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2025-12-14T10:30:00')
      const formatted = formatDate(date)
      expect(formatted).toBe('December 14, 2025')
    })

    it('should format string date correctly', () => {
      const formatted = formatDate('2025-12-14')
      expect(formatted).toContain('December')
      expect(formatted).toContain('2025')
    })
  })

  describe('formatTime', () => {
    it('should format time from Date object', () => {
      const date = new Date('2025-12-14T10:30:00')
      const formatted = formatTime(date)
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i)
    })

    it('should format time from string', () => {
      const formatted = formatTime('2025-12-14T14:30:00')
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i)
    })
  })

  describe('formatDateTime', () => {
    it('should combine date and time', () => {
      const date = new Date('2025-12-14T10:30:00')
      const formatted = formatDateTime(date)
      expect(formatted).toContain('at')
      expect(formatted).toContain('December')
    })
  })

  describe('getRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-14T10:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return "just now" for very recent dates', () => {
      const date = new Date('2025-12-14T09:59:30')
      expect(getRelativeTime(date)).toBe('just now')
    })

    it('should return minutes ago', () => {
      const date = new Date('2025-12-14T09:45:00')
      expect(getRelativeTime(date)).toBe('15 minutes ago')
    })

    it('should return singular minute', () => {
      const date = new Date('2025-12-14T09:59:00')
      expect(getRelativeTime(date)).toBe('1 minute ago')
    })

    it('should return hours ago', () => {
      const date = new Date('2025-12-14T08:00:00')
      expect(getRelativeTime(date)).toBe('2 hours ago')
    })

    it('should return singular hour', () => {
      const date = new Date('2025-12-14T09:00:00')
      expect(getRelativeTime(date)).toBe('1 hour ago')
    })

    it('should return days ago', () => {
      const date = new Date('2025-12-12T10:00:00')
      expect(getRelativeTime(date)).toBe('2 days ago')
    })

    it('should return formatted date for old dates', () => {
      const date = new Date('2025-10-14T10:00:00')
      const result = getRelativeTime(date)
      expect(result).toContain('October')
    })
  })

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-14T10:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true for today', () => {
      const date = new Date('2025-12-14T15:30:00')
      expect(isToday(date)).toBe(true)
    })

    it('should return false for yesterday', () => {
      const date = new Date('2025-12-13T10:00:00')
      expect(isToday(date)).toBe(false)
    })

    it('should return false for tomorrow', () => {
      const date = new Date('2025-12-15T10:00:00')
      expect(isToday(date)).toBe(false)
    })

    it('should work with string dates', () => {
      expect(isToday('2025-12-14')).toBe(true)
      expect(isToday('2025-12-13')).toBe(false)
    })
  })

  describe('isPast', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-14T10:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true for past dates', () => {
      const date = new Date('2025-12-14T09:00:00')
      expect(isPast(date)).toBe(true)
    })

    it('should return false for future dates', () => {
      const date = new Date('2025-12-14T11:00:00')
      expect(isPast(date)).toBe(false)
    })

    it('should work with string dates', () => {
      expect(isPast('2025-12-13')).toBe(true)
      expect(isPast('2025-12-15')).toBe(false)
    })
  })

  describe('isFuture', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-12-14T10:00:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true for future dates', () => {
      const date = new Date('2025-12-14T11:00:00')
      expect(isFuture(date)).toBe(true)
    })

    it('should return false for past dates', () => {
      const date = new Date('2025-12-14T09:00:00')
      expect(isFuture(date)).toBe(false)
    })
  })

  describe('addDays', () => {
    it('should add positive days', () => {
      const date = new Date('2025-12-14')
      const result = addDays(date, 5)
      expect(result.getDate()).toBe(19)
    })

    it('should subtract days with negative input', () => {
      const date = new Date('2025-12-14')
      const result = addDays(date, -5)
      expect(result.getDate()).toBe(9)
    })

    it('should work with string dates', () => {
      const result = addDays('2025-12-14', 7)
      expect(result.getDate()).toBe(21)
    })

    it('should handle month boundaries', () => {
      const date = new Date('2025-12-28')
      const result = addDays(date, 5)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getFullYear()).toBe(2026)
    })
  })

  describe('daysBetween', () => {
    it('should calculate days between two dates', () => {
      const date1 = new Date('2025-12-14')
      const date2 = new Date('2025-12-20')
      expect(daysBetween(date1, date2)).toBe(6)
    })

    it('should return absolute difference', () => {
      const date1 = new Date('2025-12-20')
      const date2 = new Date('2025-12-14')
      expect(daysBetween(date1, date2)).toBe(6)
    })

    it('should work with string dates', () => {
      expect(daysBetween('2025-12-14', '2025-12-20')).toBe(6)
    })

    it('should return 0 for same date', () => {
      const date = new Date('2025-12-14')
      expect(daysBetween(date, date)).toBe(0)
    })
  })
})