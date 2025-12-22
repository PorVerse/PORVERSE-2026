import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any))
  const { userId, language } = body ?? {}
  const supabase = await createClient()
  if (userId && language) {
    await supabase.from('profiles').update({ preferred_language: language }).eq('id', userId)
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } })
}
