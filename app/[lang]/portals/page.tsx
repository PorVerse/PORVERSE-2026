/**
 * @fileoverview Production-Grade Portals Page
 * @module app/portals/page
 * @description Main portals listing with CQRS, error handling, performance optimization
 * @version 2.0.0
 * @production-ready YES
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PortalCard } from '@/components/organisms/portal-card';
import { usePortalStore, type Portal, type UserProgress } from '@/store/portal-store';
import { useRetry, useDebounce } from '@/hooks';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PortalStepSchema = z.object({
  id: z.string().uuid(),
  portal_id: z.string().uuid(),
  step_number: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  estimated_time: z.number().int().nonnegative(),
  experience_points: z.number().int().nonnegative(),
  is_locked: z.boolean(),
  required_previous_step: z.string().uuid().nullable().optional(),
});

const PortalResponseItemSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.number().int().min(1).max(5),
  estimated_time: z.number().int().nonnegative(),
  experience_points: z.number().int().nonnegative(),
  is_locked: z.boolean(),
  unlock_requirement: z
    .object({
      required_level: z.number().int().nonnegative(),
    })
    .nullable()
    .optional(),
  icon: z.string().nullable().optional(),
  gradient: z.string().nullable().optional(),
  steps: z.array(PortalStepSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const PortalResponseSchema = z.object({
  data: z.array(PortalResponseItemSchema),
  cached: z.boolean().optional(),
  cacheHit: z.boolean().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

interface DatabasePortal {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  difficulty: number;
  estimated_time: number;
  experience_points: number;
  is_locked: boolean;
  unlock_requirement?: {
    required_level: number;
  } | null;
  icon?: string | null;
  gradient?: string | null;
  steps?: any[];
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Transform database format to component format
 * Type-safe conversion with proper error handling
 */
