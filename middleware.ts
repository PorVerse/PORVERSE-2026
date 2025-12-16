// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Enterprise middleware (PorVerse):
 * - i18n redirect (cookie -> Accept-Language -> fallback)
 * - canonical host redirect
 * - HTTPS enforce (production)
 * - strict bypass for API/static/PWA assets
 * - public routes explicit (login/signup/callback/reset) — evită bucle
 * - protected routes guard (Supabase cookies heuristic)
 * - dev mode: guard OFF (prod: ON)
 * - TIER 1: Security Headers (CSP, X-Frame-Options, etc.)
 */

const SUPPORTED = ['en', 'ro'] as const
type Supported = (typeof SUPPORTED)[number]

// ---- Flags & config via env ----
const IS_DEV = process.env['NODE_ENV'] !== 'production'
const DISABLE_GUARD_DEV =
  process.env['NEXT_DISABLE_AUTH_GUARD_DEV'] === '1' || IS_DEV // în dev, guard-ul e OFF
const CANONICAL_HOST = (process.env['NEXT_CANONICAL_HOST'] || '').toLowerCase() // ex: "porverse.com"
const ENFORCE_HTTPS = process.env['NODE_ENV'] === 'production'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 days
const DEFAULT_LOCALE: Supported = 'en'

// Rute protejate după segmentul imediat următor limbii
const PROTECTED_PREFIXES = [
  'portal',
  'portal-dashboard',
  'account',
  'billing',
  'quantum-vault',
] as const

// Rute publice — nu se aplică guard
const PUBLIC_PREFIXES = [
  'login',
  'signup',
  'auth',            // ex: /{lang}/auth/callback
  'reset-password',
  'forgot-password',
  'verify',
] as const

// ---- TIER 1: Security Headers Configuration ----
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
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
    "upgrade-insecure-requests"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS - doar în production
  if (ENFORCE_HTTPS) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return response
}

// ---- Helpers ----
function isStaticFile(pathname: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(pathname)
}

function shouldBypass(req: NextRequest): boolean {
  const p = req.nextUrl.pathname
  return (
    p.startsWith('/_next/') ||
    p.startsWith('/api/') ||
    p.startsWith('/icons/') ||
    p.startsWith('/.well-known/') ||
    p === '/sw.js' ||
    p === '/manifest.webmanifest' ||
    isStaticFile(p)
  )
}

function pickLocale(req: NextRequest): Supported {
  // 1) cookie
  const v = req.cookies.get('i18n_locale')?.value
  if (v && SUPPORTED.includes(v as Supported)) return v as Supported
  // 2) Accept-Language
  const al = req.headers.get('accept-language') ?? ''
  const base = al.split(',')[0]?.trim().toLowerCase().split('-')[0]
  if (base && SUPPORTED.includes(base as Supported)) return base as Supported
  // 3) fallback
  return DEFAULT_LOCALE
}

function needsCanonicalHostRedirect(req: NextRequest): boolean {
  if (!CANONICAL_HOST) return false
  return req.nextUrl.hostname.toLowerCase() !== CANONICAL_HOST
}

function needsHttpsRedirect(req: NextRequest): boolean {
  if (!ENFORCE_HTTPS) return false
  const xfProto = req.headers.get('x-forwarded-proto')
  return !!xfProto && xfProto !== 'https'
}

function ensureI18nCookie(req: NextRequest, res: NextResponse, locale: Supported) {
  if (!req.cookies.get('i18n_locale')?.value) {
    res.cookies.set('i18n_locale', locale, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: COOKIE_MAX_AGE,
    })
  }
}

/** Heuristică Supabase în Edge: în dev → OFF; în prod → verifică cookie-uri relevante */
function isAuthenticated(req: NextRequest): boolean {
  if (DISABLE_GUARD_DEV) return true
  const names = req.cookies.getAll().map((c) => c.name.toLowerCase())
  const hasAccess = names.includes('sb-access-token')
  const hasToken =
    names.includes('supabase-auth-token') ||
    names.includes('sb:token') ||
    names.some((n) => n.startsWith('sb-') && n.endsWith('-auth-token'))
  return hasAccess || hasToken
}

