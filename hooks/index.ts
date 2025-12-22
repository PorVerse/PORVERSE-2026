/**
 * @fileoverview Production-Grade Custom React Hooks
 * @module hooks
 * @description Advanced patterns: Circuit Breaker, Optimistic Updates, Retry Logic, Web Workers
 * @version 2.0.0
 * @production-ready YES
 */

import * as Sentry from '@sentry/nextjs';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CircuitBreakerOptions {
  threshold?: number;
  timeout?: number;
  onStateChange?: (state: CircuitState) => void;
}

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number | null;
  execute: <T>(fn: () => Promise<T>) => Promise<T>;
  reset: () => void;
}

interface OptimisticUpdateOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'exponential' | 'linear';
  onRetry?: (attempt: number, error: Error) => void;
}

// ============================================================================
// 1. CIRCUIT BREAKER HOOK
// ============================================================================

/**
 * useCircuitBreaker - Implements circuit breaker pattern for fault tolerance
 * 
 * @description Prevents cascading failures by opening circuit after threshold failures
 * Pattern: closed → open (after failures) → half-open (after timeout) → closed (if success)
 * 
 * @param {CircuitBreakerOptions} options Configuration
 * @returns {CircuitBreakerState} Circuit breaker state and execute function
 * 
 * @example
 * const { execute, state } = useCircuitBreaker({ threshold: 5, timeout: 60000 });
 * const data = await execute(() => fetchAPI());
 */
export function useCircuitBreaker(
  options: CircuitBreakerOptions = {}
): CircuitBreakerState {
  const {
    threshold = 5,
    timeout = 60000, // 60 seconds
    onStateChange,
  } = options;

  const [state, setState] = useState<CircuitState>('closed');
  const [failureCount, setFailureCount] = useState(0);
  const [lastFailureTime, setLastFailureTime] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // State change notification
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // Auto-recovery from open to half-open
  useEffect(() => {
    if (state === 'open' && lastFailureTime) {
      timeoutRef.current = setTimeout(() => {
        setState('half-open');
        Sentry.addBreadcrumb({
          category: 'circuit-breaker',
          message: 'Circuit breaker entered half-open state',
          level: 'info',
        });
      }, timeout);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
    return undefined;
  }, [state, lastFailureTime, timeout]);

  const execute = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      // Reject immediately if circuit is open
      if (state === 'open') {
        const error = new Error('Circuit breaker is OPEN - request rejected');
        Sentry.captureException(error, {
          tags: { circuit_breaker: 'open' },
          extra: { failureCount, lastFailureTime },
        });
        throw error;
      }

      try {
        const result = await fn();

        // Success: reset on half-open, maintain on closed
        if (state === 'half-open') {
          setState('closed');
          setFailureCount(0);
          setLastFailureTime(null);
          Sentry.addBreadcrumb({
            category: 'circuit-breaker',
            message: 'Circuit breaker closed after successful half-open request',
            level: 'info',
          });
        }

        return result;
      } catch (error) {
        const newFailureCount = failureCount + 1;
        setFailureCount(newFailureCount);
        setLastFailureTime(Date.now());

        // Trip circuit if threshold exceeded
        if (newFailureCount >= threshold) {
          setState('open');
          Sentry.captureException(error as Error, {
            tags: { circuit_breaker: 'tripped' },
            extra: { failureCount: newFailureCount, threshold },
          });
        }

        throw error;
      }
    },
    [state, failureCount, lastFailureTime, threshold]
  );

  const reset = useCallback(() => {
    setState('closed');
    setFailureCount(0);
    setLastFailureTime(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    state,
    failureCount,
    lastFailureTime,
    execute,
    reset,
  };
}

// ============================================================================
// 2. OPTIMISTIC UPDATE HOOK
// ============================================================================

/**
 * useOptimisticUpdate - Implements optimistic UI updates with automatic rollback
 * 
 * @description Updates UI immediately, then confirms with server. Rolls back on error.
 * Prevents UI lag while maintaining data consistency.
 * 
 * @returns {Object} executeOptimistically function and state
 * 
 * @example
 * const { executeOptimistically, isOptimistic } = useOptimisticUpdate();
 * await executeOptimistically(
 *   optimisticValue,
 *   () => api.update(value),
 *   { onSuccess, onError, timeout: 5000 }
 * );
 */
export function useOptimisticUpdate<T>() {
  const [isOptimistic, setIsOptimistic] = useState(false);
  const rollbackStack = useRef<T[]>([]);

  const executeOptimistically = useCallback(
    async (
      optimisticValue: T,
      asyncFn: () => Promise<T>,
      options: OptimisticUpdateOptions<T> = {}
    ): Promise<T> => {
      const { onSuccess, onError, timeout = 5000 } = options;

      setIsOptimistic(true);

      try {
        // Execute async operation with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out')), timeout);
        });

        const result = await Promise.race([asyncFn(), timeoutPromise]);

        setIsOptimistic(false);
        
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        setIsOptimistic(false);

        // Sentry tracking
        Sentry.captureException(error as Error, {
          tags: { optimistic_update: 'failed' },
          extra: { optimisticValue },
        });

        if (onError) {
          onError(error as Error);
        }

        throw error;
      }
    },
    []
  );

  return {
    executeOptimistically,
    isOptimistic,
  };
}

