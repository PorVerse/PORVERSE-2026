// lib/i18n/timezone.ts
/**
 * Returnează timezone-ul IANA din browser (ex: "Europe/Bucharest").
 * Dacă nu e disponibil, întoarce undefined.
 */
export function getBrowserTimeZone(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz && isValidTimeZone(tz) ? tz : undefined
  } catch {
    return undefined
  }
}

/**
 * Validează un identificator IANA time zone (ex: "Europe/Bucharest").
 */
export function isValidTimeZone(tz?: string | null): tz is string {
  if (!tz || typeof tz !== 'string') return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}
