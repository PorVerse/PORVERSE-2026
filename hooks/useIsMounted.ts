import type { NextConfig } from 'next'

// Minimal, SW-friendly security headers for PWA + APIs
const csp = [
  "default-src 'self'",
  // Allow inline styles from Next/Tailwind hydration + fonts
  "style-src 'self' 'unsafe-inline' https: data:",
  // Scripts (no 'unsafe-inline'; Next uses hashed scripts automatically)
  "script-src 'self' https: 'wasm-unsafe-eval' 'inline-speculation-rules'",
  // Images (allow data: for icons/placeholders)
  "img-src 'self' data: blob: https:",
  // Media optional
  "media-src 'self' https: data:",
  // Fonts
  "font-src 'self' https: data:",
  // Workers (service worker, web workers)
  "worker-src 'self' blob:",
  // Connections (Supabase, OpenAI, Anthropic, Stripe, Resend, Cloudflare, WS for realtime)
  [
    "connect-src 'self'",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://api.resend.com',
    'https://api.stripe.com',
    'https://checkout.stripe.com',
    'https://*.cloudflare.com',
    'wss:',
    'https:'
  ].filter(Boolean).join(' '),
  // Manifest / prefetch
  "manifest-src 'self'",
  "prefetch-src 'self' https:",
  // Frames only for Stripe checkout (iframed)
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), interest-cohort=()' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '0' },
  // HSTS (safe for production with HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep App Router features enabled
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