function buildRedirect(req: NextRequest, targetUrl: URL, localeToSet?: Supported) {
  const res = NextResponse.redirect(targetUrl, { status: 307 })
  if (localeToSet) ensureI18nCookie(req, res, localeToSet)
  res.headers.set('Vary', 'Accept-Language, Cookie')
  res.headers.set('X-PV-Auth-Guard', DISABLE_GUARD_DEV ? 'disabled-dev' : 'enabled')
  
  // TIER 1: Add security headers
  return addSecurityHeaders(res)
}

function buildLoginUrl(req: NextRequest, lang: Supported) {
  const next = req.nextUrl.pathname + (req.nextUrl.search || '')
  const url = req.nextUrl.clone()
  url.pathname = `/${lang}/login`
  url.searchParams.set('next', next)
  return url
}

// ---- Main ----
export function middleware(req: NextRequest) {
  const { pathname, search, hash } = req.nextUrl

  // 0) Bypass total pentru asset-uri/API/PWA
  if (shouldBypass(req)) {
    const res = NextResponse.next()
    res.headers.set('Vary', 'Accept-Language, Cookie')
    res.headers.set('X-PV-Auth-Guard', DISABLE_GUARD_DEV ? 'disabled-dev' : 'enabled')
    // TIER 1: Add security headers (chiar și pentru bypass, pentru consistență)
    return addSecurityHeaders(res)
  }

  // 1) Canonical host
  if (needsCanonicalHostRedirect(req)) {
    const u = new URL(req.url)
    u.host = CANONICAL_HOST
    return buildRedirect(req, u)
  }

  // 2) HTTPS enforce
  if (needsHttpsRedirect(req)) {
    const u = new URL(req.url)
    u.protocol = 'https:'
    return buildRedirect(req, u)
  }

  // 3) Locale prefix handling
  const firstSeg = pathname.split('/').filter(Boolean)[0]
  const localized = !!firstSeg && SUPPORTED.includes(firstSeg as Supported)

  if (!localized) {
    const locale = pickLocale(req)
    const dest = new URL(`/${locale}${pathname}${search}${hash}`, req.url)
    return buildRedirect(req, dest, locale)
  }

  const lang = firstSeg as Supported

  // 3.a) root localizat → dashboard
  if (pathname === `/${lang}` || pathname === `/${lang}/`) {
    const u = new URL(req.url)
    u.pathname = `/${lang}/portal-dashboard`
    return buildRedirect(req, u, lang)
  }

  // 3.b) Public vs Protected
  const segments = pathname.split('/').filter(Boolean) // [lang, firstAfterLang, ...]
  const firstAfterLang = (segments[1] || '').toLowerCase()

  // Public?
  const isPublic = PUBLIC_PREFIXES.some((p) => {
    const px = p.toLowerCase()
    return firstAfterLang === px || pathname.toLowerCase().startsWith(`/${lang}/${px}/`)
  })
  if (isPublic) {
    const res = NextResponse.next()
    ensureI18nCookie(req, res, lang)
    res.headers.set('Vary', 'Accept-Language, Cookie')
    res.headers.set('X-PV-Auth-Guard', DISABLE_GUARD_DEV ? 'disabled-dev' : 'enabled')
    // TIER 1: Add security headers
    return addSecurityHeaders(res)
  }

  // Protected?
  const isProtected = PROTECTED_PREFIXES.some((p) => {
    const px = p.toLowerCase()
    return firstAfterLang === px || pathname.toLowerCase().startsWith(`/${lang}/${px}/`)
  })
  if (isProtected && !isAuthenticated(req)) {
    const loginUrl = buildLoginUrl(req, lang)
    return buildRedirect(req, loginUrl, lang)
  }

  // 3.c) continuă & setează cookie i18n dacă lipsește
  const res = NextResponse.next()
  ensureI18nCookie(req, res, lang)
  res.headers.set('Vary', 'Accept-Language, Cookie')
  res.headers.set('X-PV-Auth-Guard', DISABLE_GUARD_DEV ? 'disabled-dev' : 'enabled')
  // TIER 1: Add security headers
  return addSecurityHeaders(res)
}

// ---- Matcher: excludem asset/API/manifest/sw etc. ----
export const config = {
  matcher: [
    '/((?!_next/|api/|icons/|\\.well-known/|sw\\.js$|manifest\\.webmanifest$|.*\\.[a-zA-Z0-9]+$).*)',
  ],
}