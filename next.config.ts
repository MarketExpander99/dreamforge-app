import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Make sure adding Sentry to your webpack config is the last plugin
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.skill-gain.com',
          },
        ],
        destination: 'https://skill-gain.com/:path*',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'sample-videos.com',
      },
      {
        protocol: 'https',
        hostname: 'www.soundjay.com',
      },
    ],
  },
  // Fix 406 errors by setting comprehensive headers..
  async headers() {
    return [
      {
        // Match ALL routes (catch-all for 406 errors)
        source: '/:path*',
        headers: [
          {
            key: 'Accept',
            value: '*/*',
          },
          {
            key: 'Accept-Encoding',
            value: 'gzip, deflate, br, identity',
          },
          {
            key: 'Accept-Language',
            value: 'en-US,en;q=0.9,*;q=0.5',
          },
          {
            key: 'User-Agent',
            value: 'Mozilla/5.0 (compatible; SkillGain/1.0)',
          },
        ],
      },
      {
        // Specific headers for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Accept',
            value: 'application/json, text/plain, text/html, */*',
          },
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'X-Requested-With',
            value: 'XMLHttpRequest',
          },
        ],
      },
      {
        // Headers for static files and assets
        source: '/_next/:path*',
        headers: [
          {
            key: 'Accept',
            value: '*/*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Headers for public assets
        source: '/public/:path*',
        headers: [
          {
            key: 'Accept',
            value: '*/*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        // CORS headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept, Accept-Encoding',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
  // PWA Configuration
  serverExternalPackages: ['workbox-webpack-plugin'],
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (!dev && !isServer) {
      const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

      config.plugins.push(
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc: './public/sw.js',
          swDest: 'sw.js',
          exclude: [
            /\.map$/,
            /^manifest.*\.js$/,
            /\/_next\/static\/.*\.js$/,
          ],
        })
      );
    }

    return config;
  },
  // Enable Turbopack compatibility
  turbopack: {},
  // Disable compression to avoid 406 issues
  compress: false,
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "skill-gain",
  project: "skill-gain-platform",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
