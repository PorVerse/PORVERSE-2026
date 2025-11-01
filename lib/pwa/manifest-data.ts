// lib/pwa/manifest-data.ts
import type { MetadataRoute } from 'next'

export const manifestData: MetadataRoute.Manifest = {
  name: 'PorVerse V2 - Spiritual Operating System',
  short_name: 'PorVerse',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#0b1020',
  theme_color: '#8b5cf6',
  description:
    'Portal-based spiritual OS with AI guidance, biometric scanning, and offline-first PWA.',
  icons: [
    { src: '/icons/icon-72x72.png',  sizes: '72x72',   type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-96x96.png',  sizes: '96x96',   type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-128x128.png',sizes: '128x128', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-192x192.png',sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-256x256.png',sizes: '256x256', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-384x384.png',sizes: '384x384', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512x512.png',sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
  ],
}
