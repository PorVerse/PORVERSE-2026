import { createRouteHandlerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any))
  const { userId, language } = body ?? {}
  const supabase = createRouteHandlerClient({ cookies })
  if (userId && language) {
    await supabase.from('profiles').update({ preferred_language: language }).eq('id', userId)
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
}
