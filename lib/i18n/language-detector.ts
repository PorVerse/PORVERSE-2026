// lib/i18n/language-detector.ts
// Thin API + solid core logic. Fără dependențe de servicii externe.
// Funcționează în Edge/Node și degradează grațios.

export type SupportedLang = 'en' | 'ro'
export type PricingTier = 'romania' | 'eu' | 'us'
export type IsoCurrency = 'RON' | 'EUR' | 'USD'
export type SourceTag = 'profile' | 'cookie' | 'accept-language' | 'ip' | 'fallback'

export interface DetectionResult {
  language: SupportedLang
  country?: string
  currency: IsoCurrency
  timezone?: string
  pricingTier: PricingTier
  confidence: number
  source: SourceTag
}

/** ——— Helpers ——— */

const SUPPORTED: SupportedLang[] = ['en', 'ro']
const COOKIE_LOCALE = 'i18n_locale'
const COOKIE_COUNTRY = 'i18n_country'
const COOKIE_TIER = 'i18n_tier'

function pickCookie(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return
  const m = cookieHeader.match(new RegExp(`${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : undefined
}

function normalizeLang(lang?: string | null): SupportedLang {
  if (!lang) return 'en'
  const base = lang.split(',')[0]?.trim().toLowerCase().split('-')[0]
  return SUPPORTED.includes(base as SupportedLang) ? (base as SupportedLang) : 'en'
}

function countryToTier(country?: string): PricingTier {
  const cc = (country || '').toUpperCase()
  if (cc === 'RO') return 'romania'
  if (cc === 'US') return 'us'
  // fallback: UE → 'eu'; global → 'eu'
  return 'eu'
}

function tierToCurrency(tier: PricingTier): IsoCurrency {
  switch (tier) {
    case 'romania':
      return 'RON'
    case 'us':
      return 'USD'
    default:
      return 'EUR'
  }
}

/** ——— Public API ——— */

/**
 * detect(req)
 * Ordine: cookie -> Accept-Language -> fallback.
 * IP nu e folosit by default (poți adăuga ușor când ai un provider).
 */
export function detect(req?: Request): DetectionResult {
  const headers = req?.headers
  const cookieHdr = headers?.get('cookie') || ''

  // 1) din cookie
  const cookieLang = pickCookie(cookieHdr, COOKIE_LOCALE)
  const cookieCountry = pickCookie(cookieHdr, COOKIE_COUNTRY)
  const cookieTier = pickCookie(cookieHdr, COOKIE_TIER) as PricingTier | undefined

  if (cookieLang && SUPPORTED.includes(cookieLang as SupportedLang)) {
    const lang = cookieLang as SupportedLang
    const tier = cookieTier || countryToTier(cookieCountry)
    const currency = tierToCurrency(tier)
    return {
      language: lang,
      country: cookieCountry,
      currency,
      timezone: undefined, // timezone se corectează în client (Intl) sau via /api/i18n/timezone
      pricingTier: tier,
      confidence: 0.9,
      source: 'cookie',
    }
  }

  // 2) Accept-Language
  const al = headers?.get('accept-language') || ''
  const accLang = normalizeLang(al)
  if (accLang) {
    // heuristica de țară: dacă e ro → RO, altfel necunoscut
    const country = accLang === 'ro' ? 'RO' : undefined
    const tier = cookieTier || countryToTier(country)
    const currency = tierToCurrency(tier)
    return {
      language: accLang,
      country,
      currency,
      timezone: undefined,
      pricingTier: tier,
      confidence: 0.6,
      source: 'accept-language',
    }
  }

  // 3) fallback
  return {
    language: 'en',
    country: undefined,
    currency: 'EUR',
    timezone: undefined,
    pricingTier: 'eu',
    confidence: 0.3,
    source: 'fallback',
  }
}

/**
 * resolveLocale(pathname, acceptLanguage)
 * Dacă nu există prefix de limbă în URL, alege din Accept-Language.
 */
export function resolveLocale(pathname: string, acceptLanguage?: string): SupportedLang {
  const first = pathname.split('/').filter(Boolean)[0]
  if (first && SUPPORTED.includes(first as SupportedLang)) return first as SupportedLang
  return normalizeLang(acceptLanguage || '')
}

/** Helpers cookie — utile din middleware/API dacă vrei să setezi cookie-ul */
export const COOKIE = {
  LOCALE: COOKIE_LOCALE,
  COUNTRY: COOKIE_COUNTRY,
  TIER: COOKIE_TIER,
}
