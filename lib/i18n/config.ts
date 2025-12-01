// lib/i18n/config.ts
export const locales = ['en', 'ro', 'es', 'fr', 'de', 'it', 'pt', 'ja'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ro: 'Română',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語'
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  ro: '🇷🇴',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  ja: '🇯🇵'
};