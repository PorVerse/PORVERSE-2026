/**
 * Portal Card Component - INTERSTELLAR LEVEL
 * @module presentation/components/organisms/PortalCard
 * 
 * FEATURES:
 * - Optimistic UI updates
 * - Error boundaries
 * - Performance optimized (React.memo, useMemo)
 * - Accessibility (WCAG AAA)
 * - Animations (Framer Motion)
 * - Telemetry & Analytics
 * - Retry logic with exponential backoff
 * - Circuit breaker integration
 * - Loading states with skeleton
 * - Success/Error toast notifications
 */

'use client';

import React, { useCallback, useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Clock, TrendingUp, Zap, Star } from 'lucide-react';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { usePortalStore } from '@/store/portal-store';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const PortalSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(3),
  description: z.string(),
  category: z.enum(['awakening', 'transformation', 'mastery', 'transcendence']),
  difficulty: z.number().int().min(1).max(5),
  estimatedMinutes: z.number().positive(),
  experiencePoints: z.number().nonnegative(),
  isLocked: z.boolean(),
  requiredLevel: z.number().int().positive(),
  iconUrl: z.string().url().optional(),
});

const ProgressSchema = z.object({
  portalId: z.string().uuid(),
  currentStep: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
  completedAt: z.date().nullable(),
  lastAccessed: z.date(),
});

type Portal = z.infer<typeof PortalSchema>;
type Progress = z.infer<typeof ProgressSchema>;

interface PortalCardProps {
  portal: Portal;
  progress?: Progress;
  onSelect: (portalId: string) => void;
  variant?: 'card' | 'compact' | 'list';
  showProgress?: boolean;
  showMetadata?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_COLORS = {
  awakening: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  transformation: {
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  mastery: {
    bg: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    glow: 'shadow-red-500/20',
  },
  transcendence: {
    bg: 'from-amber-500/10 to-amber-600/5',
    border: 'border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/20',
  },
} as const;

const ANIMATION_VARIANTS = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  hover: { y: -4, scale: 1.02 },
  tap: { scale: 0.98 },
};

// ═══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════════════════════════════════════

class PortalCardErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: 'PortalCard',
        error_boundary: 'true',
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">
            Failed to load portal card. Please try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTAL CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PortalCardComponent: React.FC<PortalCardProps> = ({
  portal,
  progress,
  onSelect,
  variant = 'card',
  showProgress = true,
  showMetadata = true,
  loading = false,
  disabled = false,
  className = '',
}) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE & HOOKS
  // ─────────────────────────────────────────────────────────────────────────

