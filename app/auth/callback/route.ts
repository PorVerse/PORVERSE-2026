import { createServerSupabaseClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerSupabaseClient()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to portal dashboard after successful authentication
      return NextResponse.redirect(new URL('/portal-dashboard', request.url))
    }
  }

  // Redirect to home if there's an error or no code
  return NextResponse.redirect(new URL('/', request.url))
}