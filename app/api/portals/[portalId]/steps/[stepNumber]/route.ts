/**
 * POST /api/portals/[portalId]/steps/[stepNumber]/submit
 * Trimite răspunsul pentru un step și actualizează progresul
 * MEGA INTERSTELLAR Portal System API
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { portalId: string; stepNumber: string } }
) {
  try {
    const supabase = await createClient()
    const { portalId, stepNumber } = params
    const body = await request.json()
    const { responseData, timeSpent = 0 } = body

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get portal and step
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('*, steps:portal_steps(*)')
      .eq('id', portalId)
      .single()

    if (portalError || !portal) {
      return NextResponse.json({ error: 'Portal not found' }, { status: 404 })
    }

    const step = portal.steps?.find((s: any) => s.step_number === parseInt(stepNumber))
    if (!step) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Get user progress
    const { data: progress, error: progressError } = await supabase
      .from('user_portal_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('portal_id', portalId)
      .single()

    if (progressError || !progress) {
      return NextResponse.json(
        { error: 'Portal not started. Please start the portal first.' },
        { status: 400 }
      )
    }

    // Validate step order (can't skip steps)
    if (parseInt(stepNumber) > progress.current_step) {
      return NextResponse.json(
        { error: 'Cannot skip steps. Complete previous steps first.' },
        { status: 400 }
      )
    }

    // Calculate XP earned (full XP if first time completing)
    const isFirstTime = !progress.completed_steps.includes(step.id)
    const xpEarned = isFirstTime ? step.experience_points : 0

    // Save or update user response
    const { data: response, error: responseError } = await supabase
      .from('user_step_responses')
      .upsert(
        {
          user_id: user.id,
          portal_id: portalId,
          step_id: step.id,
          response_data: responseData,
          xp_earned: xpEarned,
          time_spent: timeSpent,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,step_id' }
      )
      .select()
      .single()

    if (responseError) {
      console.error('Error saving response:', responseError)
      return NextResponse.json(
        { error: 'Failed to save response', details: responseError.message },
        { status: 500 }
      )
    }

    // Update progress
    const newCompletedSteps = isFirstTime
      ? [...progress.completed_steps, step.id]
      : progress.completed_steps

    const newTotalXP = progress.total_xp_earned + xpEarned
    const nextStepNumber = parseInt(stepNumber) + 1
    const totalSteps = portal.steps?.length || 0
    const isPortalCompleted = newCompletedSteps.length >= totalSteps

    const { data: updatedProgress, error: updateError } = await supabase
      .from('user_portal_progress')
      .update({
        completed_steps: newCompletedSteps,
        total_xp_earned: newTotalXP,
        current_step: isPortalCompleted ? progress.current_step : Math.max(progress.current_step, nextStepNumber),
        completed_at: isPortalCompleted ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', progress.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating progress:', updateError)
      return NextResponse.json(
        { error: 'Failed to update progress', details: updateError.message },
        { status: 500 }
      )
    }

    // Get user profile to return updated stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, level, completed_portals')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: isFirstTime ? `✨ +${xpEarned} XP earned!` : '💫 Response updated!',
      data: {
        response,
        progress: updatedProgress,
        xpEarned,
        isPortalCompleted,
        nextStep: isPortalCompleted ? null : nextStepNumber,
        userStats: {
          totalXP: profile?.total_xp || 0,
          level: profile?.level || 1,
          completedPortals: profile?.completed_portals || 0,
        },
      },
    })
  } catch (error: any) {
    console.error('Error submitting step response:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/portals/[portalId]/steps/[stepNumber]
 * Obține detalii despre un step specific
 */
export async function GET(
  request: Request,
  { params }: { params: { portalId: string; stepNumber: string } }
) {
  try {
    const supabase = await createClient()
    const { portalId, stepNumber } = params

    // Get step
    const { data: steps, error: stepError } = await supabase
      .from('portal_steps')
      .select('*')
      .eq('portal_id', portalId)
      .eq('step_number', parseInt(stepNumber))
      .single()

    if (stepError || !steps) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }

    // Get user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userResponse = null
    if (user) {
      const { data: response } = await supabase
        .from('user_step_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('step_id', steps.id)
        .single()

      userResponse = response
    }

    return NextResponse.json({
      data: {
        ...steps,
        userResponse: userResponse?.response_data || null,
        isCompleted: !!userResponse,
      },
    })
  } catch (error: any) {
    console.error('Error fetching step:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
