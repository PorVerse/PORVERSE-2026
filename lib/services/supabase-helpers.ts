/**
 * Supabase Type-Safe Query Helpers
 * Provides narrowed types for Supabase queries to eliminate unsafe-* warnings
 */

import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Type-safe result wrapper for Supabase queries
 */
export interface QueryResult<T> {
  data: T
  error: null
}

export interface QueryError {
  data: null
  error: PostgrestError
}

export type SafeQueryResult<T> = QueryResult<T> | QueryError

/**
 * Type guard to check if query succeeded
 */
export function isQuerySuccess<T>(
  result: { data: T | null; error: PostgrestError | null }
): result is QueryResult<T> {
  return result.error === null && result.data !== null
}

/**
 * Type guard to check if query failed
 */
export function isQueryError<T>(
  result: { data: T | null; error: PostgrestError | null }
): result is QueryError {
  return result.error !== null
}

/**
 * Execute query with type-safe error handling
 * Throws on error, returns data on success
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const result = await queryFn()
  
  if (isQueryError(result)) {
    throw new Error(`Supabase query failed: ${result.error.message}`)
  }
  
  if (!result.data) {
    throw new Error('Supabase query returned null data')
  }
  
  return result.data
}

/**
 * Execute query with safe fallback (no throw)
 * Returns null on error
 */
export async function executeQuerySafe<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T | null> {
  const result = await queryFn()
  
  if (isQueryError(result)) {
    return null
  }
  
  return result.data
}
