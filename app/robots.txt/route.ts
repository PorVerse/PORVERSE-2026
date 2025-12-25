// app/robots.txt/route.ts
import type { NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function GET(_req: NextRequest) {
  const site =
    process.env['NEXT_PUBLIC_SITE_URL']?.replace(/\/+$/, '') ||
    'http://localhost:3000'

  const body = `
User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`.trim()

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
