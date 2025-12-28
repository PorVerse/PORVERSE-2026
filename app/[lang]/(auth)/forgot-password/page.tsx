'use client'

import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import Link from 'next/link'

type Lang = 'ro' | 'en'

const COPY = {
  ro: {
    title: 'Resetare Parolă',
    subtitle: 'Introdu adresa de email și îți vom trimite un link securizat pentru resetare.',
    email: 'Email',
    send: 'Trimite link',
    sending: 'Se trimite…',
    back: 'Înapoi la autentificare',
    invalidEmail: 'Te rog introdu un email valid.',
    success: 'Link de resetare trimis! Verifică emailul.',
    error: 'Eroare la trimitere. Încearcă din nou.',
    security: 'Link-ul de resetare expiră în 1 oră.',
  },
  en: {
    title: 'Reset Password',
    subtitle: 'Enter your email address and we'll send you a secure reset link.',
    email: 'Email',
    send: 'Send reset link',
    sending: 'Sending…',
    back: 'Back to sign in',
    invalidEmail: 'Please enter a valid email.',
    success: 'Reset link sent! Check your email.',
    error: 'Error sending reset link. Try again.',
    security: 'Reset link expires in 1 hour.',
  },
} as const

const safeLang = (x: string): Lang => (x === 'ro' ? 'ro' : 'en')

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createBrowserClient(url, key)
}

export default function InterstellarForgotPasswordPage({ params }: { params: { lang: string } }) {
  const lang = safeLang(params.lang)
  const t = COPY[lang]

  const supabase = useMemo(() => supabaseBrowser(), [])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const emailTrim = email.trim()
    if (!emailTrim.includes('@')) return setBanner({ type: 'error', msg: t.invalidEmail })

    setLoading(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, {
        redirectTo: `${origin}/auth/callback?next=/${lang}/reset-password`,
      })

      if (error) return setBanner({ type: 'error', msg: t.error })

      setBanner({ type: 'success', msg: t.success })
      setEmail('')
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
              className={`mb-6 rounded-2xl border px-4 py-3 text-sm flex gap-2 ${
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
          <form onSubmit={onSubmit} className="space-y-4">
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
              <p className="mt-2 text-xs text-white/50">{t.security}</p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white text-black font-medium py-2.5 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t.sending : t.send}
            </button>

            {/* Back link */}
            <div className="pt-4">
              <Link
                href={`/${lang}/login`}
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
