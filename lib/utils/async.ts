/**
 * 🔄 PorVerse V2 - Async Utilities
 * Type-safe async handlers for React events and callbacks
 * 
 * @version 2.0.0
 * @author PorVerse Development Team
 */

/**
 * Wraps an async function to be safely used in event handlers
 * Automatically handles errors and prevents floating promises
 * 
 * @param fn - The async function to wrap
 * @param onError - Optional error handler callback
 * @returns A void function that can be used in event handlers
 * 
 * @example
 * ```tsx
 * <button onClick={asyncHandler(saveData, (error) => toast.error('Failed to save'))}>
 *   Save
 * </button>
 * ```
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: unknown) => void
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    void fn(...args).catch((error) => {
      console.error('Async handler error:', error)
      onError?.(error)
    })
  }
}

/**
 * Creates a debounced async handler
 * Useful for search inputs or auto-save functionality
 * 
 * @param fn - The async function to debounce
 * @param delay - Delay in milliseconds
 * @param onError - Optional error handler callback
 * @returns A debounced async function
 * 
 * @example
 * ```tsx
 * const debouncedSearch = debouncedAsyncHandler(searchAPI, 300)
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function debouncedAsyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number,
  onError?: (error: unknown) => void
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      void fn(...args).catch((error) => {
        console.error('Debounced async handler error:', error)
        onError?.(error)
      })
    }, delay)
  }
}

/**
 * Wraps an async function with a loading state tracker
 * 
 * @param fn - The async function to wrap
 * @param setLoading - Function to update loading state
 * @param onError - Optional error handler callback
 * @returns A wrapped function that tracks loading state
 * 
 * @example
 * ```tsx
 * const [loading, setLoading] = useState(false)
 * const handleSave = asyncHandlerWithLoading(saveData, setLoading, handleError)
 * ```
 */
export function asyncHandlerWithLoading<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  setLoading: (loading: boolean) => void,
  onError?: (error: unknown) => void
): (...args: Parameters<T>) => Promise<void> {
  return async (...args: Parameters<T>) => {
    setLoading(true)
    try {
      await fn(...args)
    } catch (error) {
      console.error('Async handler with loading error:', error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }
}

/**
 * Wraps multiple async functions to execute in sequence
 * 
 * @param fns - Array of async functions to execute
 * @param onError - Optional error handler callback
 * @returns A function that executes all functions in sequence
 */
export function asyncSequence<T extends (...args: any[]) => Promise<any>>(
  fns: T[],
  onError?: (error: unknown) => void
): (...args: Parameters<T>) => Promise<void> {
  return async (...args: Parameters<T>) => {
    for (const fn of fns) {
      try {
        await fn(...args)
      } catch (error) {
        console.error('Async sequence error:', error)
        onError?.(error)
        throw error // Re-throw to stop sequence
      }
    }
  }
}

/**
 * Wraps an async function with retry logic
 * 
 * @param fn - The async function to wrap
 * @param maxRetries - Maximum number of retry attempts
 * @param delay - Delay between retries in milliseconds
 * @returns A function that retries on failure
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)))
      }
    }
  }

  throw lastError!
}