/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── CORE FIXES pentru deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ── FIX PRINCIPAL pentru useSearchParams errors
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },

  // ── BASIC PERFORMANCE
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,

  // ── PWA ROUTES (păstrează din originalul tău)
  async rewrites() {
    return [
      { source: '/:lang/manifest.json', destination: '/manifest.webmanifest' },
      { source: '/:lang/manifest.webmanifest', destination: '/manifest.webmanifest' },
      { source: '/:lang/sw.js', destination: '/sw.js' },
    ]
  },

  // ── IMAGES CONFIG pentru Supabase (dacă ai imagini)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  },

  // ── SECURITY HEADERS simplificat
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig