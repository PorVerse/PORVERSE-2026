// lib/cookies/client.ts
// Client-only cookie helpers (safe in 'use client' components)

export const I18N_COOKIE_LOCALE = 'i18n_locale'
export const I18N_COOKIE_COUNTRY = 'i18n_country'
export const I18N_COOKIE_TIER = 'i18n_tier'
const MAX_AGE = 60 * 60 * 24 * 180 // 180 zile

export function getCookieClient(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : undefined
}

export function setCookieClient(name: string, value: string): void {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + MAX_AGE * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Expires=${expires}`
}

export const cookiesClient = {
  getLocale: () => getCookieClient(I18N_COOKIE_LOCALE),
  setLocale: (v: string) => setCookieClient(I18N_COOKIE_LOCALE, v),
  getCountry: () => getCookieClient(I18N_COOKIE_COUNTRY),
  setCountry: (v: string) => setCookieClient(I18N_COOKIE_COUNTRY, v),
  getTier: () => getCookieClient(I18N_COOKIE_TIER),
  setTier: (v: string) => setCookieClient(I18N_COOKIE_TIER, v),
}
