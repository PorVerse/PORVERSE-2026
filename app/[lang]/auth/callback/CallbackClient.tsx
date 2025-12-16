'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'

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

export default function CallbackClient({
  params,
  searchParams,
}: {
  params: { lang: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const lang = safeLang(params.lang)
  const [stuck, setStuck] = useState(false)

  const looksInvalid = !first(searchParams['code']) && !first(searchParams['token_hash'])

  const forwardUrl = useMemo(() => {
    const qs = new URLSearchParams()
    const code = first(searchParams['code'])
    const token_hash = first(searchParams['token_hash'])
    const type = first(searchParams['type'])
    const nextSafe = sanitizeNext(first(searchParams['next']), `/${lang}/portal-dashboard`)

    if (code) qs.set('code', code)
    if (token_hash) qs.set('token_hash', token_hash)
    if (type) qs.set('type', type)
    qs.set('next', nextSafe)

    return `/auth/callback?${qs.toString()}`
  }, [searchParams, lang])

  useEffect(() => {
    if (looksInvalid) return
    const t1 = window.setTimeout(() => window.location.replace(forwardUrl), 120)
    const t2 = window.setTimeout(() => setStuck(true), 4500)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [forwardUrl, looksInvalid])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#070816] to-black" />
      <div className="absolute inset-0 opacity-45">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-purple-600 blur-3xl" />
        <div className="absolute top-1/3 -right-48 h-[620px] w-[620px] rounded-full bg-cyan-600 blur-3xl" />
        <div className="absolute bottom-[-220px] left-1/3 h-[520px] w-[520px] rounded-full bg-indigo-600 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_10px_60px_rgba(0,0,0,0.55)] p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/15">
            <Sparkles className="h-6 w-6 text-white/90" />
          </div>

          {looksInvalid ? (
            <>
              <div className="mb-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                <AlertCircle className="h-5 w-5" />
                <span>Link invalid sau expirat.</span>
              </div>
              <Link
                href={`/${lang}/login`}
                className="inline-flex items-center justify-center rounded-2xl bg-white text-black font-medium px-5 py-2.5 hover:opacity-90 transition"
              >
                Înapoi la login
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-white">Sincronizare cu Portalul</h1>
              <p className="mt-2 text-sm text-white/70">Stabilim sesiunea securizată…</p>

              <div className="mt-6 flex items-center justify-center gap-2 text-white/80">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Quantum handshake…</span>
              </div>

              {stuck && (
                <div className="mt-5">
                  <a
                    href={forwardUrl}
                    className="w-full inline-flex items-center justify-center rounded-2xl bg-white text-black font-medium py-2.5 hover:opacity-90 transition"
                  >
                    Continuă
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