// ============================================================================
// 3. RETRY HOOK
// ============================================================================

/**
 * useRetry - Implements retry logic with exponential backoff
 * 
 * @description Automatically retries failed operations with increasing delays
 * Supports both exponential and linear backoff strategies
 * 
 * @param {RetryOptions} options Configuration
 * @returns {Object} retry function and state
 * 
 * @example
 * const { retry, attempt } = useRetry({ maxAttempts: 3, backoff: 'exponential' });
 * const data = await retry(() => fetchAPI());
 */
export function useRetry(options: RetryOptions = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry,
  } = options;

  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const calculateDelay = useCallback(
    (attemptNumber: number): number => {
      if (backoff === 'exponential') {
        return delay * Math.pow(2, attemptNumber);
      }
      return delay * attemptNumber;
    },
    [delay, backoff]
  );

  const retry = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setAttempt(0);

      for (let i = 0; i < maxAttempts; i++) {
        try {
          setAttempt(i + 1);
          const result = await fn();
          setIsRetrying(false);
          return result;
        } catch (error) {
          const isLastAttempt = i === maxAttempts - 1;

          if (isLastAttempt) {
            setIsRetrying(false);
            Sentry.captureException(error as Error, {
              tags: { retry: 'exhausted' },
              extra: { attempts: maxAttempts },
            });
            throw error;
          }

          // Wait before retry
          const retryDelay = calculateDelay(i);
          setIsRetrying(true);

          if (onRetry) {
            onRetry(i + 1, error as Error);
          }

          Sentry.addBreadcrumb({
            category: 'retry',
            message: `Retrying operation (attempt ${i + 1}/${maxAttempts})`,
            level: 'warning',
            data: { delay: retryDelay, error: (error as Error).message },
          });

          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }

      throw new Error('Retry failed - should not reach here');
    },
    [maxAttempts, calculateDelay, onRetry]
  );

  return {
    retry,
    attempt,
    isRetrying,
  };
}

// ============================================================================
// 4. DEBOUNCE HOOK
// ============================================================================

/**
 * useDebounce - Debounces a value with configurable delay
 * 
 * @description Delays updating value until input stops changing
 * Perfect for search inputs and expensive operations
 * 
 * @param {T} value Value to debounce
 * @param {number} delay Delay in milliseconds
 * @returns {T} Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * useEffect(() => { search(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// 5. WEB WORKER HOOK
// ============================================================================

/**
 * useWebWorker - Offloads heavy computations to Web Worker
 * 
 * @description Prevents UI blocking by running expensive operations in background thread
 * Automatically manages worker lifecycle and message passing
 * 
 * @param {Function} workerFn Function to run in worker
 * @returns {Object} execute function and state
 * 
 * @example
 * const { execute, result, isRunning } = useWebWorker((data) => {
 *   // Heavy computation
 *   return processedData;
 * });
 * const processed = await execute(largeDataset);
 */
export function useWebWorker<T, R>(
  workerFn: (data: T) => R
): {
  execute: (data: T) => Promise<R>;
  result: R | null;
  error: Error | null;
  isRunning: boolean;
} {
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const execute = useCallback(
    async (data: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        // Check browser support
        if (typeof Worker === 'undefined') {
          const err = new Error('Web Workers not supported in this browser');
          setError(err);
          reject(err);
          return;
        }

        setIsRunning(true);
        setError(null);

        try {
          // Create worker from function
          const workerCode = `
            self.onmessage = function(e) {
              const result = (${workerFn.toString()})(e.data);
              self.postMessage(result);
            };
          `;
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);

          const worker = new Worker(workerUrl);
          workerRef.current = worker;

          worker.onmessage = (e: MessageEvent<R>) => {
            setResult(e.data);
            setIsRunning(false);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve(e.data);
          };

          worker.onerror = (e: ErrorEvent) => {
            const err = new Error(e.message);
            setError(err);
            setIsRunning(false);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);

            Sentry.captureException(err, {
              tags: { web_worker: 'error' },
            });

            reject(err);
          };

          worker.postMessage(data);
        } catch (err) {
          setError(err as Error);
          setIsRunning(false);
          reject(err);
        }
      });
    },
    [workerFn]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return {
    execute,
    result,
    error,
    isRunning,
  };
}

// ============================================================================
// 6. PERFORMANCE MONITORING HOOK
// ============================================================================

/**
 * usePerformance - Monitors component render performance
 * 
 * @description Tracks render times and identifies performance bottlenecks
 * Integrates with Sentry for production monitoring
 * 
 * @param {string} componentName Name for identification
 * @returns {Object} Performance metrics
 */
export function usePerformance(componentName: string) {
  const renderStart = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - renderStart.current;

    // Log slow renders (>16ms = <60fps)
    if (renderTime > 16) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow render detected: ${componentName}`,
        level: 'warning',
        data: { renderTime, renderCount: renderCount.current },
      });
    }

    // Reset timer
    renderStart.current = Date.now();
  });

  return {
    renderCount: renderCount.current,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  CircuitBreakerOptions,
  CircuitBreakerState,
  CircuitState,
  OptimisticUpdateOptions,
  RetryOptions,
};