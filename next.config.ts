import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.68.102'],
  headers: async () => [{ source: '/(.*)', headers: securityHeaders }],
};

export default nextConfig;
