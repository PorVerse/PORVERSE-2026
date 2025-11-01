// app/api/ai/get-user-context/route.ts
// Agregă toate răspunsurile utilizatorului pentru context AI

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const portalId = searchParams.get('portalId') // optional - pentru context specific portal

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Verifică autentificarea
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obține profilul utilizatorului
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Obține progresul în portale
    let progressQuery = supabase
      .from('user_portal_progress')
      .select(`
        *,
        portals:portal_id (
          portal_code,
          title,
          description
        )
      `)
      .eq('user_id', userId)

    if (portalId) {
      progressQuery = progressQuery.eq('portal_id', portalId)
    }

    const { data: portalProgress } = await progressQuery

    // Obține TOATE răspunsurile utilizatorului
    let responsesQuery = supabase
      .from('step_responses')
      .select(`
        *,
        portal_steps:step_id (
          step_number,
          title,
          description
        ),
        portals:portal_id (
          portal_code,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (portalId) {
      responsesQuery = responsesQuery.eq('portal_id', portalId)
    }

    const { data: userResponses } = await responsesQuery

    // Construiește context structurat
    const context = {
      user: {
        id: profile?.id,
        name: profile?.full_name,
        email: profile?.email,
        subscription: profile?.subscription_tier,
        language: profile?.preferred_language,
        joined: profile?.created_at,
      },
      
      journey: {
        totalPortals: 6,
        startedPortals: portalProgress?.filter(p => p.status !== 'not_started').length || 0,
        completedPortals: portalProgress?.filter(p => p.status === 'completed').length || 0,
        overallProgress: portalProgress && portalProgress.length > 0
          ? Math.round(
              portalProgress.reduce((acc, p) => acc + p.completion_percentage, 0) / 
              portalProgress.length
            )
          : 0,
      },

      portals: portalProgress?.map(p => ({
        code: p.portals?.portal_code,
        title: p.portals?.title,
        currentStep: p.current_step,
        totalSteps: p.total_steps,
        completion: p.completion_percentage,
        status: p.status,
        startedAt: p.started_at,
        completedAt: p.completed_at,
      })) || [],

      responses: userResponses?.map(r => ({
        portal: r.portals?.title,
        portalCode: r.portals?.portal_code,
        step: r.step_number,
        stepTitle: r.portal_steps?.title,
        answers: r.responses,
        answeredAt: r.created_at,
      })) || [],

      // Summary statistics
      stats: {
        totalResponses: userResponses?.length || 0,
        totalWordsWritten: userResponses?.reduce((acc, r) => {
          const allAnswers = Object.values(r.responses || {}).join(' ')
          return acc + allAnswers.split(/\s+/).length
        }, 0) || 0,
        avgResponseLength: userResponses && userResponses.length > 0
          ? Math.round(
              userResponses.reduce((acc, r) => {
                const allAnswers = Object.values(r.responses || {}).join(' ')
                return acc + allAnswers.length
              }, 0) / userResponses.length
            )
          : 0,
      },
    }

    return NextResponse.json({
      success: true,
      context,
    })
  } catch (error: any) {
    console.error('Get User Context Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get user context' },
      { status: 500 }
    )
  }
}