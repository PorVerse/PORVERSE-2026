/**
 * POST /api/portals/[portalId]/start
 * Începe un portal nou pentru user
 * MEGA INTERSTELLAR Portal System API
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { portalId: string } }
) {
  try {
    const supabase = await createClient()
    const { portalId } = params

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if portal exists
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('*, steps:portal_steps(*)')
      .eq('id', portalId)
      .single()

    if (portalError || !portal) {
      return NextResponse.json(
        { error: 'Portal not found' },
        { status: 404 }
      )
    }

    // Check if portal is locked
    if (portal.is_locked) {
      return NextResponse.json(
        { error: 'Portal is locked', message: 'You need to complete requirements first' },
        { status: 403 }
      )
    }

    // Check if user already started this portal
    const { data: existingProgress } = await supabase
      .from('user_portal_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('portal_id', portalId)
      .single()

    if (existingProgress) {
      return NextResponse.json(
        {
          error: 'Portal already started',
          message: 'You have already started this portal',
          progress: existingProgress,
        },
        { status: 400 }
      )
    }

    // Count total steps
    const totalSteps = portal.steps?.length || 0

    // Create progress entry
    const { data: progress, error: progressError } = await supabase
      .from('user_portal_progress')
      .insert({
        user_id: user.id,
        portal_id: portalId,
        current_step: 1,
        total_steps: totalSteps,
        completed_steps: [],
        total_xp_earned: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (progressError) {
      console.error('Error creating progress:', progressError)
      return NextResponse.json(
        { error: 'Failed to start portal', details: progressError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '🌌 Portal journey started!',
      progress,
      nextStep: 1,
    })
  } catch (error: any) {
    console.error('Error starting portal:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
