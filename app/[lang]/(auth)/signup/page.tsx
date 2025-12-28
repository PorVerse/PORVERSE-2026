'use client'

import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import Link from 'next/link'

type Lang = 'ro' | 'en'

const COPY = {
  ro: {
    title: 'Creează Cont',
    subtitle: 'Alătură-te platformei PORVERSE. Autentificare securizată. Acces instant la portale.',
    fullName: 'Nume complet',
    email: 'Email',
    password: 'Parolă',
    confirmPassword: 'Confirmă parola',
    create: 'Creează cont',
    creating: 'Se creează contul…',
    or: 'sau',
    login: 'Autentifică-te',
    back: 'Înapoi',
    invalidEmail: 'Te rog introdu un email valid.',
    needName: 'Te rog introdu numele complet.',
    needPassword: 'Parola trebuie să aibă minim 6 caractere.',
    passwordMismatch: 'Parolele nu se potrivesc.',
    success: 'Cont creat cu succes! Verifică emailul pentru confirmare.',
    error: 'Eroare la crearea contului. Încearcă din nou.',
    security: 'Datele sunt criptate end-to-end.',
  },
  en: {
    title: 'Create Account',
    subtitle: 'Join the PORVERSE platform. Secure authentication. Instant portal access.',
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    create: 'Create account',
    creating: 'Creating account…',
    or: 'or',
    login: 'Sign in',
    back: 'Back',
    invalidEmail: 'Please enter a valid email.',
    needName: 'Please enter your full name.',
    needPassword: 'Password must be at least 6 characters.',
    passwordMismatch: 'Passwords do not match.',
    success: 'Account created successfully! Check your email for confirmation.',
    error: 'Error creating account. Please try again.',
    security: 'Data is encrypted end-to-end.',
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createBrowserClient(url, key)
}

export default function InterstellarSignupPage({
  params,
  searchParams,
}: {
  params: { lang: string }
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const lang = safeLang(params.lang)
  const t = COPY[lang]
  const router = useRouter()

  const supabase = useMemo(() => supabaseBrowser(), [])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)

  const next = sanitizeNext(first(searchParams?.next), `/${lang}/portal-dashboard`)

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const nameTrim = fullName.trim()
    const emailTrim = email.trim()

    if (!nameTrim) return setBanner({ type: 'error', msg: t.needName })
    if (!emailTrim.includes('@')) return setBanner({ type: 'error', msg: t.invalidEmail })
    if (password.length < 6) return setBanner({ type: 'error', msg: t.needPassword })
    if (password !== confirmPassword) return setBanner({ type: 'error', msg: t.passwordMismatch })

    setLoading(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signUp({
        email: emailTrim,
        password,
        options: {
          data: {
            full_name: nameTrim,
          },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })

      if (error) return setBanner({ type: 'error', msg: t.error })

      setBanner({ type: 'success', msg: t.success })
      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Glass card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-sm text-white/60">{t.subtitle}</p>
          </div>

          {/* Banner */}
          {banner && (
            <div
              className={`mb-4 rounded-2xl border px-4 py-3 text-sm flex gap-2 ${
                banner.type === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-100'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
              }`}
            >
              {banner.type === 'error' ? (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="leading-relaxed">{banner.msg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs text-white/70 mb-2 font-medium">{t.fullName}</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 focus-within:border-white/25 transition">
                <User className="h-4 w-4 text-white/60" />
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  autoComplete="name"
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/35 text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-white/70 mb-2 font-medium">{t.email}</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 focus-within:border-white/25 transition">
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

            {/* Password */}
            <div>
              <label className="block text-xs text-white/70 mb-2 font-medium">{t.password}</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 focus-within:border-white/25 transition">
                <Lock className="h-4 w-4 text-white/60" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
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
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs text-white/70 mb-2 font-medium">{t.confirmPassword}</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 focus-within:border-white/25 transition">
                <Lock className="h-4 w-4 text-white/60" />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirmPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full bg-transparent outline-none text-white placeholder:text-white/35 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="text-white/60 hover:text-white transition"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/50">{t.security}</p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white text-black font-medium py-2.5 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t.creating : t.create}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/50">{t.or}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Login link */}
            <Link
              href={`/${lang}/login?next=${encodeURIComponent(next)}`}
              className="w-full rounded-2xl border border-white/15 bg-white/5 text-white py-2.5 font-medium text-center block hover:bg-white/10 transition"
            >
              {t.login}
            </Link>

            {/* Back link */}
            <div className="pt-2">
              <Link
                href={`/${lang}`}
                className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
                {t.back}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
