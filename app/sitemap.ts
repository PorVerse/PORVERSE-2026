// app/sitemap.ts
import type { MetadataRoute } from 'next'

/**
 * Enterprise sitemap cu i18n alternates pentru EN/RO.
 * Extensibil (poți adăuga rute noi în ARRAY-urile de mai jos).
 */

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'http://localhost:3000'

const STATIC_EN = [
  '/en',
  '/en/portal-dashboard',
  '/en/pricing',
  '/en/login',
] as const

const STATIC_RO = [
  '/ro',
  '/ro/portal-dashboard',
  '/ro/pricing',
  '/ro/login',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = []

  // Adaugă oricare din rutele EN și pune alternates către RO
  for (const path of STATIC_EN) {
    const roAlt = path.replace(/^\/en/, '/ro')
    items.push({
      url: `${SITE}${path}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: path === '/en' ? 1 : 0.7,
      alternates: {
        languages: {
          en: `${SITE}${path}`,
          ro: `${SITE}${roAlt}`,
        },
      },
    })
  }

  // Asigură-te că punem și versiunile RO (dacă vrei să fie listate explicit)
  for (const path of STATIC_RO) {
    const enAlt = path.replace(/^\/ro/, '/en')
    items.push({
      url: `${SITE}${path}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: path === '/ro' ? 1 : 0.7,
      alternates: {
        languages: {
          ro: `${SITE}${path}`,
          en: `${SITE}${enAlt}`,
        },
      },
    })
  }

  return items
}
