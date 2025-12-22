// app/api/i18n/timezone/route.ts - Production-safe (@supabase/ssr)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function isValidTimeZone(tz?: string): boolean {
  if (!tz || typeof tz !== 'string') {return false}
  if (tz.length > 50 || tz.includes('..') || tz.includes('//')) {return false}

  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz })
    Intl.DateTimeFormat('de-DE', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

function logOperation(
  operation: string,
  context: any = {},
  level: 'info' | 'warn' | 'error' = 'info'
) {
  const timestamp = new Date().toISOString()
  const logEntry = { timestamp, operation, level, context, service: 'timezone-api' }

  if (level === 'error') {console.error('[TIMEZONE-API]', logEntry)}
  else if (level === 'warn') {console.warn('[TIMEZONE-API]', logEntry)}
  else {console.log('[TIMEZONE-API]', logEntry)}
}

async function ensureProfileExists(
  supabase: any,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {return { success: true }}

    if (checkError && checkError.code !== 'PGRST116') {
      logOperation('profile-check-failed', { userId, error: checkError.message }, 'warn')
    }

    // Optional RPC fallback
    try {
      await supabase.rpc('ensure_profile')
      logOperation('profile-created-via-rpc', { userId })
      return { success: true }
    } catch (rpcError: unknown) {
      const message = rpcError instanceof Error ? rpcError.message : 'Unknown error'
      logOperation('rpc-ensure-profile-failed', { userId, error: message }, 'warn')
    }

    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      if (insertError.code === '23505') {
        logOperation('profile-already-exists', { userId })
        return { success: true }
      }
      logOperation('profile-creation-failed', { userId, error: insertError.message }, 'error')
      return { success: false, error: insertError.message }
    }

    logOperation('profile-created-directly', { userId })
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logOperation('ensure-profile-exception', { userId, error: message }, 'error')
    return { success: false, error: message }
  }
}

async function updateTimezoneWithFallback(
  supabase: any,
  userId: string,
  timezone: string
): Promise<{ success: boolean; error?: string }> {
  const timestamp = new Date().toISOString()

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ timezone, updated_at: timestamp, i18n_updated_at: timestamp })
      .eq('id', userId)

    if (!error) {
      logOperation('timezone-updated-full', { userId, timezone })
      return { success: true }
    }

    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      logOperation('column-missing-fallback', { userId, error: error.message }, 'warn')

      const { error: fallbackError } = await supabase
        .from('profiles')
        .update({ timezone, updated_at: timestamp })
        .eq('id', userId)

      if (!fallbackError) {
        logOperation('timezone-updated-fallback', { userId, timezone })
        return { success: true }
      }

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
  } catch (exception: unknown) {
    const message = exception instanceof Error ? exception.message : 'Unknown error'
    logOperation('timezone-update-exception', { userId, error: message }, 'error')
    return { success: false, error: message }
  }
}

function createSupabaseForRoute() {
  const cookieStore = cookies()

  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          all.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
}

export async function POST(req: Request) {
  const requestId = Math.random().toString(36).slice(2, 11)

  try {
    logOperation('timezone-request-started', { requestId })

    const body = await req.json().catch(() => ({}))
    const { timezone } = body

    if (!isValidTimeZone(timezone)) {
      logOperation('invalid-timezone', { requestId, timezone }, 'warn')
      return NextResponse.json(
        { ok: false, error: 'invalid_timezone', message: 'The provided timezone is not valid' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseForRoute()

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr) {
      logOperation('auth-error', { requestId, error: authErr.message }, 'error')
      return NextResponse.json(
        { ok: false, error: 'authentication_failed', message: 'Failed to authenticate user' },
        { status: 401 }
      )
    }

    if (!user) {
      logOperation('user-not-authenticated', { requestId }, 'warn')
      return NextResponse.json(
        { ok: false, error: 'not_authenticated', message: 'User not authenticated' },
        { status: 401 }
      )
    }

    const profileResult = await ensureProfileExists(supabase, user.id)
    if (!profileResult.success) {
      logOperation(
        'profile-ensure-failed',
        { requestId, userId: user.id, error: profileResult.error },
        'error'
      )
      return NextResponse.json(
        { ok: false, error: 'profile_creation_failed', message: 'Unable to ensure user profile exists' },
        { status: 500 }
      )
    }

    const updateResult = await updateTimezoneWithFallback(supabase, user.id, timezone)
    if (!updateResult.success) {
      logOperation(
        'timezone-update-failed',
        { requestId, userId: user.id, error: updateResult.error },
        'error'
      )
      return NextResponse.json(
        { ok: false, error: 'update_failed', message: 'Unable to update timezone preference' },
        { status: 500 }
      )
    }

    logOperation('timezone-request-completed', { requestId, userId: user.id, timezone })
    return NextResponse.json({
      ok: true,
      message: 'Timezone updated successfully',
      timezone,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logOperation('timezone-request-exception', { requestId, error: message }, 'error')
    return NextResponse.json(
      { ok: false, error: 'internal_server_error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'method_not_allowed', message: 'GET method is not supported. Use POST to update timezone.' },
    { status: 405 }
  )
}

export async function OPTIONS() {
  return NextResponse.json(
    {
      ok: true,
      service: 'timezone-api',
      version: '2.0.0',
      methods: ['POST'],
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        Allow: 'POST, OPTIONS',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  )
}
