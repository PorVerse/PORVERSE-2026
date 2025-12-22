// app/api/portals/complete-step/route.ts
// Complete Step API - Update user progress

import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, portalId, stepNumber } = await request.json()

    // Verifică autentificarea
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current progress
    const { data: progress } = await supabase
      .from('user_portal_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('portal_id', portalId)
      .single()

    if (!progress) {
      return NextResponse.json(
        { error: 'Progress not found' },
        { status: 404 }
      )
    }

    // Verifică că step-ul curent este corect
    if (stepNumber !== progress.current_step) {
      return NextResponse.json(
        { error: 'Invalid step number' },
        { status: 400 }
      )
    }

    // Calculate new values
    const newCurrentStep = stepNumber + 1
    const newCompletionPercentage = Math.round(
      (stepNumber / progress.total_steps) * 100
    )
    const isCompleted = newCurrentStep > progress.total_steps

    // Update progress
    const updateData: any = {
      current_step: isCompleted ? progress.total_steps : newCurrentStep,
      completion_percentage: isCompleted ? 100 : newCompletionPercentage,
      last_activity_at: new Date().toISOString(),
    }

    // Update status
    if (isCompleted) {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
    } else if (progress.status === 'not_started') {
      updateData.status = 'in_progress'
      updateData.started_at = new Date().toISOString()
    }

    const { data: updatedProgress, error } = await supabase
      .from('user_portal_progress')
      .update(updateData)
      .eq('id', progress.id)
      .select()
      .single()

    if (error) {throw error}

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      completed: isCompleted,
    })
  } catch (error: unknown) {
    console.error('Complete Step Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to complete step'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}