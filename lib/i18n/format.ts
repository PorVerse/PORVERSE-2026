// lib/i18n/format.ts

export type CurrencyCode = 'RON' | 'EUR' | 'USD'

export type CurrencyFormatOptions = {
  locale?: string // ex: 'ro-RO' | 'en-US'
  currency: CurrencyCode
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function langToLocale(lang: 'en' | 'ro'): string {
  return lang === 'ro' ? 'ro-RO' : 'en-US'
}

/** Number formatting (plain) */
export function formatNumber(
  value: number,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/** Date formatting */
export function formatDate(
  date: Date | number | string,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, options).format(d)
}

/**
 * SAFE currency formatting (never throws).
 * Acceptă două semnături:
 *  - formatCurrency(100, { currency: 'EUR', locale: 'ro-RO' })
 *  - formatCurrency(100, 'EUR', 'ro-RO')
 */
export function formatCurrency(
  value: number,
  currencyOrOptions: CurrencyCode | CurrencyFormatOptions,
  maybeLocale?: string
): string {
  // Normalizează argumentele
  const opts: CurrencyFormatOptions =
    typeof currencyOrOptions === 'string'
      ? { currency: currencyOrOptions, locale: maybeLocale }
      : currencyOrOptions

  const locale = opts.locale ?? 'en-US'
  const { currency, minimumFractionDigits, maximumFractionDigits } = opts

  // Dacă nu avem currency, NU aruncăm: formatăm ca număr simplu
  if (!currency) {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(value)
    } catch {
      return String(value)
    }
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value)
  } catch {
    // Fallback: number simplu
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(value)
    } catch {
      return String(value)
    }
  }
}
