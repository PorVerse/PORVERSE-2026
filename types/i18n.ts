// types/i18n.ts
export type Lang = 'en' | 'ro'

/**
 * Define aici schema de mesaje. Poți adăuga secțiuni noi când ai nevoie.
 * Cheile sunt tipate strict — build-ul prinde erorile de traducere lipsă.
 */
export type Messages = {
  common: {
    ok: string
    cancel: string
    loading: string
  }
  nav: {
    dashboard: string
    pricing: string
    account: string
  }
  pricing: {
    title: string
    cta_buy: string
    per_month: string
    local_taxes_note: string
  }
  checkout: {
    starting_checkout: string
    error_generic: string
  }
}
