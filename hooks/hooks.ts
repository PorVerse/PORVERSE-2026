/**
 * Custom Hooks - INTERSTELLAR LEVEL
 * @module hooks
 * 
 * Advanced hooks for production systems:
 * - useOptimisticUpdate: Optimistic UI updates with rollback
 * - useCircuitBreaker: Fault tolerance pattern
 * - useRetry: Exponential backoff retry logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// ═══════════════════════════════════════════════════════════════════════════
// useOptimisticUpdate Hook
// ═══════════════════════════════════════════════════════════════════════════

interface OptimisticState<T> {
  data: T | null;
  isOptimistic: boolean;
  isPending: boolean;
  error: Error | null;
}

export function useOptimisticUpdate<T>() {
  const [state, setState] = useState<OptimisticState<T>>({
    data: null,
    isOptimistic: false,
    isPending: false,
    error: null,
  });

  const rollbackStack = useRef<T[]>([]);

  const executeOptimistically = useCallback(
    async (
      optimisticValue: T,
      asyncFn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
        timeout?: number;
      }
    ) => {
      // Save current state for rollback
      if (state.data) {
        rollbackStack.current.push(state.data);
      }

      // Apply optimistic update immediately
      setState({
        data: optimisticValue,
        isOptimistic: true,
        isPending: true,
        error: null,
      });

      try {
        // Execute actual async operation
        const result = await Promise.race([
          asyncFn(),
          ...(options?.timeout
            ? [
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Timeout')), options.timeout)
                ),
              ]
            : []),
        ]);

        // Confirm optimistic update with real data
        setState({
          data: result,
          isOptimistic: false,
          isPending: false,
          error: null,
        });

        rollbackStack.current = [];
        options?.onSuccess?.(result);

        return result;
      } catch (error) {
        // Rollback to previous state
        const previousState = rollbackStack.current.pop();
        setState({
          data: previousState || null,
          isOptimistic: false,
          isPending: false,
          error: error as Error,
        });

        Sentry.captureException(error, {
          tags: { hook: 'useOptimisticUpdate' },
        });

        options?.onError?.(error as Error);
        throw error;
      }
    },
    [state.data]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isOptimistic: false,
      isPending: false,
      error: null,
    });
    rollbackStack.current = [];
  }, []);

  return {
    optimisticState: state.data,
    isOptimistic: state.isOptimistic,
    isPending: state.isPending,
    error: state.error,
    executeOptimistically,
    reset,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useCircuitBreaker Hook
// ═══════════════════════════════════════════════════════════════════════════

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
}

export function useCircuitBreaker(options: CircuitBreakerOptions = {}) {
  const {
    failureThreshold = 5,
    resetTimeout = 60000, // 60 seconds
    monitoringPeriod = 10000, // 10 seconds
  } = options;

  const [state, setState] = useState<CircuitState>('closed');
  const [failureCount, setFailureCount] = useState(0);
  const [lastFailureTime, setLastFailureTime] = useState<number | null>(null);
  const resetTimer = useRef<NodeJS.Timeout>();

  // Monitor failures over time window
  useEffect(() => {
    if (failureCount > 0) {
      const monitorTimer = setTimeout(() => {
        // Reset failure count if no new failures in monitoring period
        setFailureCount(0);
      }, monitoringPeriod);

      return () => clearTimeout(monitorTimer);
    }
  }, [failureCount, monitoringPeriod]);

  const attemptReset = useCallback(() => {
    if (
      state === 'open' &&
      lastFailureTime &&
      Date.now() - lastFailureTime >= resetTimeout
    ) {
      setState('half-open');
      setFailureCount(0);
    }
  }, [state, lastFailureTime, resetTimeout]);

  const onSuccess = useCallback(() => {
    setFailureCount(0);
    setState('closed');
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
  }, []);

  const onFailure = useCallback(() => {
    const newFailureCount = failureCount + 1;
    setFailureCount(newFailureCount);
    setLastFailureTime(Date.now());

    if (newFailureCount >= failureThreshold) {
      setState('open');

      // Schedule automatic reset attempt
      resetTimer.current = setTimeout(() => {
        setState('half-open');
        setFailureCount(0);
      }, resetTimeout);

      Sentry.captureMessage('Circuit breaker opened', {
        level: 'warning',
        tags: { circuit_breaker: 'true' },
        extra: { failureCount: newFailureCount, threshold: failureThreshold },
      });
    }
  }, [failureCount, failureThreshold, resetTimeout]);

  const executeWithCircuitBreaker = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      // Check if circuit should be reset
      attemptReset();

      if (state === 'open') {
        const error = new Error('Circuit breaker is OPEN');
        Sentry.captureException(error);
        throw error;
      }

      try {
        const result = await fn();
        onSuccess();
        return result;
      } catch (error) {
        onFailure();
        throw error;
      }
    },
    [state, attemptReset, onSuccess, onFailure]
  );

  return {
    state,
    failureCount,
    executeWithCircuitBreaker,
    reset: () => {
      setState('closed');
      setFailureCount(0);
      setLastFailureTime(null);
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useRetry Hook (with exponential backoff)
// ═══════════════════════════════════════════════════════════════════════════

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

export function useRetry(options: RetryOptions = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = () => true,
  } = options;

  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      let lastError: Error | null = null;

      for (let i = 0; i < maxAttempts; i++) {
        setAttempt(i + 1);

        try {
          const result = await fn();
          setAttempt(0);
          setIsRetrying(false);
          return result;
        } catch (error) {
          lastError = error as Error;

          // Check if error is retryable
          if (!retryableErrors(lastError)) {
            setAttempt(0);
            setIsRetrying(false);
            throw lastError;
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            initialDelay * Math.pow(backoffMultiplier, i),
            maxDelay
          );

          // Add jitter (random 0-25% of delay)
          const jitter = Math.random() * delay * 0.25;
          const finalDelay = delay + jitter;

          if (i < maxAttempts - 1) {
            setIsRetrying(true);
            await new Promise((resolve) => setTimeout(resolve, finalDelay));
          }

          Sentry.captureException(lastError, {
            tags: { retry_attempt: i + 1, max_attempts: maxAttempts },
            extra: { delay: finalDelay },
          });
        }
      }

      // All attempts failed
      setAttempt(0);
      setIsRetrying(false);
      
      const finalError = new Error(
        `Failed after ${maxAttempts} attempts: ${lastError?.message}`
      );
      Sentry.captureException(finalError);
      throw finalError;
    },
    [maxAttempts, initialDelay, maxDelay, backoffMultiplier, retryableErrors]
  );

  return {
    attempt,
    isRetrying,
    executeWithRetry,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// useDebounce Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ═══════════════════════════════════════════════════════════════════════════
// useWebWorker Hook (for heavy computations)
// ═══════════════════════════════════════════════════════════════════════════

export function useWebWorker<T, R>(
  workerFunction: (data: T) => R
): [(data: T) => Promise<R>, boolean] {
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Create worker from function
    const blob = new Blob(
      [
        `
        self.onmessage = function(e) {
          const result = (${workerFunction.toString()})(e.data);
          self.postMessage(result);
        }
      `,
      ],
      { type: 'application/javascript' }
    );

    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, [workerFunction]);

  const execute = useCallback(
    (data: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        setIsProcessing(true);

        workerRef.current.onmessage = (e: MessageEvent<R>) => {
          setIsProcessing(false);
          resolve(e.data);
        };

        workerRef.current.onerror = (error) => {
          setIsProcessing(false);
          Sentry.captureException(error);
          reject(error);
        };

        workerRef.current.postMessage(data);
      });
    },
    []
  );

  return [execute, isProcessing];
}