import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '://googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Tell Next.js 15 to completely skip compiling both of these on the server
  serverExternalPackages: ['firebase-admin', 'jwks-rsa'],
};

export default nextConfig;

