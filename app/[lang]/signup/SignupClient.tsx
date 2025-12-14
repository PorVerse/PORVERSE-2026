'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import InterstellarAuthShell from '@/components/InterstellarAuthShell'

type Lang = 'ro' | 'en'
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createBrowserClient(url, key)
}

const COPY = {
  ro: {
    title: 'Creează cont',
    subtitle: 'Acces enterprise în Portal. Confirmare email. Sesiuni securizate.',
    name: 'Nume complet',
    email: 'Email',
    password: 'Parolă',
    confirm: 'Confirmă parola',
    create: 'Creează cont',
    creating: 'Se creează…',
    have: 'Ai deja cont?',
    login: 'Autentifică-te',
    weak: 'Parola trebuie să aibă minim 8 caractere.',
    mismatch: 'Parolele nu coincid.',
    invalidEmail: 'Te rog introdu un email valid.',
    checkEmail: 'Cont creat. Verifică emailul pentru confirmare, apoi te poți autentifica.',
    error: 'Înregistrare eșuată. Încearcă din nou.',
  },
  en: {
    title: 'Create account',
    subtitle: 'Enterprise access. Email confirmation. Secure sessions.',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    confirm: 'Confirm password',
    create: 'Create account',
    creating: 'Creating…',
    have: 'Already have an account?',
    login: 'Sign in',
    weak: 'Password must be at least 8 characters.',
    mismatch: 'Passwords do not match.',
    invalidEmail: 'Please enter a valid email.',
    checkEmail: 'Account created. Check your email to confirm, then sign in.',
    error: 'Sign up failed. Please try again.',
  },
} as const

export default function SignupClient({
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
  const next = sanitizeNext(first(searchParams.next), `/${lang}/portal-dashboard`)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)

  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const emailTrim = email.trim()
    if (!emailTrim.includes('@')) return setBanner({ type: 'error', msg: t.invalidEmail })
    if (pw.length < 8) return setBanner({ type: 'error', msg: t.weak })
    if (pw !== pw2) return setBanner({ type: 'error', msg: t.mismatch })

    setLoading(true)
    try {
      const origin = window.location.origin
      const emailRedirectTo = `${origin}/${lang}/auth/callback?next=${encodeURIComponent(next)}`
      const { error } = await supabase.auth.signUp({
        email: emailTrim,
        password: pw,
        options: {
          emailRedirectTo,
          data: { full_name: fullName.trim() || null },
        },
      })
      if (error) return setBanner({ type: 'error', msg: t.error })

      setBanner({ type: 'success', msg: t.checkEmail })
      setTimeout(() => router.push(`/${lang}/login?next=${encodeURIComponent(next)}`), 1200)
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

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-white/70 mb-2">{t.name}</label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-white/25">
            <User className="h-4 w-4 text-white/60" />
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              autoComplete="name"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/35 text-sm"
              placeholder="Vlad Porusniuc"
            />
          </div>
        </div>

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

        <div>
          <label className="block text-xs text-white/70 mb-2">{t.password}</label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-white/25">
            <Lock className="h-4 w-4 text-white/60" />
            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/35 text-sm"
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="text-white/60 hover:text-white transition">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/70 mb-2">{t.confirm}</label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-white/25">
            <Lock className="h-4 w-4 text-white/60" />
            <input
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              type={showPw2 ? 'text' : 'password'}
              autoComplete="new-password"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/35 text-sm"
              placeholder="••••••••"
              required
            />
            <button type="button" onClick={() => setShowPw2((v) => !v)} className="text-white/60 hover:text-white transition">
              {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-white text-black font-medium py-2.5 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? t.creating : t.create}
        </button>

        <div className="pt-2 text-center text-sm text-white/70">
          {t.have}{' '}
          <Link href={`/${lang}/login?next=${encodeURIComponent(next)}`} className="text-white hover:underline">
            {t.login}
          </Link>
        </div>
      </form>
    </InterstellarAuthShell>
  )
}
