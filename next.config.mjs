// next.config.mjs
/** @type {import('next').NextConfig} */

const DEV = process.env.NODE_ENV !== 'production'

// ── External endpoints (adjust as needed)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL // e.g. https://xxxx.supabase.co
const STRIPE_ALLOWED = [
  'https://api.stripe.com',
  'https://checkout.stripe.com',
  'https://js.stripe.com',
  'https://hooks.stripe.com',
]
const AI_APIS = [
  'https://api.openai.com',
  'https://api.anthropic.com',
]
const EMAIL_APIS = ['https://api.resend.com']
const CLOUDFLARE_ANY = ['https://*.cloudflare.com']
const CDN_WS_ANY = ['wss:', 'https:'] // keep generic; restrict if you know exact hosts

// OAuth providers you’ll actually use (tightens CSP for popups/iframes)
const OAUTH_PROVIDERS = [
  'https://accounts.google.com',
  'https://appleid.apple.com',
]

// Optional cross-origin isolation (ONLY if you really need SharedArrayBuffer etc.)
const ENABLE_COI = process.env.NEXT_ENABLE_CROSS_ORIGIN_ISOLATION === '1'

// ── CSP builder (dev vs prod)
function buildCSP() {
  // DEV: allow eval/HMR; PROD: no 'unsafe-eval'
  const scriptSrc = DEV
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'", "'inline-speculation-rules'", 'https:']
    : ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", "'inline-speculation-rules'", 'https:']

  const styleSrc = ["'self'", "'unsafe-inline'", 'https:', 'data:']
  const imgSrc = ["'self'", 'data:', 'blob:', 'https:']
  const fontSrc = ["'self'", 'https:', 'data:']
  const mediaSrc = ["'self'", 'https:', 'data:']
  const workerSrc = ["'self'", 'blob:'] // SW/Workers
  const manifestSrc = ["'self'"]
  const baseUri = ["'self'"]
  const formAction = ["'self'"]
  const objectSrc = ["'none'"] // hardening

  // Stripe needs frames/redirects; OAuth providers open popups/iframes
  const frameSrc = [...STRIPE_ALLOWED, ...OAUTH_PROVIDERS]

  // connect-src: XHR/fetch/WebSocket endpoints
  const connectSrc = [
    "'self'",
    SUPABASE_URL,
    ...STRIPE_ALLOWED,
    ...AI_APIS,
    ...EMAIL_APIS,
    ...CLOUDFLARE_ANY,
    ...CDN_WS_ANY,
  ].filter(Boolean)

  // helper
  const d = (name, values) => `${name} ${values.join(' ')}`

  const directives = [
    d('default-src', ["'self'"]),
    d('base-uri', baseUri),
    d('form-action', formAction),
    d('object-src', objectSrc),
    d('script-src', scriptSrc),
    d('style-src', styleSrc),
    d('img-src', imgSrc),
    d('media-src', mediaSrc),
    d('font-src', fontSrc),
    d('worker-src', workerSrc),
    d('connect-src', connectSrc),
    d('manifest-src', manifestSrc),
    d('frame-src', frameSrc),
    d('child-src', frameSrc), // Safari legacy mirror for frame-src
    d('frame-ancestors', ["'none'"]),
    // Good to keep in production; harmless in dev but we keep it off to avoid surprises on HTTP
    !DEV && 'upgrade-insecure-requests',
    // Optionally add CSP reporting if you stand up an endpoint:
    // 'report-to csp-endpoint; report-uri https://csp-report.porverse.com/report',
  ].filter(Boolean)

  return directives.join('; ')
}

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: buildCSP() },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), interest-cohort=()' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // frame-ancestors in CSP is the real control; we keep this as a defense-in-depth extra
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '0' },
  // HSTS is useful only on HTTPS/prod. Keep set; it’s ignored on HTTP.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // COOP/COEP: enable only when you need cross-origin isolation
  ...(ENABLE_COI
    ? [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
      ]
    : [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      ]),
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,

  // Enterprise discipline
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // App-wide security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ]
  },

  // Keep your PWA paths stable behind i18n subpaths
  async rewrites() {
    return [
      { source: '/:lang/manifest.json', destination: '/manifest.webmanifest' },
      { source: '/:lang/manifest.webmanifest', destination: '/manifest.webmanifest' },
      { source: '/:lang/sw.js', destination: '/sw.js' },
    ]
  },

  // If you use next/image with remote assets, configure remotePatterns
  // images: {
  //   remotePatterns: SUPABASE_URL
  //     ? [{ protocol: 'https', hostname: new URL(SUPABASE_URL).hostname, pathname: '/storage/v1/**' }]
  //     : [],
  // },

  // Optional: smaller production container image
  // output: 'standalone',

  // Helpful perf tweak for large UI libs (optional; safe to remove)
  // experimental: {
  //   optimizePackageImports: [
  //     '@supabase/auth-helpers-nextjs',
  //     'lucide-react',
  //     '@radix-ui/react-icons',
  //   ],
  // },
}

export default nextConfig
