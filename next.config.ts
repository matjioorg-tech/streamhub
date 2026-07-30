import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Proxy /api/v1/* to the backend so the browser can use same-origin URLs.
   * Required for mobile + ngrok: loopback in NEXT_PUBLIC_API_URL only works on the dev machine.
   */
  async rewrites() {
    const raw =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:3000';
    const base = raw.trim().replace(/\/$/, '').replace(/\/api\/v1\/?$/i, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${base}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.telnewstreams.dpdns.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.us-east-005.backblazeb2.com',
        pathname: '/telegram-files/**',
      },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
