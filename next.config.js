/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
  ],
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/privacy', destination: '/privacy/index.html' },
        { source: '/privacy/', destination: '/privacy/index.html' },
      ],
    }
  },
}

export default nextConfig
