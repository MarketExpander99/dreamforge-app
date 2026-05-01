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
};

export default nextConfig;
