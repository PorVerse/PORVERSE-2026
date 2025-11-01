// app/api/portals/save-responses/route.ts
// API pentru salvarea răspunsurilor utilizatorului

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, portalId, stepId, stepNumber, responses } = await request.json()

    // Verifică autentificarea
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verifică că există răspunsuri
    if (!responses || Object.keys(responses).length === 0) {
      return NextResponse.json(
        { error: 'No responses provided' },
        { status: 400 }
      )
    }

    // Verifică dacă există deja răspunsuri pentru acest step
    const { data: existing } = await supabase
      .from('step_responses')
      .select('id')
      .eq('user_id', userId)
      .eq('step_id', stepId)
      .single()

    let result

    if (existing) {
      // Update răspunsurile existente
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
      // Inserează răspunsuri noi
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
  } catch (error: any) {
    console.error('Save Responses Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save responses' },
      { status: 500 }
    )
  }
}