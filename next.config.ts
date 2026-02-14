import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack uses this repo as the root (avoids picking up parent lockfiles)
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
    ],
  },
};

export default nextConfig;
