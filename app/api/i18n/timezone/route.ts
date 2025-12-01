// app/api/i18n/timezone/route.ts - Enterprise-Level Implementation
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/ssr'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Enterprise-level timezone validation with extensive timezone support
function isValidTimeZone(tz?: string): boolean {
  if (!tz || typeof tz !== 'string') return false
  
  // Additional validation for common edge cases
  if (tz.length > 50 || tz.includes('..') || tz.includes('//')) return false
  
  try {
    // Test with multiple locales to ensure broader compatibility
    Intl.DateTimeFormat('en-US', { timeZone: tz })
    Intl.DateTimeFormat('de-DE', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

// Enterprise logging utility
function logOperation(operation: string, context: any = {}, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    operation,
    level,
    context,
    service: 'timezone-api'
  }
  
  if (level === 'error') {
    console.error('[TIMEZONE-API]', logEntry)
  } else if (level === 'warn') {
    console.warn('[TIMEZONE-API]', logEntry)
  } else {
    console.log('[TIMEZONE-API]', logEntry)
  }
}

// Enterprise-level profile creation with fallback strategies
async function ensureProfileExists(supabase: any, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Strategy 1: Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      return { success: true }
    }

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      logOperation('profile-check-failed', { userId, error: checkError.message }, 'warn')
    }

    // Strategy 2: Try to create profile using RPC (if available)
    try {
      await supabase.rpc('ensure_profile')
      logOperation('profile-created-via-rpc', { userId })
      return { success: true }
    } catch (rpcError: any) {
      logOperation('rpc-ensure-profile-failed', { userId, error: rpcError.message }, 'warn')
    }

    // Strategy 3: Direct profile creation with error handling
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      // Check if it's a duplicate key error (profile already exists)
      if (insertError.code === '23505') {
        logOperation('profile-already-exists', { userId })
        return { success: true }
      }
      
      logOperation('profile-creation-failed', { userId, error: insertError.message }, 'error')
      return { success: false, error: insertError.message }
    }

    logOperation('profile-created-directly', { userId })
    return { success: true }

  } catch (error: any) {
    logOperation('ensure-profile-exception', { userId, error: error.message }, 'error')
    return { success: false, error: error.message }
  }
}

// Enterprise-level column checking and dynamic updates
async function updateTimezoneWithFallback(supabase: any, userId: string, timezone: string): Promise<{ success: boolean; error?: string }> {
  const updateData: Record<string, any> = {}
  const timestamp = new Date().toISOString()

  // Strategy 1: Try full update with all columns
  try {
    updateData.timezone = timezone
    updateData.updated_at = timestamp
    
    // Try to include i18n_updated_at if column exists
    updateData.i18n_updated_at = timestamp

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (!error) {
      logOperation('timezone-updated-full', { userId, timezone })
      return { success: true }
    }

    // Check if error is due to missing column
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      logOperation('column-missing-fallback', { userId, error: error.message }, 'warn')
      
      // Strategy 2: Update with minimal columns
      const { error: fallbackError } = await supabase
        .from('profiles')
        .update({
          timezone,
          updated_at: timestamp
        })
        .eq('id', userId)

      if (!fallbackError) {
        logOperation('timezone-updated-fallback', { userId, timezone })
        return { success: true }
      }

      // Strategy 3: Update only timezone if updated_at doesn't exist
      const { error: minimalError } = await supabase
        .from('profiles')
        .update({ timezone })
        .eq('id', userId)

      if (!minimalError) {
        logOperation('timezone-updated-minimal', { userId, timezone })
        return { success: true }
      }

      return { success: false, error: minimalError.message }
    }

    return { success: false, error: error.message }

  } catch (exception: any) {
    logOperation('timezone-update-exception', { userId, error: exception.message }, 'error')
    return { success: false, error: exception.message }
  }
}

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substr(2, 9)
  
  try {
    logOperation('timezone-request-started', { requestId })

    // Parse and validate request body
    const body = await req.json().catch(() => ({}))
    const { timezone } = body

    if (!isValidTimeZone(timezone)) {
      logOperation('invalid-timezone', { requestId, timezone }, 'warn')
      return NextResponse.json({ 
        ok: false, 
        error: 'invalid_timezone',
        message: 'The provided timezone is not valid'
      }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    
    if (authErr) {
      logOperation('auth-error', { requestId, error: authErr.message }, 'error')
      return NextResponse.json({ 
        ok: false, 
        error: 'authentication_failed',
        message: 'Failed to authenticate user'
      }, { status: 401 })
    }

    if (!user) {
      logOperation('user-not-authenticated', { requestId }, 'warn')
      return NextResponse.json({ 
        ok: false, 
        error: 'not_authenticated',
        message: 'User not authenticated'
      }, { status: 401 })
    }

    // Ensure profile exists with enterprise-level error handling
    const profileResult = await ensureProfileExists(supabase, user.id)
    if (!profileResult.success) {
      logOperation('profile-ensure-failed', { requestId, userId: user.id, error: profileResult.error }, 'error')
      return NextResponse.json({ 
        ok: false, 
        error: 'profile_creation_failed',
        message: 'Unable to ensure user profile exists'
      }, { status: 500 })
    }

    // Update timezone with fallback strategies
    const updateResult = await updateTimezoneWithFallback(supabase, user.id, timezone)
    if (!updateResult.success) {
      logOperation('timezone-update-failed', { requestId, userId: user.id, error: updateResult.error }, 'error')
      return NextResponse.json({ 
        ok: false, 
        error: 'update_failed',
        message: 'Unable to update timezone preference'
      }, { status: 500 })
    }

    logOperation('timezone-request-completed', { requestId, userId: user.id, timezone })
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Timezone updated successfully',
      timezone,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    logOperation('timezone-request-exception', { requestId, error: error.message }, 'error')
    
    return NextResponse.json({ 
      ok: false, 
      error: 'internal_server_error',
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    ok: false, 
    error: 'method_not_allowed',
    message: 'GET method is not supported. Use POST to update timezone.'
  }, { status: 405 })
}

// Health check endpoint
export async function OPTIONS() {
  return NextResponse.json({ 
    ok: true, 
    service: 'timezone-api',
    version: '2.0.0',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  }, { 
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}