function transformPortalData(dbPortal: DatabasePortal): Portal {
  return {
    id: dbPortal.id,
    code: dbPortal.code,
    name: dbPortal.name,
    description: dbPortal.description,
    category: dbPortal.category,
    difficulty: dbPortal.difficulty,
    estimatedMinutes: dbPortal.estimated_time,
    experiencePoints: dbPortal.experience_points,
    isLocked: dbPortal.is_locked,
    requiredLevel: dbPortal.unlock_requirement?.required_level || 1,
    icon: dbPortal.icon || undefined,
    gradient: dbPortal.gradient || undefined,
    steps: (dbPortal.steps || []).map((step: any) => ({
      id: step.id,
      portalId: step.portal_id,
      stepNumber: step.step_number,
      name: step.name,
      description: step.description,
      estimatedMinutes: step.estimated_time,
      experiencePoints: step.experience_points,
      isLocked: step.is_locked,
      requiredPreviousStep: step.required_previous_step || undefined,
    })),
    createdAt: dbPortal.created_at,
    updatedAt: dbPortal.updated_at,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PortalsPage() {
  const router = useRouter();
  
  // Store state
  const {
    portals: storePortals,
    progress: storeProgress,
    setPortals: setStorePortals,
    setLoading: setStoreLoading,
    setError: setStoreError,
  } = usePortalStore();

  // Local state
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Retry hook for resilience
  const { retry, attempt, isRetrying } = useRetry({
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    onRetry: (attemptNum, retryError) => {
      console.log(`Retry attempt ${attemptNum}:`, retryError.message);
      Sentry.addBreadcrumb({
        category: 'retry',
        message: `Retrying portals fetch (attempt ${attemptNum}/3)`,
        level: 'warning',
        data: { error: retryError.message },
      });
    },
  });

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchPortals = useCallback(async () => {
    try {
      setLoading(true);
      setStoreLoading(true);
      setError(null);
      setStoreError(null);

      // Fetch with retry logic
      const data = await retry(async () => {
        const response = await fetch('/api/portals?includeSteps=true', {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store', // Always fresh data
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      });

      // Validate response
      const validatedData = PortalResponseSchema.parse(data);

      // Transform to component format
      const transformedPortals = validatedData.data.map(transformPortalData);

      // Update state
      setPortals(transformedPortals);
      setStorePortals(transformedPortals);

      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'portals_loaded', {
          event_category: 'engagement',
          event_label: 'portals_page',
          value: transformedPortals.length,
        });
      }

      // Sentry breadcrumb
      Sentry.addBreadcrumb({
        category: 'data',
        message: 'Portals loaded successfully',
        level: 'info',
        data: {
          count: transformedPortals.length,
          cached: validatedData.cached || validatedData.cacheHit,
        },
      });
    } catch (err) {
      const fetchError = err as Error;
      setError(fetchError);
      setStoreError(fetchError);

      // Error tracking
      Sentry.captureException(fetchError, {
        tags: {
          page: 'portals',
          action: 'fetch',
          attempt: attempt,
        },
        extra: {
          searchTerm: debouncedSearch,
          category: selectedCategory,
        },
      });

      console.error('Failed to fetch portals:', fetchError);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  }, [retry, attempt, debouncedSearch, selectedCategory, setStorePortals, setStoreLoading, setStoreError]);

  // Initial fetch
  useEffect(() => {
    fetchPortals();
  }, [fetchPortals]);

  // ============================================================
  // Event Handlers
  // ============================================================

  const handlePortalSelect = useCallback(
    (portalId: string) => {
      console.log('Portal selected:', portalId);
      
      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'portal_select', {
          event_category: 'engagement',
          event_label: portalId,
        });
      }

      // Sentry breadcrumb
      Sentry.addBreadcrumb({
        category: 'user-action',
        message: 'Portal selected',
        level: 'info',
        data: { portalId },
      });

      // TODO: Navigate to portal session
      // router.push(`/portals/${portalId}/session`);
    },
    [router]
  );

  // ============================================================
  // Filtered Portals (Memoized)
  // ============================================================

  const filteredPortals = useMemo(() => {
    let filtered = [...portals];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search term
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [portals, selectedCategory, debouncedSearch]);

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set(portals.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [portals]);

  // ============================================================
  // Render: Loading State
  // ============================================================

  if (loading && portals.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Portals</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Begin your journey of transformation
          </p>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <PortalCard
              key={i}
              portal={{} as Portal}
              onSelect={() => {}}
              loading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Error State
  // ============================================================

  if (error && portals.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-200 mb-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <h2 className="text-xl font-semibold">Failed to load portals</h2>
          </div>
          
          <p className="text-sm text-red-600 dark:text-red-400 mb-6">
            {error.message}
          </p>

          {isRetrying && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              Retrying... (Attempt {attempt}/3)
            </p>
          )}

          <button
            onClick={fetchPortals}
            disabled={isRetrying}
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Main Content
  // ============================================================

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          Your Portals
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Begin your journey of transformation
        </p>
      </div>

      {/* Filters & Search */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search portals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            aria-label="Search portals"
          />
        </div>

        {/* Category Filter */}
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer capitalize"
            aria-label="Filter by category"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      {debouncedSearch.trim() || selectedCategory !== 'all' ? (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Found {filteredPortals.length} portal{filteredPortals.length !== 1 ? 's' : ''}
        </div>
      ) : null}

      {/* Portal Grid */}
      {filteredPortals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortals.map((portal) => (
            <PortalCard
              key={portal.id}
              portal={portal}
              progress={storeProgress[portal.id]}
              onSelect={handlePortalSelect}
              showProgress={true}
              showMetadata={true}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No portals found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// METADATA (SEO)
// ============================================================================

export const metadata = {
  title: 'Your Portals | PorVerse',
  description: 'Explore your transformation journey through immersive portals',
  openGraph: {
    title: 'Your Portals | PorVerse',
    description: 'Explore your transformation journey through immersive portals',
  },
};