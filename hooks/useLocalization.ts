'use client'

/**
 * PorVerse V2 — useLocalization (enterprise, hardened)
 * - /api/i18n/detect (server) + browser timezone override (validată)
 * - Currency fallback sigur (previne Intl errors)
 * - Setează cookie-urile (locale/country/tier) pentru navigare corectă
 * - Telemetrie
 * - Persistă preferințe DOAR dacă există sesiune (evită 401/500)
 * - Idempotent (guard + coalesce în-flight)
 */

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cookiesClient } from '@/lib/cookies/client'
import { getBrowserTimeZone, isValidTimeZone } from '@/lib/i18n/timezone'
import { logger } from '@/lib/telemetry/logger'
import { metrics } from '@/lib/telemetry/metrics'

import type { PricingTier } from '@/lib/i18n/price-map' // 'romania' | 'eu' | 'us'

// --------------------------- types ---------------------------

type IsoCurrency = 'RON' | 'EUR' | 'USD'
type SourceTag = 'profile' | 'cookie' | 'accept-language' | 'ip' | 'fallback' | 'unknown'

export interface LocalizationState {
  language: 'en' | 'ro'
  country?: string
  currency: IsoCurrency
  timezone?: string
  pricingTier: PricingTier
}

export interface DetectionResult extends LocalizationState {
  confidence: number
  source: SourceTag
}

interface ApiDetectResponse {
  ok: boolean
  data: DetectionResult
  meta?: { source?: SourceTag }
}

const SUPPORTED = ['en', 'ro'] as const
export type Supported = (typeof SUPPORTED)[number]

// --------------------------- helpers ---------------------------

function normalizeLang(lang?: string): Supported {
  const base = ((lang ?? 'en').split('-')[0] || 'en').toLowerCase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (SUPPORTED.includes(base as any) ? base : 'en') as Supported
}

function inferCurrencyFromTier(tier: PricingTier): IsoCurrency {
  switch (tier) {
    case 'romania':
      return 'RON'
    case 'us':
      return 'USD'
    case 'eu':
    default:
      return 'EUR'
  }
}

function ensureValidCurrency(currency: string | undefined, tier: PricingTier): IsoCurrency {
  const c = (currency || '').toUpperCase()
  if (c === 'RON' || c === 'EUR' || c === 'USD') {return c}
  return inferCurrencyFromTier(tier)
}

/** înlocuiește segmentul de limbă în path sau îl prefixează dacă lipsește */
function withLocaleInPath(pathname: string, newLang: Supported): string {
  const segments = pathname.split('/').filter(Boolean)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (segments.length > 0 && SUPPORTED.includes(segments[0] as any)) {
    segments[0] = newLang
    return `/${segments.join('/')}`
  }
  return `/${newLang}${pathname.startsWith('/') ? '' : '/'}${pathname}`
}

/** verifică sesiunea Supabase fără a crea instanțe multiple inutil */
async function hasSupabaseSession(): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return !!data?.session
  } catch {
    return false
  }
}

/** persistă setările în profil (best-effort) */
async function persistPreferences(payload: {
  timezone?: string
  language?: 'en' | 'ro'
  currency?: IsoCurrency
  pricingTier?: PricingTier
}) {
  // 1) încearcă API-ul propriu (SSR-safe, verifică RLS)
  if (payload.timezone) {
    try {
      await fetch('/api/i18n/timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ timezone: payload.timezone }),
      })
      logger.info('i18n.timezone.persisted', { via: 'api', timezone: payload.timezone })
    } catch {}
  }

  // 2) fallback direct Supabase (opțional)
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) {return}

    const update: Record<string, any> = {
      i18n_updated_at: new Date().toISOString(),
    }
    if (payload.timezone) {update['timezone'] = payload.timezone}
    if (payload.language) {update['language'] = payload.language}
    if (payload.currency) {update['currency'] = payload.currency}
    if (payload.pricingTier) {update['pricing_tier'] = payload.pricingTier}

    if (Object.keys(update).length > 1) {
      await supabase.from('profiles').update(update).eq('id', userId)
      logger.info('i18n.preferences.persisted', { via: 'supabase', ...payload })
    }
  } catch {}
}

