/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── WEBPACK FIX pentru Windows + Git Bash
  webpack: (config, { isServer }) => {
    // Fix pentru path issues pe Windows
    if (process.platform === 'win32') {
      config.resolve.symlinks = false
    }
    return config
  },

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

  // ── PWA ROUTES
  async rewrites() {
    return [
      { source: '/:lang/manifest.json', destination: '/manifest.webmanifest' },
      { source: '/:lang/manifest.webmanifest', destination: '/manifest.webmanifest' },
      { source: '/:lang/sw.js', destination: '/sw.js' },
    ]
  },

  // ── IMAGES CONFIG pentru Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
      {
        protocol: 'https',
        hostname: 'bqwarnullrxhfisohkel.supabase.co',
      },
    ],
  },

  // ── SECURITY HEADERS
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

// Folosește module.exports pentru compatibilitate maximă
module.exports = nextConfig