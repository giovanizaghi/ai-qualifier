import type { NextConfig } from "next";
import { env } from "./src/lib/env";

const nextConfig: NextConfig = {
  // Performance optimizations for production
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression and caching
  compress: true,
  poweredByHeader: false,
  
  // Asset prefix for CDN
  ...(env.ASSET_PREFIX && {
    assetPrefix: env.ASSET_PREFIX,
  }),

  // Security headers for production
  async headers() {
    const cspHeader = env.NODE_ENV === 'production'
      ? `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https:;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
      `.replace(/\s{2,}/g, ' ').trim()
      : `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https:;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
      `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          },
          ...(env.NODE_ENV === 'production' ? [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            }
          ] : [])
        ]
      },
      // API routes security
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: env.CORS_ORIGINS.join(', ')
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'X-RateLimit-Limit',
            value: env.RATE_LIMIT_MAX_REQUESTS.toString()
          }
        ]
      }
    ];
  },

  // Redirects for production
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // Force HTTPS in production
      ...(env.NODE_ENV === 'production' ? [
        {
          source: '/(.*)',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: `https://${env.NEXT_PUBLIC_APP_URL.replace('https://', '')}/$1`,
          permanent: true,
        }
      ] : [])
    ];
  },

  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      if (process.env.ANALYZE) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: '../analyze/client.html'
          })
        );
      }
      return config;
    },
  }),

  // Production optimizations
  ...(env.NODE_ENV === 'production' && {
    swcMinify: true,
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: env.DEBUG_MODE,
    },
  },

  // Output configuration
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VERCEL_ANALYTICS_ID: env.VERCEL_ANALYTICS_ID || '',
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: env.GOOGLE_ANALYTICS_ID || '',
    NEXT_PUBLIC_SENTRY_DSN: env.SENTRY_DSN || '',
    NEXT_PUBLIC_FEATURE_AI_TUTORING: env.FEATURE_AI_TUTORING.toString(),
    NEXT_PUBLIC_FEATURE_ADVANCED_ANALYTICS: env.FEATURE_ADVANCED_ANALYTICS.toString(),
    NEXT_PUBLIC_FEATURE_PAYMENT_PROCESSING: env.FEATURE_PAYMENT_PROCESSING.toString(),
    NEXT_PUBLIC_FEATURE_SOCIAL_LOGIN: env.FEATURE_SOCIAL_LOGIN.toString(),
  },
};

export default nextConfig;