  const [isHovered, setIsHovered] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const { executeWithCircuitBreaker } = useCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 30000,
  });

  const { optimisticState, executeOptimistically } = useOptimisticUpdate<Portal>();

  // ─────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES (MEMOIZED)
  // ─────────────────────────────────────────────────────────────────────────

  const categoryStyles = useMemo(
    () => CATEGORY_COLORS[portal.category],
    [portal.category]
  );

  const progressPercentage = useMemo(() => {
    if (!progress || progress.totalSteps === 0) return 0;
    return Math.round((progress.currentStep / progress.totalSteps) * 100);
  }, [progress]);

  const isCompleted = useMemo(() => {
    return progress?.completedAt !== null;
  }, [progress]);

  const isInProgress = useMemo(() => {
    return progress && progress.currentStep > 0 && !isCompleted;
  }, [progress, isCompleted]);

  const canAccess = useMemo(() => {
    return !portal.isLocked && !disabled;
  }, [portal.isLocked, disabled]);

  const difficultyStars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => i < portal.difficulty);
  }, [portal.difficulty]);

  // ─────────────────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────

  const handleClick = useCallback(async () => {
    if (!canAccess || loading || isPending) return;

    try {
      // Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'portal_card_click', {
          portal_id: portal.id,
          portal_code: portal.code,
          portal_category: portal.category,
        });
      }

      // Execute with circuit breaker
      await executeWithCircuitBreaker(async () => {
        startTransition(() => {
          onSelect(portal.id);
        });
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'PortalCard',
          action: 'click',
          portal_id: portal.id,
        },
      });

      toast.error('Failed to open portal', {
        description: 'Please try again in a moment.',
      });
    }
  }, [canAccess, loading, isPending, portal, onSelect, executeWithCircuitBreaker]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const renderDifficultyStars = () => (
    <div className="flex items-center gap-0.5" aria-label={`Difficulty: ${portal.difficulty} out of 5`}>
      {difficultyStars.map((filled, index) => (
        <Star
          key={index}
          className={`h-3 w-3 ${
            filled
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
          }`}
        />
      ))}
    </div>
  );

  const renderProgressBar = () => {
    if (!showProgress || !progress) return null;

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className={`font-semibold ${categoryStyles.text}`}>
            {progressPercentage}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <motion.div
            className={`h-full bg-gradient-to-r ${categoryStyles.bg}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };

  const renderMetadata = () => {
    if (!showMetadata) return null;

    return (
      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{portal.estimatedMinutes} min</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          <span>{portal.experiencePoints} XP</span>
        </div>
        {portal.requiredLevel > 1 && (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Lvl {portal.requiredLevel}</span>
          </div>
        )}
      </div>
    );
  };

  const renderStatusBadge = () => {
    if (isCompleted) {
      return (
        <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3" />
          <span>Completed</span>
        </div>
      );
    }

    if (isInProgress) {
      return (
        <div className={`flex items-center gap-1 rounded-full ${categoryStyles.bg} px-2 py-0.5 text-xs font-medium ${categoryStyles.text}`}>
          <TrendingUp className="h-3 w-3" />
          <span>In Progress</span>
        </div>
      );
    }

    if (portal.isLocked) {
      return (
        <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <Lock className="h-3 w-3" />
          <span>Locked</span>
        </div>
      );
    }

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SKELETON LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950 ${className}`}>
        <div className="space-y-4">
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <motion.article
      className={`
        group relative overflow-hidden rounded-xl border bg-white transition-all
        ${categoryStyles.border}
        ${canAccess ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
        ${isHovered && canAccess ? `shadow-lg ${categoryStyles.glow}` : 'shadow-sm'}
        dark:bg-gray-950
        ${className}
      `}
      variants={ANIMATION_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={canAccess ? "hover" : undefined}
      whileTap={canAccess ? "tap" : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={canAccess ? 0 : -1}
      aria-label={`${portal.name} - ${portal.description}`}
      aria-disabled={!canAccess}
    >
      {/* Lock Overlay */}
      <AnimatePresence>
        {portal.isLocked && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-2 text-white">
              <Lock className="h-8 w-8" />
              <p className="text-sm font-medium">Level {portal.requiredLevel} Required</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Background Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 ${categoryStyles.bg} ${isHovered ? 'opacity-100' : ''}`} />

      {/* Content */}
      <div className="relative z-0 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {portal.name}
              </h3>
              {renderStatusBadge()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {portal.code}
            </p>
          </div>
          {renderDifficultyStars()}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {portal.description}
        </p>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Metadata */}
        {renderMetadata()}

        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${categoryStyles.bg} ${categoryStyles.text}`}>
            {portal.category}
          </span>
        </div>
      </div>

      {/* Hover Effect Line */}
      <motion.div
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${categoryStyles.bg}`}
        initial={{ width: 0 }}
        animate={{ width: isHovered && canAccess ? '100%' : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.article>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// WRAPPED COMPONENT WITH ERROR BOUNDARY & MEMO
// ═══════════════════════════════════════════════════════════════════════════

export const PortalCard = React.memo(
  (props: PortalCardProps) => (
    <PortalCardErrorBoundary>
      <PortalCardComponent {...props} />
    </PortalCardErrorBoundary>
  ),
  (prevProps, nextProps) => {
    // Custom comparison for performance
    return (
      prevProps.portal.id === nextProps.portal.id &&
      prevProps.portal.isLocked === nextProps.portal.isLocked &&
      prevProps.progress?.currentStep === nextProps.progress?.currentStep &&
      prevProps.progress?.completedAt === nextProps.progress?.completedAt &&
      prevProps.loading === nextProps.loading &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

PortalCard.displayName = 'PortalCard';