import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePortalStore } from '@/stores/portal-store'

// Mock portal data
const mockPortal = {
  id: 'portal-1',
  name: 'Test Portal',
  portal_code: 'TEST',
  title: 'Test Portal',
  description: 'Test Description',
  category: 'body',
  difficulty_level: 1,
  estimated_duration_minutes: 60,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockProgress = {
  portalId: 'portal-1',
  currentStep: 1,
  totalSteps: 5,
  completedSteps: ['step-1'],
  experienceGained: 50,
  lastActivity: new Date().toISOString()
}

describe('usePortalStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => usePortalStore())
    act(() => {
      result.current.reset()
    })
  })

  it('initializes with empty state', () => {
    const { result } = renderHook(() => usePortalStore())
    
    expect(result.current.portals).toEqual([])
    expect(result.current.progress).toEqual({})
    expect(result.current.selectedPortalId).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('sets portals', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setPortals([mockPortal])
    })

    expect(result.current.portals).toHaveLength(1)
    expect(result.current.portals[0]).toEqual(mockPortal)
  })

  it('adds single portal', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.addPortal(mockPortal)
    })

    expect(result.current.portals).toHaveLength(1)
  })

  it('updates portal', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setPortals([mockPortal])
      result.current.updatePortal('portal-1', { name: 'Updated Name' })
    })

    expect(result.current.portals[0]?.name).toBe('Updated Name')
  })

  it('deletes portal', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setPortals([mockPortal])
      result.current.deletePortal('portal-1')
    })

    expect(result.current.portals).toHaveLength(0)
  })

  it('sets progress for portal', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setProgress('portal-1', mockProgress)
    })

    expect(result.current.progress['portal-1']).toEqual(mockProgress)
  })

  it('selects portal', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.selectPortal('portal-1')
    })

    expect(result.current.selectedPortalId).toBe('portal-1')
  })

  it('gets portal by ID', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setPortals([mockPortal])
    })

    const portal = result.current.getPortalById('portal-1')
    expect(portal).toEqual(mockPortal)
  })

  it('returns null for non-existent portal', () => {
    const { result } = renderHook(() => usePortalStore())
    
    const portal = result.current.getPortalById('non-existent')
    expect(portal).toBeNull()
  })

  it('checks if portal is completed', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setProgress('portal-1', {
        ...mockProgress,
        currentStep: 5,
        completedSteps: ['step-1', 'step-2', 'step-3', 'step-4', 'step-5']
      })
    })

    expect(result.current.isPortalCompleted('portal-1')).toBe(true)
  })

  it('returns false for incomplete portal', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setProgress('portal-1', mockProgress)
    })

    expect(result.current.isPortalCompleted('portal-1')).toBe(false)
  })

  it('calculates total experience', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setProgress('portal-1', mockProgress)
      result.current.setProgress('portal-2', { 
        ...mockProgress, 
        portalId: 'portal-2', 
        experienceGained: 75 
      })
    })

    expect(result.current.getTotalExperience()).toBe(125)
  })

  it('returns 0 experience for empty progress', () => {
    const { result } = renderHook(() => usePortalStore())
    
    expect(result.current.getTotalExperience()).toBe(0)
  })

  it('sets loading state', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.loading).toBe(true)
  })

  it('resets store to initial state', () => {
    const { result } = renderHook(() => usePortalStore())
    
    act(() => {
      result.current.setPortals([mockPortal])
      result.current.setProgress('portal-1', mockProgress)
      result.current.selectPortal('portal-1')
      result.current.reset()
    })

    expect(result.current.portals).toEqual([])
    expect(result.current.progress).toEqual({})
    expect(result.current.selectedPortalId).toBeNull()
  })

  it('handles multiple portals', () => {
    const { result } = renderHook(() => usePortalStore())
    
    const portal2 = { ...mockPortal, id: 'portal-2', name: 'Portal 2' }
    const portal3 = { ...mockPortal, id: 'portal-3', name: 'Portal 3' }
    
    act(() => {
      result.current.setPortals([mockPortal, portal2, portal3])
    })

    expect(result.current.portals).toHaveLength(3)
  })

  it('updates existing portal without affecting others', () => {
    const { result } = renderHook(() => usePortalStore())
    
    const portal2 = { ...mockPortal, id: 'portal-2', name: 'Portal 2' }
    
    act(() => {
      result.current.setPortals([mockPortal, portal2])
      result.current.updatePortal('portal-1', { name: 'Updated Portal 1' })
    })

    expect(result.current.portals[0]?.name).toBe('Updated Portal 1')
    expect(result.current.portals[1]?.name).toBe('Portal 2')
  })
})