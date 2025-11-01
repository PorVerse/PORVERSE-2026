// app/api/portals/get-responses/route.ts
// API pentru obținerea răspunsurilor salvate

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stepId = searchParams.get('stepId')
    const userId = searchParams.get('userId')

    if (!stepId || !userId) {
      return NextResponse.json(
        { error: 'Missing stepId or userId' },
        { status: 400 }
      )
    }

    // Verifică autentificarea
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obține răspunsurile salvate
    const { data, error } = await supabase
      .from('step_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('step_id', stepId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (normal pentru first time)
      throw error
    }

    return NextResponse.json({
      success: true,
      responses: data?.responses || null,
      data: data || null,
    })
  } catch (error: any) {
    console.error('Get Responses Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get responses' },
      { status: 500 }
    )
  }
}