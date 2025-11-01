// lib/i18n/translate.ts
import type { Messages } from '@/types/i18n'

type Dict = Messages
type Path = string

/**
 * Extrage valoarea din dicționar pe bază de cheie "dot-path" (ex: "pricing.cta_buy").
 */
function getByPath(obj: any, path: Path): unknown {
  return path.split('.').reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), obj)
}

/**
 * Interpolare simplă: "Hello, {name}!" + { name: "Bogdan" } => "Hello, Bogdan!"
 */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`))
}

export function t(dict: Dict, key: Path, params?: Record<string, string | number>): string {
  const raw = getByPath(dict, key)
  if (typeof raw === 'string') return interpolate(raw, params)
  // Fail-safe: întoarce cheia ca text, util la QA pentru găsirea lipsurilor
  return key
}
