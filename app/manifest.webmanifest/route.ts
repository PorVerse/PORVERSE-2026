// app/manifest.webmanifest/route.ts
import { NextResponse } from 'next/server'
import { manifestData } from '@/lib/pwa/manifest-data'

export const dynamic = 'force-static' // servire statică, fără edge recompute

export async function GET() {
  return new NextResponse(JSON.stringify(manifestData), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
