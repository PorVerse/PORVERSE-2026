// middleware.ts - Simplified for development
import { NextResponse, type NextRequest } from 'next/server'

const SUPPORTED = ['en', 'ro'] as const
type Supported = (typeof SUPPORTED)[number]

const IS_DEV = process.env.NODE_ENV !== 'production'
const DISABLE_GUARD_DEV = process.env['NEXT_DISABLE_AUTH_GUARD_DEV'] === '1' || IS_DEV
const CANONICAL_HOST = (process.env['NEXT_CANONICAL_HOST'] || '').toLowerCase()
const ENFORCE_HTTPS = false
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180
const DEFAULT_LOCALE: Supported = 'en'

const PROTECTED_PREFIXES = ['portal', 'portal-dashboard', 'account', 'billing', 'quantum-vault'] as const
const PUBLIC_PREFIXES = ['login', 'signup', 'auth', 'reset-password', 'forgot-password', 'verify'] as const

function addSecurityHeaders(response: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.anthropic.com https://api.openai.com https://*.supabase.co https://*.sentry.io https://*.upstash.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

function isStaticFile(pathname: string): boolean {
  return /\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot|css|js|json|xml|txt|map|wasm)$/.test(pathname)
}

function shouldBypass(req: NextRequest): boolean {
  const { pathname } = req.nextUrl
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.startsWith('/auth/callback') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/offline.html' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    isStaticFile(pathname)
  )
}

function detectLocale(req: NextRequest): Supported {
  const cookieLang = req.cookies.get('NEXT_LOCALE')?.value as Supported | undefined
  if (cookieLang && SUPPORTED.includes(cookieLang)) {
    return cookieLang
  }

  const acceptLang = req.headers.get('accept-language') || ''
  for (const lang of SUPPORTED) {
    if (acceptLang.includes(lang)) {
      return lang
    }
  }

  return DEFAULT_LOCALE
}

function needsCanonicalHostRedirect(req: NextRequest): boolean {
  if (!CANONICAL_HOST || !ENFORCE_HTTPS) return false
  const host = req.headers.get('host') || ''
  return host.toLowerCase() !== CANONICAL_HOST && host.toLowerCase() !== `www.${CANONICAL_HOST}`
}

function isPublicRoute(pathname: string): boolean {
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length < 2) return false
  const routeSegment = pathSegments[1]
  return PUBLIC_PREFIXES.some((prefix) => routeSegment === prefix)
}

function isProtectedRoute(pathname: string): boolean {
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length < 2) return false
  const routeSegment = pathSegments[1]
  if (!routeSegment) return false
  return PROTECTED_PREFIXES.some((prefix) => routeSegment.startsWith(prefix))
}

function hasSession(req: NextRequest): boolean {
  return !!(
    req.cookies.get('sb-access-token') ||
    req.cookies.get('sb-refresh-token') ||
    req.cookies.get('supabase-auth-token')
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 0) Bypass pentru assets
  if (shouldBypass(req)) {
    return NextResponse.next()
  }

  // 1) Bypass API routes (no language prefix needed)
  if (pathname.startsWith('/api/')) {
    return addSecurityHeaders(NextResponse.next())
  }

  // 2) Canonical host redirect (production only)
  if (needsCanonicalHostRedirect(req)) {
    const url = req.nextUrl.clone()
    url.protocol = 'https:'
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, { status: 308 })
  }

  // 3) HTTPS enforcement (production only)
  if (ENFORCE_HTTPS && req.headers.get('x-forwarded-proto') !== 'https') {
    const url = req.nextUrl.clone()
    url.protocol = 'https:'
    return NextResponse.redirect(url, { status: 308 })
  }

  // 4) i18n redirect
  const pathSegments = pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]

  if (!firstSegment || !SUPPORTED.includes(firstSegment as Supported)) {
    const detected = detectLocale(req)
    const newPath = `/${detected}${pathname === '/' ? '' : pathname}`
    const url = req.nextUrl.clone()
    url.pathname = newPath

    const res = NextResponse.redirect(url)
    res.cookies.set('NEXT_LOCALE', detected, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: ENFORCE_HTTPS
    })
    return addSecurityHeaders(res)
  }

  // 5) Auth guard (disabled in dev)
  if (!DISABLE_GUARD_DEV && isProtectedRoute(pathname) && !isPublicRoute(pathname)) {
    if (!hasSession(req)) {
      const lang = firstSegment as Supported
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = `/${lang}/login`
      loginUrl.searchParams.set('redirectTo', pathname)
      return addSecurityHeaders(NextResponse.redirect(loginUrl))
    }
  }

  // 6) Default response cu security headers
  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}