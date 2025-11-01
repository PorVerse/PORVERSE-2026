// lib/i18n/dictionaries/en.ts
import type { Messages } from '@/types/i18n'

export const messages: Messages = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    loading: 'Loading…',
  },
  nav: {
    dashboard: 'Dashboard',
    pricing: 'Pricing',
    account: 'Account',
  },
  pricing: {
    title: 'Choose your plan',
    cta_buy: 'Buy now',
    per_month: 'per month',
    local_taxes_note: 'Local taxes may apply.',
  },
  checkout: {
    starting_checkout: 'Starting checkout…',
    error_generic: 'Something went wrong. Please try again.',
  },
}
