// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/providers/providers'

const SITE_URL =
  process.env['NEXT_PUBLIC_SITE_URL']?.replace(/\/+$/, '') || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'PorVerse V2 - Spiritual Operating System',
  description:
    "The world's first portal-based spiritual operating system combining AI guidance, biometric scanning, and quantum consciousness exploration.",
  keywords: [
    'spiritual',
    'personal development',
    'AI',
    'biometric',
    'transformation',
    'consciousness',
  ],
  authors: [{ name: 'PorVerse Team' }],
  creator: 'PorVerse',
  publisher: 'PorVerse',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    title: 'PorVerse V2 - Spiritual Operating System',
    description: "The world's first portal-based spiritual operating system",
    siteName: 'PorVerse',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PorVerse V2',
    description: "The world's first portal-based spiritual operating system",
    creator: '@porverse',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: `${SITE_URL}/en`,
      ro: `${SITE_URL}/ro`,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>  {/* ✅ ADĂUGAT suppressHydrationWarning */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}