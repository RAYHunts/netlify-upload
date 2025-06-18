import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8888',
        pathname: '/.netlify/functions/get-image**',
      },
      {
        protocol: 'https',
        hostname: '*.netlify.app',
        pathname: '/.netlify/functions/get-image**',
      },
    ],
  },
};

export default nextConfig;
