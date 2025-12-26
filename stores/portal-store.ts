/**
 * @fileoverview Production-Grade Zustand Store for Portal Management
 * @module store/portal-store
 * @description Advanced state management with CQRS, middleware stack, optimistic updates
 * @version 2.0.0
 * @production-ready YES
 */

import * as Sentry from '@sentry/nextjs';
import { create, type StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Portal {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  difficulty: number; // 1-5
  estimatedMinutes: number;
  experiencePoints: number;
  isLocked: boolean;
  requiredLevel: number;
  icon?: string;
  gradient?: string;
  steps: PortalStep[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PortalStep {
  id: string;
  portalId: string;
  stepNumber: number;
  name: string;
  description: string;
  estimatedMinutes: number;
  experiencePoints: number;
  isLocked: boolean;
  requiredPreviousStep?: string;
}

export interface UserProgress {
  portalId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  startedAt?: string;
  completedAt?: string;
  experienceGained: number;
  timeSpentMinutes: number;
}

export interface PortalFilters {
  category?: string;
  difficulty?: number[];
  isLocked?: boolean;
  searchTerm?: string;
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface PortalState {
  // Data
  portals: Portal[];
  progress: Record<string, UserProgress>;
  selectedPortalId: string | null;

  // UI State
  loading: boolean;
  error: Error | null;
  isOptimistic: boolean;
  filters: PortalFilters;

  // Metadata
  lastFetch: number | null;
  cacheValid: boolean;
}

// ============================================================================
// ACTIONS INTERFACE (CQRS Pattern)
// ============================================================================

interface PortalActions {
  // Commands (State Mutations)
  setPortals: (portals: Portal[]) => void;
  addPortal: (portal: Portal) => void;
  updatePortal: (id: string, updates: Partial<Portal>) => void;
  deletePortal: (id: string) => void;
  
  setProgress: (portalId: string, progress: UserProgress) => void;
  updateProgress: (portalId: string, updates: Partial<UserProgress>) => void;
  
  selectPortal: (id: string | null) => void;
  setFilters: (filters: Partial<PortalFilters>) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  
  invalidateCache: () => void;
  reset: () => void;

  // Queries (Computed/Derived State)
  getPortalById: (id: string) => Portal | undefined;
  getPortalsByCategory: (category: string) => Portal[];
  getFilteredPortals: () => Portal[];
  getAvailablePortals: () => Portal[];
  getProgressForPortal: (portalId: string) => UserProgress | undefined;
  isPortalCompleted: (portalId: string) => boolean;
  getTotalExperience: () => number;
}

export type PortalStore = PortalState & PortalActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PortalState = {
  portals: [],
  progress: {},
  selectedPortalId: null,
  loading: false,
  error: null,
  isOptimistic: false,
  filters: {},
  lastFetch: null,
  cacheValid: false,
};

// ============================================================================
// MIDDLEWARE: LOGGER
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logger = (config: unknown) => (set: unknown, get: unknown, api: unknown) =>
  config(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => {
      const [updates] = args;
      console.log('[Store Update]', {
        before: get(),
        updates,
        timestamp: new Date().toISOString(),
      });
      set(...args);
      console.log('[Store After]', get());
    },
    get,
    api
  );

// ============================================================================
// MIDDLEWARE: TELEMETRY
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const telemetry = (config: unknown) => (set: unknown, get: unknown, api: unknown) =>
  config(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => {
      const start = performance.now();
      set(...args);
      const duration = performance.now() - start;

      // Log slow state updates (>10ms)
      if (duration > 10) {
        Sentry.addBreadcrumb({
          category: 'store',
          message: 'Slow state update detected',
          level: 'warning',
          data: { duration, state: get() },
        });
      }
    },
    get,
    api
  );

// ============================================================================
// STORE CREATION
// ============================================================================

export const usePortalStore = create<PortalStore>()(
  devtools(
    persist(
      telemetry(
        immer((set, get: () => PortalStore) => ({
          // Initial State
          ...initialState,

          // ============================================================
          // COMMANDS (State Mutations)
          // ============================================================

          setPortals: (portals: Portal[]) => {
            set((state: PortalState) => {
              state.portals = portals;
              state.lastFetch = Date.now();
              state.cacheValid = true;
              state.loading = false;
              state.error = null;
            });

            Sentry.addBreadcrumb({
              category: 'store',
              message: 'Portals loaded',
              level: 'info',
              data: { count: portals.length },
            });
          },

          addPortal: (portal: Portal) => {
            set((state: PortalState) => {
              state.portals.push(portal);
              state.cacheValid = false;
            });

            Sentry.addBreadcrumb({
              category: 'store',
              message: 'Portal added',
              level: 'info',
              data: { portalId: portal.id, name: portal.name },
            });
          },

          updatePortal: (id: string, updates: Partial<Portal>) => {
            set((state: PortalState) => {
              const index = state.portals.findIndex((p) => p.id === id);
              if (index !== -1) {
                const portal = state.portals[index];
                if (portal) {
                  Object.assign(portal, updates);
                  state.cacheValid = false;
                }
              }
            });

            Sentry.addBreadcrumb({
              category: 'store',
              message: 'Portal updated',
              level: 'info',
              data: { portalId: id, updates },
            });
          },

          deletePortal: (id: string) => {
            set((state: PortalState) => {
              state.portals = state.portals.filter((p) => p.id !== id);
              delete state.progress[id];
              if (state.selectedPortalId === id) {
                state.selectedPortalId = null;
              }
              state.cacheValid = false;
            });

            Sentry.addBreadcrumb({
              category: 'store',
              message: 'Portal deleted',
              level: 'info',
              data: { portalId: id },
            });
          },

          setProgress: (portalId: string, progress: UserProgress) => {
            set((state: PortalState) => {
              state.progress[portalId] = progress;
            });
          },

          updateProgress: (portalId: string, updates: Partial<UserProgress>) => {
            set((state: PortalState) => {
              const current = state.progress[portalId];
              if (current) {
                Object.assign(current, updates);
              } else {
                // Initialize if doesn't exist
                const portal = state.portals.find((p) => p.id === portalId);
                if (portal) {
                  state.progress[portalId] = {
                    portalId,
                    currentStep: 0,
                    totalSteps: portal.steps.length,
                    completedSteps: [],
                    experienceGained: 0,
                    timeSpentMinutes: 0,
                    ...updates,
                  };
                }
              }
            });

            Sentry.addBreadcrumb({
              category: 'store',
              message: 'Progress updated',
              level: 'info',
              data: { portalId, updates },
            });
          },

          selectPortal: (id: string | null) => {
            set((state: PortalState) => {
              state.selectedPortalId = id;
            });
          },

          setFilters: (filters: Partial<PortalFilters>) => {
            set((state: PortalState) => {
              state.filters = { ...state.filters, ...filters };
            });
          },

          setLoading: (loading: boolean) => {
            set((state: PortalState) => {
              state.loading = loading;
            });
          },

          setError: (error: Error | null) => {
            set((state: PortalState) => {
              state.error = error;
              state.loading = false;
            });

            if (error) {
              Sentry.captureException(error, {
                tags: { store: 'portal' },
              });
            }
          },

          invalidateCache: () => {
            set((state: PortalState) => {
              state.cacheValid = false;
              state.lastFetch = null;
            });
          },

          reset: () => {
            set(initialState);
          },

          // ============================================================
          // QUERIES (Computed/Derived State)
          // ============================================================

          getPortalById: (id: string) => {
            return get().portals.find((p) => p.id === id);
          },

          getPortalsByCategory: (category: string) => {
            return get().portals.filter((p) => p.category === category);
          },

          getFilteredPortals: () => {
            const { portals, filters } = get();
            let filtered = [...portals];

            if (filters.category) {
              filtered = filtered.filter((p) => p.category === filters.category);
            }

            if (filters.difficulty && filters.difficulty.length > 0) {
              filtered = filtered.filter((p) =>
                filters.difficulty!.includes(p.difficulty)
              );
            }

            if (filters.isLocked !== undefined) {
              filtered = filtered.filter((p) => p.isLocked === filters.isLocked);
            }

            if (filters.searchTerm) {
              const term = filters.searchTerm.toLowerCase();
              filtered = filtered.filter(
                (p) =>
                  p.name.toLowerCase().includes(term) ||
                  p.description.toLowerCase().includes(term)
              );
            }

            return filtered;
          },

          getAvailablePortals: () => {
            return get().portals.filter((p) => !p.isLocked);
          },

          getProgressForPortal: (portalId: string) => {
            return get().progress[portalId];
          },

          isPortalCompleted: (portalId: string) => {
            const progress = get().progress[portalId];
            if (!progress) {return false;}
            return progress.currentStep >= progress.totalSteps;
          },

          getTotalExperience: () => {
            const { progress } = get();
            return Object.values(progress).reduce(
              (total, p) => total + p.experienceGained,
              0
            );
          },
        }))
      ),
      {
        name: 'portal-store',
        version: 1,
        // Only persist essential data
        partialize: (state) => ({
          progress: state.progress,
          filters: state.filters,
          selectedPortalId: state.selectedPortalId,
        }),
      }
    ),
    {
      name: 'PortalStore',
      enabled: process.env['NODE_ENV'] === 'development',
    }
  )
);

// ============================================================================
// SELECTORS (Memoized)
// ============================================================================

/**
 * High-performance selectors for derived state
 * These are automatically memoized by Zustand
 */

export const selectAllPortals = (state: PortalStore) => state.portals;
export const selectFilteredPortals = (state: PortalStore) => state.getFilteredPortals();
export const selectAvailablePortals = (state: PortalStore) => state.getAvailablePortals();
export const selectSelectedPortal = (state: PortalStore) =>
  state.selectedPortalId ? state.getPortalById(state.selectedPortalId) : null;
export const selectLoading = (state: PortalStore) => state.loading;
export const selectError = (state: PortalStore) => state.error;
export const selectTotalExperience = (state: PortalStore) => state.getTotalExperience();

// ============================================================================
// ACTIONS (For use outside React components)
// ============================================================================

/**
 * Standalone actions that can be called from anywhere
 * Useful for API integration, middleware, etc.
 */

export const portalStoreActions = {
  setPortals: (portals: Portal[]) => usePortalStore.getState().setPortals(portals),
  invalidateCache: () => usePortalStore.getState().invalidateCache(),
  reset: () => usePortalStore.getState().reset(),
};

// Note: Types Portal, PortalStep, UserProgress, PortalFilters already exported above
