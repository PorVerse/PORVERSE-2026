// app/[lang]/layout.tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Inter } from 'next/font/google'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

const SUPPORTED = ['en', 'ro'] as const
type Lang = (typeof SUPPORTED)[number]

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'http://localhost:3000'

function normalize(value?: string): Lang | null {
  if (!value) return null
  const base = value.split('-')[0].toLowerCase()
  return SUPPORTED.includes(base as any) ? (base as Lang) : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const lang = normalize(resolvedParams.lang)
  if (!lang) notFound()

  return {
    metadataBase: new URL(SITE_URL),
    alternates: {
      languages: {
        en: `${SITE_URL}/en`,
        ro: `${SITE_URL}/ro`,
      },
    },
  }
}

export function generateStaticParams() {
  return SUPPORTED.map((lang) => ({ lang }))
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: 'en' | 'ro' }>
}) {
  const resolvedParams = await params
  const lang = normalize(resolvedParams.lang)
  if (!lang) notFound()

  return (
    <div
      suppressHydrationWarning
      className={`${inter.className} min-h-screen bg-neutral-950 text-white antialiased`}
      data-lang={lang}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 rounded-md bg-white/10 px-3 py-2 text-sm"
      >
        {lang === 'ro' ? 'Sari la conținut' : 'Skip to content'}
      </a>

      <header
        className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/50"
        role="banner"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <a
            href={`/${lang}/portal-dashboard`}
            className="text-sm font-semibold tracking-wide opacity-90 hover:opacity-100"
            aria-label="PorVerse"
          >
            PorVerse
          </a>
          <nav aria-label={lang === 'ro' ? 'Navigație globală' : 'Global navigation'}>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main id="main-content" role="main">
        {children}
      </main>

      <footer className="border-t border-white/10" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-white/60">
          © {new Date().getFullYear()} PorVerse. {lang === 'ro' ? 'Toate drepturile rezervate.' : 'All rights reserved.'}
        </div>
      </footer>
    </div>
  )
}