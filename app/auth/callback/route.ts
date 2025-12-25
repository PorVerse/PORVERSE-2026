import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function sanitizeNext(nextRaw: string | null, fallback: string) {
  if (!nextRaw) {return fallback}
  if (!nextRaw.startsWith('/')) {return fallback}
  if (nextRaw.startsWith('//')) {return fallback}
  if (nextRaw.includes('://')) {return fallback}
  return nextRaw
}

function inferLangFromNext(nextPath: string): 'ro' | 'en' {
  const seg = nextPath.split('/')[1]
  return seg === 'ro' ? 'ro' : 'en'
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') // magiclink | recovery | signup etc.
  const nextRaw = url.searchParams.get('next')

  const next = sanitizeNext(nextRaw, '/en/portal-dashboard')
  const lang = inferLangFromNext(next)

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          all.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  try {
    // PKCE / OAuth / code flow
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {return NextResponse.redirect(new URL(next, url))}
      return NextResponse.redirect(new URL(`/${lang}/login?error=${encodeURIComponent('Auth callback failed.')}`, url))
    }

    // OTP token_hash flow
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })
      if (!error) {return NextResponse.redirect(new URL(next, url))}
      return NextResponse.redirect(new URL(`/${lang}/login?error=${encodeURIComponent('OTP verification failed.')}`, url))
    }

    return NextResponse.redirect(new URL(`/${lang}/login?error=${encodeURIComponent('Missing auth parameters.')}`, url))
  } catch {
    return NextResponse.redirect(new URL(`/${lang}/login?error=${encodeURIComponent('Unexpected auth error.')}`, url))
  }
}
