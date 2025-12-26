import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLocalization } from '@/hooks/useLocalization'

describe('useLocalization', () => {
  it('initializes with default locale', () => {
    const { result } = renderHook(() => useLocalization())
    
    expect(result.current.language).toBeDefined()
    expect(['en', 'ro']).toContain(result.current.language)
  })

  it('detects location and sets currency', async () => {
    const { result } = renderHook(() => useLocalization())

    await waitFor(() => {
      expect(result.current.currency).toBeDefined()
      expect(['RON', 'EUR', 'USD']).toContain(result.current.currency)
    })
  })

  it('changes language', async () => {
    const { result } = renderHook(() => useLocalization())

    await waitFor(() => {
      expect(result.current.language).toBeDefined()
    })

    result.current.changeLanguage('ro')

    await waitFor(() => {
      expect(result.current.language).toBe('ro')
    })
  })

  it('provides pricing tier based on location', async () => {
    const { result } = renderHook(() => useLocalization())

    await waitFor(() => {
      expect(result.current.pricingTier).toBeDefined()
      expect(['us', 'eu', 'global']).toContain(result.current.pricingTier)
    })
  })

  it('formats currency correctly', async () => {
    const { result } = renderHook(() => useLocalization())

    await waitFor(() => {
      expect(result.current.formatCurrency).toBeDefined()
    })

    const formatted = result.current.formatCurrency(100)
    expect(formatted).toMatch(/\d+/)
  })
})