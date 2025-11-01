// app/page.tsx
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SUPPORTED = ['en', 'ro'] as const
type Lang = (typeof SUPPORTED)[number]

function normalize(value?: string): Lang | null {
  if (!value) return null
  const base = value.split('-')[0]?.toLowerCase()
  return (SUPPORTED.includes(base as any) ? (base as Lang) : null)
}

function pickLang(): Lang {
  // 1) Cookie preferență
  const v = cookies().get('i18n_locale')?.value
  const fromCookie = normalize(v)
  if (fromCookie) return fromCookie

  // 2) Accept-Language
  const al = headers().get('accept-language') ?? ''
  const tag = al.split(',')[0]?.trim()
  const fromAL = normalize(tag)
  if (fromAL) return fromAL

  // 3) Fallback
  return 'en'
}

export default function Home() {
  const lang = pickLang()
  // Redirecționăm către indexul localizat; de acolo vei ajunge pe pagina ta principală.
  redirect(`/${lang}`)
}
