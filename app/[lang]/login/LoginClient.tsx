'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import InterstellarAuthShell from '@/components/InterstellarAuthShell'

type Lang = 'ro' | 'en'

const COPY = {
  ro: {
    title: 'Accesează Portalul',
    subtitle: 'Autentificare enterprise. Sesiuni securizate. Acces instant către Portal Dashboard.',
    email: 'Email',
    password: 'Parolă',
    login: 'Autentificare',
    sending: 'Se procesează…',
    magicLink: 'Trimite magic link',
    magicHint: 'Primești un email cu un link securizat pentru autentificare.',
    or: 'sau',
    create: 'Creează cont',
    back: 'Înapoi',
    forgot: 'Ai uitat parola?',
    successMagic: 'Ți-am trimis un link de autentificare pe email.',
    invalidEmail: 'Te rog introdu un email valid.',
    needPassword: 'Te rog introdu parola.',
    wrong: 'Autentificare eșuată. Verifică datele și încearcă din nou.',
    security: 'Conexiune criptată. Token-urile sunt gestionate securizat.',
  },
  en: {
    title: 'Access the Portal',
    subtitle: 'Enterprise authentication. Secure sessions. Instant access to your Portal Dashboard.',
    email: 'Email',
    password: 'Password',
    login: 'Sign in',
    sending: 'Processing…',
    magicLink: 'Send magic link',
    magicHint: 'You’ll receive a secure sign-in link via email.',
    or: 'or',
    create: 'Create account',
    back: 'Back',
    forgot: 'Forgot password?',
    successMagic: 'We’ve sent you a sign-in link via email.',
    invalidEmail: 'Please enter a valid email.',
    needPassword: 'Please enter your password.',
    wrong: 'Sign-in failed. Check your details and try again.',
    security: 'Encrypted connection. Tokens are handled securely.',
  },
} as const

const safeLang = (x: string): Lang => (x === 'ro' ? 'ro' : 'en')
const first = (v: string | string[] | undefined): string | null =>
  !v ? null : Array.isArray(v) ? v[0] ?? null : v

function sanitizeNext(nextRaw: string | null, fallback: string) {
  if (!nextRaw) return fallback
  if (!nextRaw.startsWith('/')) return fallback
  if (nextRaw.startsWith('//')) return fallback
  if (nextRaw.includes('://')) return fallback
  return nextRaw
}

function supabaseBrowser() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  return createBrowserClient(url, key)
}

export default function LoginClient({
  params,
  searchParams,
}: {
  params: { lang: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const lang = safeLang(params.lang)
  const t = COPY[lang]
  const router = useRouter()

  const supabase = useMemo(() => supabaseBrowser(), [])
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)

  const next = sanitizeNext(first(searchParams['next']), `/${lang}/portal-dashboard`)
  const errorFromQuery = first(searchParams['error'])

  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next)
    })

    if (errorFromQuery) setBanner({ type: 'error', msg: decodeURIComponent(errorFromQuery) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const emailTrim = email.trim()
    if (!emailTrim.includes('@')) return setBanner({ type: 'error', msg: t.invalidEmail })
    if (!password) return setBanner({ type: 'error', msg: t.needPassword })

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: emailTrim, password })
      if (error) return setBanner({ type: 'error', msg: t.wrong })
      router.replace(next)
    } finally {
      setLoading(false)
    }
  }

  const onMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const emailTrim = email.trim()
    if (!emailTrim.includes('@')) return setBanner({ type: 'error', msg: t.invalidEmail })

    setLoading(true)
    try {
      const origin = window.location.origin
      const emailRedirectTo = `${origin}/${lang}/auth/callback?next=${encodeURIComponent(next)}`
      const { error } = await supabase.auth.signInWithOtp({
        email: emailTrim,
        options: { emailRedirectTo },
      })
      if (error) return setBanner({ type: 'error', msg: t.wrong })
      setBanner({ type: 'success', msg: t.successMagic })
    } finally {
      setLoading(false)
    }
  }

  return (
    <InterstellarAuthShell title={t.title} subtitle={t.subtitle}>
      {banner && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm flex gap-2 ${
            banner.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-100'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
          }`}
        >
          {banner.type === 'error' ? <AlertCircle className="h-5 w-5 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 mt-0.5" />}
          <div className="leading-relaxed">{banner.msg}</div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`rounded-full px-3 py-1 text-xs border transition ${
            mode === 'password' ? 'border-white/25 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMode('magic')}
          className={`rounded-full px-3 py-1 text-xs border transition ${
            mode === 'magic' ? 'border-white/25 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
          }`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={mode === 'password' ? onPasswordLogin : onMagicLink} className="space-y-4">
        <div>
          <label className="block text-xs text-white/70 mb-2">{t.email}</label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-white/25">
            <Mail className="h-4 w-4 text-white/60" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/35 text-sm"
              placeholder="name@email.com"
              required
            />
          </div>
        </div>

        {mode === 'password' && (
          <div>
            <label className="block text-xs text-white/70 mb-2">{t.password}</label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-white/25">
              <Lock className="h-4 w-4 text-white/60" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full bg-transparent outline-none text-white placeholder:text-white/35 text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-white/60 hover:text-white transition"
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-white/50">{t.security}</span>
              <Link href={`/${lang}/forgot-password`} className="text-xs text-white/70 hover:text-white transition">
                {t.forgot}
              </Link>
            </div>
          </div>
        )}

        {mode === 'magic' && <p className="text-xs text-white/60 leading-relaxed">{t.magicHint}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-white text-black font-medium py-2.5 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? t.sending : mode === 'password' ? t.login : t.magicLink}
        </button>

        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/50">{t.or}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Link
          href={`/${lang}/signup?next=${encodeURIComponent(next)}`}
          className="w-full rounded-2xl border border-white/15 bg-white/5 text-white py-2.5 font-medium text-center block hover:bg-white/10 transition"
        >
          {t.create}
        </Link>

        <div className="pt-2">
          <Link href={`/${lang}`} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
        </div>
      </form>
    </InterstellarAuthShell>
  )
}
