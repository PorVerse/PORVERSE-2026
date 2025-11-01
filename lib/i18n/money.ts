// lib/i18n/money.ts
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

/** formatMoney — safe, never throws */
export function formatMoney(
  value: number,
  currencyOrOptions: CurrencyCode | CurrencyFormatOptions,
  maybeLocale?: string
): string {
  const opts: CurrencyFormatOptions =
    typeof currencyOrOptions === 'string'
      ? { currency: currencyOrOptions, locale: maybeLocale }
      : currencyOrOptions

  const { currency, minimumFractionDigits, maximumFractionDigits } = opts
  const locale = opts.locale ?? 'en-US'

  if (!currency) {
    try {
      return new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits }).format(value)
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
    try {
      return new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits }).format(value)
    } catch {
      return String(value)
    }
  }
}
