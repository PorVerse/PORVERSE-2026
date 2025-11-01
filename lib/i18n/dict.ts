// lib/i18n/dict.ts
import type { Lang, Messages } from '@/types/i18n'

// Cache global (funcționează și pe server și în browser)
const GLOBAL_KEY = '__PORVERSE_I18N_CACHE__'
declare global {
  // eslint-disable-next-line no-var
  var __PORVERSE_I18N_CACHE__: Partial<Record<Lang, Messages>> | undefined
}
const g = globalThis as any
g[GLOBAL_KEY] ||= {}

const cache = g[GLOBAL_KEY] as Partial<Record<Lang, Messages>>

/**
 * Încarcă dicționarul pentru limba dată, cu cache în memorie.
 * Folosește import dinamic pentru a nu încărca ambele limbi în același bundle.
 */
export async function getDictionary(lang: Lang): Promise<Messages> {
  if (cache[lang]) return cache[lang] as Messages
  switch (lang) {
    case 'ro': {
      const { messages } = await import('@/lib/i18n/dictionaries/ro')
      cache.ro = messages
      return messages
    }
    case 'en':
    default: {
      const { messages } = await import('@/lib/i18n/dictionaries/en')
      cache.en = messages
      return messages
    }
  }
}

/**
 * Încărcare sincronă (fallback) — doar dacă ai importat deja într-un loc server-side.
 * Evită să o folosești în client fără preîncărcare.
 */
export function getDictionarySync(lang: Lang): Messages | undefined {
  return cache[lang]
}
