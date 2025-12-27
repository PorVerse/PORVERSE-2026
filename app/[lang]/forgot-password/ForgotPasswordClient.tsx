'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import InterstellarAuthShell from '@/components/InterstellarAuthShell'

type Lang = 'ro' | 'en'

const COPY = {
  ro: {
    title: 'Resetare Parolă',
    subtitle: 'Introdu email-ul și îți vom trimite un link de resetare.',
    email: 'Email',
    send: 'Trimite Link',
    sending: 'Se trimite...',
    success: 'Link de resetare trimis! Verifică email-ul.',
    error: 'Eroare. Verifică email-ul și încearcă din nou.',
    back: 'Înapoi la login',
  },
  en: {
    title: 'Reset Password',
    subtitle: 'Enter your email and we\'ll send you a reset link.',
    email: 'Email',
    send: 'Send Reset Link',
    sending: 'Sending...',
    success: 'Reset link sent! Check your email.',
    error: 'Error. Check your email and try again.',
    back: 'Back to login',
  },
}

const safeLang = (x: string): Lang => (x === 'ro' ? 'ro' : 'en')

export default function ForgotPasswordClient({ params }: { params: { lang: string } }) {
  const lang = safeLang(params.lang)
  const t = COPY[lang]
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)

    if (!email.includes('@')) {
      return setBanner({ type: 'error', msg: t.error })
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${lang}/reset-password`,
      })

      if (error) {
        setBanner({ type: 'error', msg: t.error })
      } else {
        setBanner({ type: 'success', msg: t.success })
        setEmail('')
      }
    } catch {
      setBanner({ type: 'error', msg: t.error })
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
          {banner.type === 'error' ? (
            <AlertCircle className="h-5 w-5 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mt-0.5" />
          )}
          <div className="leading-relaxed">{banner.msg}</div>
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-white text-black font-medium py-2.5 transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? t.sending : t.send}
        </button>

        <div className="pt-2">
          <Link
            href={`/${lang}/login`}
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Link>
        </div>
      </form>
    </InterstellarAuthShell>
  )
}