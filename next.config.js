/**
 * Next.js Configuration
 * SUPER ENTERPRISE INTERSTELLAR Level
 * 
 * Features:
 * - Security headers (OWASP recommendations)
 * - Performance optimization
 * - Bundle analysis
 * - Image optimization
 * - Compression
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for better development
  reactStrictMode: true,

  // Enable SWC minification
  swcMinify: true,

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // HSTS - Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              'camera=(self)',
              'microphone=(self)',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()'
            ].join(', ')
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-inline
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.anthropic.com https://api.openai.com https://*.supabase.co wss://*.supabase.co",
              "media-src 'self' blob:",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  },

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Framework chunk (React, Next.js, etc.)
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true
          },
          // Vendor chunk (other dependencies)
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20
          },
          // Common chunk (shared code)
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          },
          // UI libraries
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](@headlessui|@heroicons|framer-motion)[\\/]/,
            chunks: 'all',
            priority: 30
          },
          // AI libraries
          ai: {
            name: 'ai',
            test: /[\\/]node_modules[\\/](openai|@anthropic-ai)[\\/]/,
            chunks: 'all',
            priority: 30
          }
        },
        maxInitialRequests: 25,
        minSize: 20000
      }
    }

    return config
  },

  // Experimental features
  experimental: {
    // Enable React Server Components optimizations
    optimizePackageImports: ['@headlessui/react', '@heroicons/react'],
    
    // Turbopack (faster dev server)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.APP_VERSION || '2.0.0',
  },

  // Redirects
  async redirects() {
    return [
      // Redirect old routes
      {
        source: '/dashboard',
        destination: '/portal-dashboard',
        permanent: true
      }
    ]
  },

  // Rewrites (for API proxying if needed)
  async rewrites() {
    return [
      // Example: Proxy external API
      // {
      //   source: '/api/external/:path*',
      //   destination: 'https://external-api.com/:path*'
      // }
    ]
  },

  // TypeScript
  typescript: {
    // Type checking enabled - all type errors must be fixed
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Compression
  compress: true,

  // Power settings
  poweredByHeader: false,

  // Generate ETags for caching
  generateEtags: true,

  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Output
  output: 'standalone', // For Docker deployments
}

// Bundle analyzer (run with ANALYZE=true npm run build)
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  })
  module.exports = withBundleAnalyzer(nextConfig)
} else {
  module.exports = nextConfig
}