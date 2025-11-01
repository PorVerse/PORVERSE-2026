// lib/i18n/cultures.ts
export type CultureKey = 'en' | 'ro' | 'es' | 'it' | 'pl' | 'nl'

export type CultureNote = {
  greeting: string
  tone: 'formal' | 'neutral' | 'casual'
  dateFormatHint?: string
  numberFormatHint?: string
  examples?: string[]
}

export const CULTURES: Record<CultureKey, CultureNote> = {
  en: {
    greeting: 'Welcome',
    tone: 'neutral',
    dateFormatHint: 'MM/DD/YYYY',
    numberFormatHint: '1,234.56',
    examples: ['Thanks!', 'You’re all set.'],
  },
  ro: {
    greeting: 'Bun venit',
    tone: 'neutral',
    dateFormatHint: 'DD.MM.YYYY',
    numberFormatHint: '1.234,56',
    examples: ['Mulțumim!', 'Totul este gata.'],
  },
  es: {
    greeting: 'Bienvenido',
    tone: 'neutral',
    dateFormatHint: 'DD/MM/YYYY',
    numberFormatHint: '1.234,56',
    examples: ['¡Gracias!', 'Todo listo.'],
  },
  it: {
    greeting: 'Benvenuto',
    tone: 'neutral',
    dateFormatHint: 'DD/MM/YYYY',
    numberFormatHint: '1.234,56',
    examples: ['Grazie!', 'Tutto pronto.'],
  },
  pl: {
    greeting: 'Witamy',
    tone: 'neutral',
    dateFormatHint: 'DD.MM.YYYY',
    numberFormatHint: '1 234,56',
    examples: ['Dziękujemy!', 'Wszystko gotowe.'],
  },
  nl: {
    greeting: 'Welkom',
    tone: 'neutral',
    dateFormatHint: 'DD-MM-YYYY',
    numberFormatHint: '1.234,56',
    examples: ['Bedankt!', 'Alles is klaar.'],
  },
}
