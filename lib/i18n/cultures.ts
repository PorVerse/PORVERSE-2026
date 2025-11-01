// lib/i18n/cultures.ts
/**
 * Note culturale minimaliste pentru mesaje/ton.
 * Poți extinde fără să rupi API-ul.
 */
export type CultureNote = {
  tone: 'friendly' | 'formal' | 'neutral'
  greeting: string
  thankYou: string
  supportSignature: string
  dateExample: string
  currencyExample: string
}

export const CULTURES: Record<'en' | 'ro', CultureNote> = {
  en: {
    tone: 'friendly',
    greeting: 'Hi!',
    thankYou: 'Thank you for being with PorVerse.',
    supportSignature: 'PorVerse Support Team',
    dateExample: 'e.g., October 26, 2025',
    currencyExample: 'e.g., €19.00',
  },
  ro: {
    tone: 'friendly',
    greeting: 'Salut!',
    thankYou: 'Îți mulțumim că ești alături de PorVerse.',
    supportSignature: 'Echipa de Suport PorVerse',
    dateExample: 'ex.: 26 octombrie 2025',
    currencyExample: 'ex.: 19,00 €',
  },
}

export function getCulture(lang: 'en' | 'ro'): CultureNote {
  return CULTURES[lang] ?? CULTURES.en
}
