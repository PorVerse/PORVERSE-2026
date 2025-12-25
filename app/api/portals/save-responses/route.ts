/**
 * Portal Save Responses API Route
 * Example cu error handling, CSRF, și rate limiting integrate
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/errors/handler'
import { AuthenticationError, ValidationError } from '@/lib/errors/types'
import { checkRateLimit } from '@/lib/middleware/rate-limit'
import { validateCsrfForRoute } from '@/lib/middleware/csrf'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (double-check, deja în middleware)
    const rateLimitResponse = await checkRateLimit(request, 'api', true)
    if (rateLimitResponse) return rateLimitResponse

    // 2. CSRF validation (double-check, deja în middleware)
    const csrfValid = await validateCsrfForRoute(request)
    if (!csrfValid) {
      throw new AuthenticationError('Invalid CSRF token')
    }

    // 3. Parse body
    const { userId, portalId, stepId, stepNumber, responses } = await request.json()

    // 4. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      throw new AuthenticationError()
    }

    // 5. Validation
    if (!responses || Object.keys(responses).length === 0) {
      throw new ValidationError('No responses provided')
    }

    // 6. Check existing
    const { data: existing } = await supabase
      .from('step_responses')
      .select('id')
      .eq('user_id', userId)
      .eq('step_id', stepId)
      .single()

    let result

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('step_responses')
        .update({
          responses,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insert
      const { data, error } = await supabase
        .from('step_responses')
        .insert({
          user_id: userId,
          portal_id: portalId,
          step_id: stepId,
          step_number: stepNumber,
          responses,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      data: result,
    })

  } catch (error) {
    return handleError(error)
  }
}