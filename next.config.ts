import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Fix 406 errors by setting comprehensive headers
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
  webpack: (config, { dev, isServer }) => {
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

export default nextConfig;