// ------------------------------- hook --------------------------------

export function useLocalization() {
  const router = useRouter()
  const pathname = usePathname()

  const [state, setState] = useState<LocalizationState>({
    language: 'en',
    currency: 'EUR',
    pricingTier: 'eu',
    country: undefined,
    timezone: undefined,
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const initialized = useRef(false)
  const initInFlight = useRef<Promise<void> | null>(null)

  const init = useCallback(async () => {
    if (initialized.current) {return}
    if (initInFlight.current) {return}
    initialized.current = true

    setIsLoading(true)
    initInFlight.current = (async () => {
      try {
        // 1) Detect (server)
        const res = await fetch('/api/i18n/detect', {
          method: 'GET',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        const json = (await res.json()) as ApiDetectResponse
        const data = json?.data

        const language = normalizeLang(data?.language)
        const pricingTier = (data?.pricingTier ?? 'eu')
        const currency = ensureValidCurrency(data?.currency, pricingTier)

        // 2) Timezone din browser dacă e validă
        let timezone = data?.timezone
        const browserTZ = getBrowserTimeZone()
        if (browserTZ && browserTZ !== timezone && isValidTimeZone(browserTZ)) {
          timezone = browserTZ
        }

        const payload: LocalizationState = {
          language,
          country: data?.country,
          currency,
          timezone,
          pricingTier,
        }

        // 3) Cookie-uri client → nav corect
        cookiesClient.setLocale(language)
        cookiesClient.setTier(pricingTier)
        if (payload.country) {cookiesClient.setCountry(payload.country)}

        // 4) Setare stare
        setState(payload)

        // 5) Telemetrie
        try {
          const source = (json?.meta?.source ?? data?.source ?? 'unknown')
          logger.info('i18n.detected', {
            language,
            pricingTier,
            currency,
            timezone,
            source,
            confidence: data?.confidence,
          })
          metrics.inc('i18n.locale.applied', 1)
        } catch {}

        // 6) Persistență DOAR dacă există sesiune și avem cel puțin timezone valid
        const session = await hasSupabaseSession()
        if (session && timezone && isValidTimeZone(timezone)) {
          await persistPreferences({
            timezone,
            language,
            currency,
            pricingTier,
          })
        }
      } catch (e) {
        if (process.env['NODE_ENV'] !== 'production') {
          console.warn('i18n.init failed (degraded gracefully):', e)
        }
      } finally {
        setIsLoading(false)
        initInFlight.current = null
      }
    })()

    await initInFlight.current
  }, [])

  const changeLanguage = useCallback(
    async (newLanguage: 'en' | 'ro') => {
      const nextLang = normalizeLang(newLanguage)

      // 1) Stare + cookie
      setState(prev => ({ ...prev, language: nextLang }))
      cookiesClient.setLocale(nextLang)

      // 2) Navigație localizată (no-scroll)
      if (pathname) {
        const target = withLocaleInPath(pathname, nextLang)
        if (target !== pathname) {router.replace(target, { scroll: false })}
      }

      // 3) Telemetrie
      try {
        logger.info('i18n.locale.changed', { to: nextLang })
        metrics.inc('i18n.locale.changed', 1)
      } catch {}

      // 4) Persistă preferința doar dacă există sesiune
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id
        if (userId) {
          await supabase
            .from('profiles')
            .update({
              language: nextLang,
              i18n_updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
          logger.info('i18n.preference.persisted', { userId, language: nextLang })
        }
      } catch {}
    },
    [pathname, router]
  )

  useEffect(() => {
    void init()
  }, [init])

  const value = useMemo(
    () => ({
      ...state,
      isLoading,
      init,
      changeLanguage,
    }),
    [state, isLoading, init, changeLanguage]
  )

  return value
}
