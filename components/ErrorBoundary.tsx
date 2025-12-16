/**
 * Error Boundary Component
 * SUPER ENTERPRISE INTERSTELLAR Level
 * 
 * Features:
 * - Type-safe with TypeScript
 * - Sentry integration for error tracking
 * - Custom fallback UI
 * - Error recovery mechanism
 * - Development vs Production modes
 */

'use client'

import React from 'react'

/**
 * Sentry integration (conditional import to avoid build errors if not installed)
 */
let Sentry: any = null
try {
  Sentry = require('@sentry/nextjs')
} catch {
  // Sentry not installed, that's okay
  console.warn('Sentry not installed. Error tracking disabled.')
}

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
}

/**
 * Props for error fallback component
 */
export interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo | null
  reset: () => void
}

/**
 * State for ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * ErrorBoundary Class Component
 * React Error Boundaries must be class components
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  /**
   * Handle caught error
   * Log to console, Sentry, and custom handler
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo })

    // Log to Sentry (production)
    if (Sentry && process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    }

    // Log to console (development)
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Custom error handler
    this.props.onError?.(error, errorInfo)
  }

  /**
   * Reset error boundary state
   * Allows user to retry
   */
  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  /**
   * Reset on props change (if resetKeys provided)
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (!this.state.hasError) return

    // Check if reset keys changed
    const { resetKeys } = this.props
    if (resetKeys && prevProps.resetKeys) {
      const hasChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      )
      if (hasChanged) {
        this.reset()
      }
    }
  }

  render(): React.ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback: FallbackComponent } = this.props

    // No error, render children normally
    if (!hasError || !error) {
      return children
    }

    // Custom fallback component provided
    if (FallbackComponent) {
      return <FallbackComponent error={error} errorInfo={errorInfo} reset={this.reset} />
    }

    // Default fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8">
          {/* Error Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="mt-6 text-xl font-semibold text-gray-900 text-center">
            Oops! Something went wrong
          </h1>

          {/* Error Message */}
          <p className="mt-3 text-sm text-gray-600 text-center">
            {error.message || 'An unexpected error occurred'}
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                Technical Details (Dev Only)
              </summary>
              <div className="mt-3 p-4 bg-gray-100 rounded-lg">
                <div className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-auto max-h-64">
                  <div className="font-semibold mb-2">Error Stack:</div>
                  {error.stack}
                  
                  {errorInfo && (
                    <>
                      <div className="font-semibold mt-4 mb-2">Component Stack:</div>
                      {errorInfo.componentStack}
                    </>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={this.reset}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="button"
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 text-gray-700 rounded-lg px-4 py-3 font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              type="button"
            >
              Go to Homepage
            </button>
          </div>

          {/* Support Link */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            If this problem persists, please{' '}
            <a
              href="mailto:support@porverse.com"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    )
  }
}

/**
 * Functional wrapper for easier use
 * Use this in your app layout
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Hook for throwing errors from functional components
 * Useful for testing error boundaries
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error>()

  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error
      })
    },
    []
  )
}