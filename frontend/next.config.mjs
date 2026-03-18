/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure environment variables (local-first for dev)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
  },

  // Next.js dev warning fix for alternate local loopback origin
  allowedDevOrigins: ['127.0.2.2', 'localhost', '127.0.0.1'],

  reactStrictMode: true,
  output: 'standalone',

  // Configure headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
export default nextConfig; 
