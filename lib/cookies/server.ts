// lib/cookies/server.ts
// Server-only cookie helpers (Next.js Server Components / Route Handlers / Middleware-adjacent)

import { cookies } from 'next/headers'

export const I18N_COOKIE_LOCALE = 'i18n_locale'
export const I18N_COOKIE_COUNTRY = 'i18n_country'
export const I18N_COOKIE_TIER = 'i18n_tier'
const MAX_AGE = 60 * 60 * 24 * 180 // 180 zile

export function getCookieServer(name: string): string | undefined {
  try {
    return cookies().get(name)?.value
  } catch {
    return undefined
  }
}

export function setCookieServer(name: string, value: string): void {
  cookies().set({
    name,
    value,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    maxAge: MAX_AGE,
  })
}

export const cookiesServer = {
  getLocale: () => getCookieServer(I18N_COOKIE_LOCALE),
  setLocale: (v: string) => setCookieServer(I18N_COOKIE_LOCALE, v),
  getCountry: () => getCookieServer(I18N_COOKIE_COUNTRY),
  setCountry: (v: string) => setCookieServer(I18N_COOKIE_COUNTRY, v),
  getTier: () => getCookieServer(I18N_COOKIE_TIER),
  setTier: (v: string) => setCookieServer(I18N_COOKIE_TIER, v),
}
