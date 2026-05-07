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
};

export default nextConfig;
