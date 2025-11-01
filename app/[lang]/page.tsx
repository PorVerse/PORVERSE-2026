// app/[lang]/page.tsx
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

const SUPPORTED = ['en', 'ro'] as const
type Lang = (typeof SUPPORTED)[number]

export default function LangIndex({ params }: { params: { lang: string } }) {
  const lang = normalize(params.lang)
  if (!lang) notFound()

  // Aici stabilești pagina ta „home” localizată.
  // Dacă vrei altă destinație, schimbă linia de mai jos.
  redirect(`/${lang}/portal-dashboard`)
}

function normalize(value?: string): Lang | null {
  if (!value) return null
  const base = value.split('-')[0].toLowerCase()
  return (SUPPORTED.includes(base as any) ? (base as Lang) : null)
}
