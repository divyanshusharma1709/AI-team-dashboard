/** @type {import('next').NextConfig} */
const nextConfig = {
  // Frontend should use an explicit backend URL in deployed environments.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
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
