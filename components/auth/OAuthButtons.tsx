// components/auth/OAuthButtons.tsx
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'

const supabaseBrowser = () => {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  )
}

type Provider = 'google' | 'apple'

export function OAuthButtons({
  lang,
  redirectTo,
}: {
  lang: 'en' | 'ro'
  redirectTo: string
}) {
  const [loading, setLoading] = useState<Provider | null>(null)
  const supabase = supabaseBrowser()

  const copy = {
    google:
      loading === 'google'
        ? lang === 'ro' ? 'Se conectează…' : 'Connecting…'
        : 'Continue with Google',
    apple:
      loading === 'apple'
        ? lang === 'ro' ? 'Se conectează…' : 'Connecting…'
        : 'Continue with Apple',
    error: lang === 'ro' ? 'Autentificarea OAuth a eșuat.' : 'OAuth sign-in failed.',
  }

  async function signInWith(provider: Provider) {
    try {
      setLoading(provider)
      if (typeof window === 'undefined') {return}

      const origin = window.location.origin || process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000'
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/${lang}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (error) {throw error}
    } catch (e) {
      console.error('[OAuthButtons]', e)
      alert(copy.error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => signInWith('google')}
        disabled={!!loading}
        className="pv-button w-full bg-white text-black hover:brightness-95"
        aria-label="Continue with Google"
      >
        {copy.google}
      </button>

      <button
        type="button"
        onClick={() => signInWith('apple')}
        disabled={!!loading}
        className="pv-button w-full bg-black text-white hover:brightness-110"
        aria-label="Continue with Apple"
      >
        {copy.apple}
      </button>
    </div>
  )
}
