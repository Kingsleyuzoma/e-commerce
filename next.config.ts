import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['firebase-admin', 'jwks-rsa', 'jose'],
  serverExternalPackages: ['firebase-admin', 'jwks-rsa'],
};

export default nextConfig;