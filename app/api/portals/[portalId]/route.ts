/**
 * GET /api/portals/[portalId]
 * Returnează detalii complete pentru un portal specific
 * MEGA INTERSTELLAR Portal System API
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { portalId: string } }
) {
  try {
    const supabase = await createClient()
    const { portalId } = params

    // Fetch portal with steps
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('*, steps:portal_steps(*)')
      .eq('id', portalId)
      .single()

    if (portalError || !portal) {
      return NextResponse.json(
        { error: 'Portal not found', details: portalError?.message },
        { status: 404 }
      )
    }

    // Sort steps by step_number
    if (portal.steps) {
      portal.steps.sort((a: any, b: any) => a.step_number - b.step_number)
    }

    // Get user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userProgress = null
    let userResponses: any[] = []

    if (user) {
      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('portal_id', portalId)
        .single()

      userProgress = progressData

      // Fetch user responses for this portal
      const { data: responsesData } = await supabase
        .from('user_step_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('portal_id', portalId)

      userResponses = responsesData || []
    }

    // Enrich steps with completion status
    const enrichedSteps = portal.steps?.map((step: any) => {
      const response = userResponses.find((r) => r.step_id === step.id)
      const isCompleted = userProgress?.completed_steps?.includes(step.id) || false
      const isCurrent = step.step_number === userProgress?.current_step
      
      return {
        ...step,
        isCompleted,
        isCurrent,
        userResponse: response?.response_data || null,
        xpEarned: response?.xp_earned || 0,
      }
    })

    return NextResponse.json({
      data: {
        ...portal,
        steps: enrichedSteps,
        userProgress,
        totalSteps: portal.steps?.length || 0,
        completedSteps: userProgress?.completed_steps?.length || 0,
        progressPercent: userProgress
          ? Math.round((userProgress.completed_steps.length / (portal.steps?.length || 1)) * 100)
          : 0,
      },
    })
  } catch (error: any) {
    console.error('Error fetching portal details:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
